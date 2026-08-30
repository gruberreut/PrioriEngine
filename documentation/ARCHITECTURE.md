# Priori — Architecture

## Product Purpose

Priori is a **personal cognitive assistant** for task selection. Rather than showing a list of everything, it ranks tasks dynamically for the current moment and surfaces the top N (default 3) most relevant ones, reducing decision fatigue and friction between intention and action.

---

## Current State

| Layer | Status | Notes |
|-------|--------|-------|
| `packages/engine` | Built and tested | Ranking engine + CLI; consumed as a library by `apps/api` |
| `apps/api` | Built | Node.js HTTP server, Drizzle + PostgreSQL, CRUD + rank routes |
| `apps/web` | In progress | React + Vite SPA; ranking UI and component library underway |

---

## Repository Structure

```
priori/                         # npm workspace root
  packages/
    engine/                     # domain library + CLI
      src/
        types.ts                # all shared types (RawTask, NormalizedTask, RankResult, …)
        taskLoader.ts           # JSON → LoadedTask[]
        normalizer.ts           # LoadedTask[] → NormalizedTask[] + ExclusionRecord[]
        ranker.ts               # NormalizedTask[] + RuntimeParams → RankResult
        output.ts               # RankResult → plain-text string
        cliParse.ts             # argv → RuntimeParams + task file path
        runCli.ts               # wires the four stages; thin error reporter
        cli.ts                  # process entry point (excluded from coverage)
      test/
        *.test.ts               # Vitest test files
        fixtures/               # structured scenario fixtures (JSON)
        data/tasks.example.json # realistic sample used as default CLI input
  apps/
    api/                        # HTTP server
      src/
        db/
          schema.ts             # Drizzle table definitions (users, contexts, tasks)
          index.ts              # DB connection singleton
          queries.ts            # shared query functions (used by >1 route)
          migrations.ts         # migration runner
          seed.ts               # dev user seeding
        lib/
          http.ts               # shared utilities: json(), readBody(), setCorsHeaders()
        routes/
          tasks.ts              # GET/POST /api/tasks, POST /api/tasks/:id/split
          contexts.ts           # GET/POST /api/contexts
          rank.ts               # POST /api/rank
        server.ts               # startup: DB init, dev user lookup, handler wiring
      drizzle/                  # generated migration SQL files
      API.md                    # endpoint documentation (kept in sync with every change)
    web/                        # React + Vite SPA
      src/
        components/             # generic UI primitives (Checkbox, Icon, Select, …)
        features/
          ranking/              # ranking screen components (TaskCard, ParamsForm, …)
          tasks/                # task-editing components (DurationPicker, PriorityPicker, …)
        styles/tokens.css       # design tokens (colors, spacing, radius)
  documentation/                # design docs and architecture
```

**Dependency direction (enforced):**
`apps/api` → `packages/engine` (workspace import, in-process)
`apps/web` → HTTP only → `apps/api` (no engine import in the browser bundle)

---

## Engine Pipeline

Every ranking request flows through four stages in sequence:

```
tasks (array or file)
    │
    ▼
taskLoader      — reads file or accepts array; flattens nested tree into LoadedTask[] preserving parent refs
    │
    ▼
normalizer      — resolves inherited fields; filters non-leaf, completed, invalid tasks
    │
    ▼
ranker          — context/location filter → score each task → sort → slice top N
    │
    ▼
output          — formats RankResult as plain text (with optional score breakdown)
```

The CLI wires all four stages via `runCli.ts`. The API uses `rankFromPayload(rawTasks, params)` — an engine entry point that skips file I/O and accepts tasks and params directly.

### Stage 1 — Task Loader (`taskLoader.ts`)

Reads a JSON file that is either a bare array or `{ tasks: [...] }`. Recursively flattens the tree depth-first into `LoadedTask[]`, attaching a `parent` reference and `depth` to each node.

### Stage 2 — Normalizer (`normalizer.ts`)

For each `LoadedTask`, walks the parent chain with `inheritedValue` to resolve any missing field from an ancestor. Child tasks only need to declare fields that differ from their parent.

After resolving fields, three filters run in order:

1. **Non-leaf exclusion** — tasks with children are grouping containers, not rankable.
2. **Completed exclusion** — `status: "completed"` tasks are removed.
3. **Validation** — `priority` must be 1–10; priority 1 requires `dueDate`; priority 10 requires `recurrence`; `duration` must be positive.

Each excluded task produces an `ExclusionRecord` (reason + detail) that surfaces in `--explain` mode.

### Stage 3 — Ranker (`ranker.ts`)

**In-progress block:** If any task has `status: "in_progress"`, ranking is skipped and the response enters `in_progress_block` mode.

**Context filter (hard):** Tasks whose `contexts` array does not contain the runtime context are excluded (case-insensitive exact match).

**Scoring:** Each remaining task receives a composite score:

| Component | Formula | Default weight |
|-----------|---------|----------------|
| Priority score | `(11 - priority) × wPriority` | 1.0 |
| Urgency aging | `daysSince(priorityUpdatedAt) × wUrgency` | 0.25 |
| Energy fit | `{exact→2, ±1→1, ±2→0} × wEnergy` | 1.0 |
| Duration fit | `{fits→+2, exceeds→-2} × wDuration` | 1.0 |
| Flow bonus | `+1.5 × wFlow` if `projectId == lastCompletedProject` | 1.0 |
| Suggestion penalty | `-1 × wSuggestion` if suggested within recency window | 1.0 |

Recency window: 24 h for non-recurring tasks; matches the recurrence period for recurring ones.

**Tie-breaking (deterministic):** total score → lower priority number → older `priorityUpdatedAt` → shorter `duration` → `id` lexicographic.

### Stage 4 — Output (`output.ts`)

Formats `RankResult` as plain text. In `--explain` mode, prints per-task scores and the full exclusion list.

---

## API Layer (`apps/api`)

### HTTP server

Node.js built-in `node:http` — no framework. Listening on port 3001. CORS enabled (OPTIONS preflight + headers on every response).

### Route handler pattern

Each route file exports a factory function `create<Entity>Handler(db, userId)` that returns a `(req, res, pathname, method) => Promise<boolean>` handler. The handler returns `true` if it matched and responded, `false` to pass through. `server.ts` iterates the handler list and is responsible only for startup; it never contains route logic.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tasks` | List all tasks for dev user |
| `POST` | `/api/tasks` | Create a task |
| `POST` | `/api/tasks/:id/split` | Atomically split a task into parent + original + blank sibling |
| `GET` | `/api/contexts` | List all contexts for dev user |
| `POST` | `/api/contexts` | Create a context |
| `POST` | `/api/rank` | Rank tasks against runtime params |

No URL versioning (`/api/v1/...`) — paths are plain `/api/...`. If a breaking API change is needed, versioning can be added at that point.

### Authentication

Not yet implemented. A single dev user (`dev@priori.local`) is seeded and looked up at startup. All routes operate on behalf of this user via a hardcoded `userId` passed into each handler factory.

---

## Database

PostgreSQL, accessed via **Drizzle ORM**. Migrations are SQL files generated by Drizzle Kit, stored in `apps/api/drizzle/`.

### Schema

**`users`** — one row per user.
- `id` (uuid PK), `email` (unique), `createdAt`

**`contexts`** — per-user named labels for grouping tasks.
- `id` (uuid PK), `userId` (FK → users), `name`, `createdAt`
- Unique constraint on `(userId, name)`

**`tasks`** — core task records.
- `id` (uuid PK, client-generated), `userId` (FK → users), `parentId` (self-ref, nullable), `contextId` (FK → contexts, nullable)
- `title`, `priority` (1–10), `priorityUpdatedAt`, `dueDate` (nullable)
- `duration` (minutes), `energyRequired` (`low|medium|high`), `location` (`home|in-person|anywhere`)
- `status` (`pending|in_progress|completed`), `lastSuggestedAt` (nullable)
- `createdAt`, `updatedAt`

> **Note:** The DB schema does not have a `recurrence` field. Recurrence is part of the engine's `RawTask` type (used for file-based CLI input) but has not been added to the DB yet. The suggestion penalty's recurrence window is therefore not active for DB-sourced tasks.

### Shared query pattern

When a query is needed by more than one route, it lives in `apps/api/src/db/queries.ts` (e.g. `queryTasks(db, userId)`). Route handlers import from there rather than inlining the same Drizzle call in multiple places.

---

## Frontend (`apps/web`)

React + Vite SPA. Calls `/api` over HTTP; no direct engine imports.

**Styling:** CSS Modules per component + global `tokens.css` for colors, spacing, and border-radius. No inline styles. Font sizes and weights are hardcoded in module CSS files.

**Structure:**
- `src/components/` — generic, reusable UI primitives (Checkbox, Icon, Select)
- `src/features/ranking/` — ranking screen feature components
- `src/features/tasks/` — task-editing feature components

**Component development:** Storybook is used for building and reviewing components in isolation before they are wired into pages.

---

## Data Model

### Task JSON (engine input)

Tasks are stored as a nested JSON tree for CLI use. All fields are optional on `RawTask`; the normalizer supplies defaults or inherits from ancestors.

```json
{
  "id": "task_1",
  "title": "Water plants",
  "priority": 4,
  "priorityUpdatedAt": "2026-04-15T10:00:00Z",
  "dueDate": null,
  "recurrence": null,
  "duration": 10,
  "energyRequired": "low",
  "location": "anywhere",
  "contexts": ["garden"],
  "projectId": "garden_maintenance",
  "parentId": null,
  "status": "pending",
  "createdAt": "2026-04-01T09:00:00Z",
  "lastSuggestedAt": null,
  "children": []
}
```

### Priority semantics

| Value | Meaning | Constraint |
|-------|---------|-----------|
| 1 | Hard due date | `dueDate` required |
| 2–4 | Short term (days) | — |
| 5–7 | Medium term (weeks) | — |
| 8–9 | Long term (months) | — |
| 10 | Ongoing / recurring | `recurrence` required |

### Task status

`pending` → `in_progress` → `completed`

Snooze is not a status. It sets `lastSuggestedAt = now` only — `priorityUpdatedAt` (and priority/context) are untouched. This is the mechanism `ranker.ts`'s `isRecentlySuggested`/`recurrenceWindowHours` already implement: the task is suppressed from ranking until the recurrence-based window (default 24h) elapses. This is the canonical description of snooze semantics — other documents in `documentation/` that describe a different mechanism predate this decision and have been marked superseded in place.

---

## Full-Stack Request Flow

```
Browser (React SPA)
        │  HTTPS JSON
        ▼
    apps/api  (port 3001)
   ┌─────────────────────────────────┐
   │  Route handler                  │
   │  queryTasks(db, userId)         │──► PostgreSQL
   │  rankFromPayload(tasks, params) │──► @priori/engine (in-process)
   └─────────────────────────────────┘
```

The engine is called **in-process as a library** — the API does not spawn a CLI per request. The `TaskSource` abstraction described in early design docs was not implemented; the rank handler directly queries the DB. If a file-based or remote task source is needed later, that abstraction can be introduced at that point.

DB rows are flat, linked only by `parentId` — the engine's `flattenTaskTree` expects a nested `RawTask.children` tree instead. `routes/rank.ts` reconstructs that tree from the flat rows (via `groupTasksByParent` in `queries.ts`) before calling `rankFromPayload`, so the engine's leaf-filtering, ancestor-chain, and field-inheritance logic all see real hierarchy. This step must not be skipped when the rank handler's task-loading path changes.

---

## User Flow (planned product)

1. **Task capture** — global `+` button; minimal required fields (title only); large estimates prompt optional subtask split.
2. **Choose a task** — user enters available time → engine ranks tasks → context carousel shows top 3 per context.
3. **Start** — task marked `in_progress`; blocks further recommendations until resolved.
4. **Return flow** — if `in_progress` task exists on open, user must act (done / snooze / edit / dismiss) before new recommendations appear.
5. **Completion** — brief celebration, then flow suggestions from the same project.
6. **Snooze / refresh** — sets `lastSuggestedAt = now` (see Task status above); engine suppresses the task for the recency window and reruns ranking.

---

## Explicitly Out of Scope (MVP)

- Adaptive learning / automatic weight tuning
- Calendar integration
- Collaborative / shared tasks
- Dependency graphs between tasks
- Automatic task splitting (splitting is a UX suggestion only)
- Notifications and reminders
- Full recurrence logic (beyond the penalty window)
- User authentication (single dev user for now)
