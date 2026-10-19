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
          docs.ts               # GET /openapi.yaml, GET /docs (Swagger UI)
        server.ts               # startup: DB init, dev user lookup, handler wiring
      drizzle/                  # generated migration SQL files
      openapi.yaml              # endpoint documentation (OpenAPI 3.0, kept in sync with every change)
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
| `PUT` | `/api/tasks/:id` | Update a task's status |
| `DELETE` | `/api/tasks/:id` | Delete a task, handling children (see below) |
| `POST` | `/api/tasks/:id/snooze` | Snooze a task (`lastSuggestedAt = now`) |
| `POST` | `/api/tasks/:id/split` | Atomically split a task into parent + original + blank sibling |
| `GET` | `/api/contexts` | List all contexts for dev user |
| `POST` | `/api/contexts` | Create a context |
| `POST` | `/api/rank` | Rank tasks against runtime params |
| `GET` | `/openapi.yaml` | Raw OpenAPI spec |
| `GET` | `/docs` | Swagger UI, reading `/openapi.yaml` |

No URL versioning (`/api/v1/...`) — paths are plain `/api/...`. If a breaking API change is needed, versioning can be added at that point.

**Delete semantics.** `DELETE /api/tasks/:id` is a single call, not a two-step "check then delete" — the caller may pass `{ childAction: "delete" | "reparent" }` up front. `"reparent"` sets each direct child's `parentId` to `null` (children become root tasks) then deletes the task; `"delete"` recursively removes the task and every descendant in one DB transaction. If the task has children and the caller sends no `childAction` (a race — the client's `hasChildren` read is stale, or it skipped the confirm step), the server defaults to `"reparent"` rather than `"delete"`, since silently destroying a subtree on an ambiguous request is the more dangerous failure mode; the confirm-dialog UX (TASKS.md § 12) is expected to always supply an explicit choice when it knows children exist, so the default is a safety net, not the primary path. Rejected alternative: a separate `GET .../children` check before delete — rejected because it's a TOCTOU race (children could be added between the check and the delete) that the single-call-with-optional-childAction design avoids entirely by deciding at delete time, inside the same transaction that reads the current children.

**`hasChildren`.** `queryTasks` (`apps/api/src/db/queries.ts`) computes `hasChildren: boolean` on every returned row from the rows it already fetched — `grouped.has(row.id)` via `groupTasksByParent`, no extra query. This flows through unchanged to `GET /api/tasks` and is merged onto `inProgressTask` in the `/api/rank` `in_progress_block` response (`routes/rank.ts`, looked up from the same `taskRows` already in scope). Note: because the engine's normalizer filters non-leaf tasks out of ranking candidacy entirely (see Engine Pipeline § above), a task with children can never actually be surfaced as `inProgressTask` — so `hasChildren` on that field will always read `false` in current practice. The merge is implemented as specified for forward compatibility (and because `queryTasks` computing it is free), but this is a latent inconsistency: if a task gains a child while it's `in_progress`, the next `/api/rank` call stops finding it as the blocking task at all, rather than reporting it with `hasChildren: true`. Not fixed here — flagged for whoever picks up TASKS.md § 13 (Cascading Task Completion) or a future pass on in-progress-task semantics, since fixing it means deciding what "in progress" should mean for a non-leaf task, not just a query change.

### Documentation

Endpoints are documented in `apps/api/openapi.yaml` (OpenAPI 3.0), hand-authored and served interactively via Swagger UI at `/docs`. Migrated from a hand-maintained `apps/api/API.md` once the API crossed the 5-endpoint / docs-upgrade threshold in `CLAUDE.md`. This is docs-only — no request/response validation library or schema-driven code generation was introduced; the spec still has to be kept in sync by hand, same discipline `API.md` used, just machine-readable and with an interactive view. `API.md` is kept in place as a pointer rather than deleted.

### Authentication

Not yet implemented. A single dev user (`dev@priori.local`) is seeded and looked up at startup. All routes operate on behalf of this user via a hardcoded `userId` passed into each handler factory.

---

## Database

PostgreSQL, accessed via **Drizzle ORM**. Migrations are SQL files generated by Drizzle Kit, stored in `apps/api/drizzle/`.

### Schema

**`users`** — one row per user.
- `id` (uuid PK), `email` (unique), `createdAt`

**`contexts`** — per-user named labels for grouping tasks.
- `id` (uuid PK), `userId` (FK → users), `name`, `slideIndex` (integer, see "Context theming" below), `createdAt`
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

**Styling:** CSS Modules per component + global `tokens.css` for colors, spacing, border-radius, and (as of the TempAppName migration) font families. No inline styles. Font sizes and weights are hardcoded in module CSS files.

**Design tokens (`tokens.css`) — three-layer structure.** Layer 1 is a raw, mode-independent palette (`--tendril-*`): plain color values with no light/dark or role semantics. Layer 2 is the set of semantic roles (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--control-height-*`, `--focus-ring*`, `--motion-*`) — what a value *means*, each pointing at a Layer 1 entry rather than a hex value. Rejected alternative: keep raw hexes directly on semantic names (the pre-TempAppName structure) — this makes re-theming mean rewriting every rule that touches color, which is what forced this restructure in the first place.

Layer 3 is per-component tokens (`--<component>-*`, e.g. `--bottom-nav-*`, `--fab-*`) — one labelled group per component, still declared in the same `tokens.css` file rather than scattered across component CSS. A `*.module.css` file references Layer 3 only, never a Layer 2 role directly, so one component's design can be adjusted (a different radius, a literal color divergence with a comment explaining why) without touching any other component or hunting through semantic roles that other components also depend on. Forces: this needed to work without a CSS preprocessor or a build step (see the duplicated dark blocks below — same constraint), and needed per-component adjustability that a flat set of shared roles can't give without every adjustment becoming a new globally-shared role. Rejected alternatives:
- **A single flat token layer** (components consume Layer 2 roles directly, no Layer 3) — this is what existed before Layer 3 was added; it meant any component-specific adjustment either mutated a role every other component also used, or fell back to a hardcoded value in that component's CSS, silently reintroducing the exact problem Layer 1/2 was built to solve.
- **Per-component CSS files owning their own values** — keeps knowledge local to each component but scatters the actual design values across dozens of files instead of one, defeating a project-wide visual audit (e.g. the radius-scale rename in the TempAppName migration) and making cross-component consistency unenforceable by inspection.
- **A generated `tokens.ts`** — would remove the `*.module.css`-references-Layer-3-only rule's manual-discipline dependence, but adds a build step and a generation pipeline for what is, at current token counts, a hand-authored CSS file already small enough to review directly; revisit if the token count or the number of contributors grows enough that drift becomes a real problem, same trigger condition as the duplicated dark-mode blocks below.

Layer 3 deliberately sits **outside** the light/dark split — no `--<component>-*` token gets its own dark-mode override. It inherits mode-awareness through whichever Layer 2 role it points at (`--fab-bg: var(--color-primary)` already resolves correctly in both modes because `--color-primary` does). A component that needs a value differing by mode and finds no existing role for it gets a new Layer 2 role (added to all three mode blocks) instead of a Layer-3-level override — keeping the light/dark split entirely inside Layer 2 rather than spread across every layer.

**Dark mode** is selected via `:root[data-theme="dark"]` (explicit user choice) or `@media (prefers-color-scheme: dark)` on `:root:not([data-theme="light"])` (OS-follow / no choice made yet). Both declare the same semantic-role custom properties pointing at the `--tendril-d-*` half of the Layer 1 palette. Plain CSS has no way to share a declaration block between a bare selector and one nested in `@media` without a preprocessor or build step, so the two blocks are hand-duplicated rather than generated. Rejected alternative: generate `tokens.css` from a `tokens.ts` map at build time, which would remove the duplication but adds a build step for ~20 duplicated declarations — not justified at the current token count; revisit if the palette grows past ~40 entries. The accepted duplication risk (a token added to one block and forgotten in the other) is covered by a guardrail test (`src/styles/tokens.parity.test.ts`) asserting both dark blocks declare the same custom-property names.

**Runtime theme switching:** `useTheme` (`src/features/theme/useTheme.ts`) persists `'light' | 'dark' | 'auto'` to `localStorage['tendril-theme']`. `'auto'` resolves to a time-of-day split (`timeOfDayTheme()`: 6am–6pm light, else dark — a crude wall-clock stand-in, not sunrise/sunset) rather than OS `prefers-color-scheme`; the *resolved* concrete value (`'light'` or `'dark'`) is written to `document.documentElement.dataset.theme`, re-checked every 15 minutes while `'auto'` is active so a long-open tab still crosses the day/night boundary. Rejected alternative: keep `'auto'` following system preference (the original behavior) — dropped because there's no way for a user to express "light in the day, dark at night" via OS-level dark mode, which is a single global on/off. An inline anti-flash script in `index.html`'s `<head>` duplicates the same hour split (it can't import the TS module) to resolve `'auto'` before first paint, avoiding a flash from the CSS `prefers-color-scheme` fallback to the JS-computed value.

There is currently **no UI** to change the theme — a standalone `ThemeToggle` component existed briefly but was removed from `NavBar` (crowded the bottom-nav row, and a fixed three-way control doesn't fit a time-of-day default well), then deleted outright once it was just an unused wrapper around the `SplitGroup` primitive (§ 24 in TASKS.md) with no call site. The only manual override is `window.switchTheme('light' | 'dark' | 'auto')` from the browser console, wired up by mounting `useTheme()` (for its side effects only) in `App.tsx`'s `AppShell`. A real settings screen to replace the console workaround is tracked in TASKS.md, deferred/low priority — it will call `SplitGroup` directly rather than reintroducing a `ThemeToggle` wrapper.

**Storybook color docs:** `Design System/Color Story` (`src/styles/ColorStory.mdx`) is the single home for color-token documentation — swatches, live contrast ratios, and the accent/status/slide-tint narrative — driven by `useTokenValue` (`src/styles/useTokenValue.ts`), which reads a token's current computed value via a `MutationObserver` on `data-theme`. `Design System/Tokens` (`DesignTokens.mdx`) covers everything else the token contract includes (spacing, radius, font families) and links to Color Story rather than duplicating its swatches. `.storybook/preview.ts`'s toolbar `theme` global and decorator drive theme for ordinary component stories, but **not** for bare MDX docs pages: MDX body content renders outside the decorator pipeline entirely, and Storybook's own preview hooks (`useGlobals`, etc.) throw if called from it, since they require a decorator/story render context. `ColorStory.mdx` works around this with a page-local `ThemePreviewToggle` (`src/styles/ThemePreviewToggle.tsx`) — plain `useState`/`useEffect`, no Storybook hooks — that drives `data-theme` for that page only, independent of the toolbar. `Tokens` has no live color content left (colors moved to Color Story), so it doesn't need this.

**App bootstrap / loading gate:** `App.tsx` nests `LoadingGate` (`src/features/loading/LoadingGate/LoadingGate.tsx`) inside `BrowserRouter`, wrapping `AppShell` (not `BrowserRouter` itself, as the initial cut had it) — the gate now needs `useNavigate`, which requires router context. It still renders before any `<Route>` mounts: `LoadingGate` sits above `<Routes>` in `AppShell`, so nothing route-dependent appears until it resolves. On mount it runs two things in parallel and waits for both: a fixed floor (`LoadingScreen` stays up for at least `MIN_LOADING_MS`, 1500ms, a named constant in `LoadingGate.tsx`) and `runGateSteps`, which runs `GATE_STEPS` — `authStep`, `authzStep`, `inProgressStep`, in that order — one after another, stopping at the first step that redirects. Each step is `() => Promise<"continue" | { redirect: string }>`; `authStep`/`authzStep` are no-op placeholders today (ties into section 7's deferred "User provisioning" design work and TASKS.md § 34), existing only so real auth/authz logic has a slot to land in later without touching the gate's control flow. `inProgressStep` is the one real check: `getTasksByStatus("in_progress")`, redirecting to `/in-progress` (`{ replace: true }`) if a task is found, so a reload or deep link never flashes the wrong route first. It fails open on a fetch error (proceeds as if none were found) rather than stranding the user on the splash — the existing per-slide check in `RankingPage`/`ResultsPanel`, which discovers the same `in_progress_block` engine response (see Engine Pipeline § above) per carousel slide, still runs as a fallback either way, since it also catches a task that transitions to `in_progress` *during* an active session, which this mount-only gate step can't see.

Steps run sequentially, not in parallel, by deliberate choice: `authzStep` needs to know who the user is (depends on `authStep`), and `inProgressStep` shouldn't run at all if `authzStep` already redirected away — every step here depends on the previous one having passed, so there's no pair that's actually safe to parallelize today. If a future step turns out to be genuinely independent of the others, that's its own enhancement to `runGateSteps`, not something to assume by default — flagged with a matching comment at the steps' definition in `LoadingGate.tsx` so it isn't forgotten.

**Superseded:** this section previously recorded a rejected alternative — "build the full ordered-async-step gate (auth/authz placeholders, pass/redirect/block per step) now — deferred because those steps still have no real implementation and the added structure isn't earning its complexity until one does." Revisited in conversation and built anyway: the actual shape turned out to be three small functions and a `for` loop, not the heavier structure the original assessment was guarding against, so there was no real complexity cost left to defer. The current `LoadingScreen` visual is still an explicitly temporary placeholder (TASKS.md § 19) — no design pass has been done on it yet; that part of § 19 remains open.

**Staying on `/in-progress` until resolved (TASKS.md § 20):** once `inProgressStep` redirects there, the user shouldn't be able to leave without resolving the task via Complete/Snooze/Delete. This isn't one mechanism but three small ones covering the app's actual navigation surface: `NavBar`'s `linksHidden` prop (`App.tsx` passes `location.pathname === "/in-progress"`) removes its `<NavLink>`s from the DOM entirely rather than just hiding them with CSS, so they're not just invisible but unreachable; `AppShell`'s `showFAB` gained the same condition, since the FAB was otherwise the one remaining in-app affordance that could navigate to `/tasks/new`; and a typed URL or bookmark to any other route triggers a full page reload, which re-mounts `LoadingGate` and re-runs `inProgressStep` from scratch, redirecting straight back if the task is still in progress. Browser back/forward wasn't specifically hardened — the redirect into `/in-progress` uses `{ replace: true }`, so there's normally no same-session history entry underneath it to go back to. Not covered here: a task that transitions to `in_progress` *during* an already-open session on another route — the gate is mount-only, so that's still caught only by the existing per-slide check in `RankingPage`/`ResultsPanel`, same caveat as above.

**Responsive segmented controls (`SplitGroup`):** the joined-pill row (`Button`/`ThemeToggle`-style segmented control) is the intended design, but `flex: 1` segments with fixed padding have no floor below their content's min-content width — at narrow widths the row overflows instead of shrinking or wrapping, first surfaced on `PriorityPicker`'s 5-option row (TASKS.md § 10.4). `SplitGroup` now renders both a vertical `Radio` list and the pill row simultaneously, toggled by a `@media (width >= 320px)` breakpoint (pill row above it, radio list below) — CSS-only, no JS measurement. `Radio` (previously unused — see § 24.4 in TASKS.md, "not a `RadioGroup`... would be speculative") is the group's first real caller: `SplitGroup` shares one `name` (via `useId()`) across its `Radio`s for native mutual-exclusivity, and `Radio` gained an optional `icon` slot so `EnergyPicker`'s per-level icon survives in the vertical layout. The 320px breakpoint is a literal (custom properties aren't usable inside `@media` conditions), set by explicit user choice at the smallest real device viewport rather than at the point `PriorityPicker`'s 5-option row actually starts overflowing (~480px) — the radio fallback is deliberately a rare/edge-case path for now, not the typical narrow-mobile experience; revisit the number if that assumption changes. Rejected alternative: a `ResizeObserver`-driven overflow check that measures actual rendered width — more precise in principle (accounts for real container width, not just viewport), but adds a class of infrastructure (a resize-observing hook) this codebase doesn't have yet, and isn't needed since the app targets fixed-width mobile viewports and each `SplitGroup` consumer's option set (and therefore its overflow point) is static, not data-driven. **Superseded:** `LocationPicker` originally used a `Chip` row (a different, gap-and-wrap-friendlier pattern — chips don't stretch to fill the row) instead of `SplitGroup`, and only got a defensive `flex-wrap: wrap`, not this treatment. Moved onto `SplitGroup` in TASKS.md § 45 for one consistent look across all three `ParamsForm` pickers (Location/Duration/Energy) — see § 45's own entry for the accompanying default-value and label changes this required.

**Structure:**
- `src/components/` — generic, reusable UI primitives (Checkbox, Icon, Select)
- `src/features/loading/` — app bootstrap gate and its splash screen
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

Snooze is not a status. It sets `lastSuggestedAt = now` and, if the task's current status is `in_progress`, also reverts it to `pending` (any other status is left untouched); `priorityUpdatedAt` (and priority/context) are untouched either way. The recency suppression is the mechanism `ranker.ts`'s `isRecentlySuggested`/`recurrenceWindowHours` already implement: the task is suppressed from ranking until the recurrence-based window (default 24h) elapses. **Superseded:** an earlier version of this decision set *only* `lastSuggestedAt`, with status left alone. That was incomplete — `ranker.ts`'s in-progress check (`tasks.find(t => t.status === "in_progress")`) is a plain status lookup, unaffected by `lastSuggestedAt`, so snoozing the currently in-progress task left it blocking ranking indefinitely, contradicting User Flow § 4/6 below (snooze listed as one of the ways to resolve the block). The status revert closes that gap. This is the canonical description of snooze semantics — other documents in `documentation/` that describe a different mechanism predate this decision and have been marked superseded in place.

### Cascading task completion

Completing a task that is the last non-`completed` direct child of its parent auto-completes the parent too, and the check repeats up the ancestor chain — finishing the last subproject under a project completes the project as well. `routes/tasks.ts`'s `PUT /api/tasks/:id` handler does this inside the same transaction as the original status update (re-querying `groupTasksByParent`'s grouping at each ancestor level, since completing one level changes what the next level up sees as its children) and returns `{ task, autoCompletedAncestors }`, where `autoCompletedAncestors` is empty when nothing cascaded.

The cascade applies uniformly regardless of the parent's priority — a priority-10/"Ongoing" parent is not exempt, even though ongoing tasks are expected to keep gaining children over time. Decided this way (rather than excluding recurring/ongoing parents) because there is no separate signal that distinguishes "this project is done" from "this project's current batch of children is done" — treating them the same keeps the rule simple and lets the user re-open or re-populate a prematurely-completed "Ongoing" parent manually rather than the system guessing.

The cascade is automatic with no per-level confirmation — the user finds out via accomplishment feedback after the fact rather than a prompt beforehand, consistent with this app's snooze/complete actions elsewhere already being unconfirmed one-click actions. Surfacing that feedback (e.g. "you also finished X") on the frontend depends on a "brief celebration" UI step that does not exist yet and needs its own design pass; until then, `autoCompletedAncestors` is available on the response but unused by the client.

### Context theming

Each context has a `slideIndex` (0–7), assigned once at creation and never changed, that keys into the eight `--color-slide-*` tints in `tokens.css` for that context's page in the ranking carousel. `routes/contexts.ts`'s `POST /api/contexts` assigns it from `(MAX(slide_index) for this user + 1) mod 8`, computed in the same transaction as the insert.

This is a monotonically increasing counter, not "reuse the first free slot": a context's color must never shift because other contexts were reordered or removed, and the palette's eight hues are meant to read in a fixed, ascending order (`documentation/Carousel backgrounds per theme.png`) — reusing a gap left by a removed context could put a newer context at an earlier index than an older one, breaking that order. The accepted trade-off is the reverse case: once a user has created enough contexts to wrap past 8, two live contexts can end up sharing a hue. That's a smaller visual problem than out-of-order hues and is expected to be rare at this app's current single-user scale. `GET /api/contexts` returns rows ordered by `slideIndex` so the frontend doesn't need to re-sort before building carousel slides.

This is designed to keep working once contexts can be archived (§42 of `TASKS.md`, not yet built): archiving is a soft flag, not a row delete, so a removed context's `slideIndex` simply retires along with it rather than being freed for reuse — no change needed here when that lands.

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

## Development Workflow

**PR per change.** Every change reaches `main` through a GitHub PR from a short-lived branch, even with a single contributor; the user reviews and merges on GitHub, and the agent never merges. The PR, filled in from `.github/pull_request_template.md` (why, what changed, how it was verified, how AI was used), is the reviewable record linking plan → implementation → review. Rejected alternative: fast-forward merges pushed straight to `main`. That's less ceremony for a solo project, but it leaves no review record, and before this change, local commits accumulated on `main` and were pushed in batches, so one push could publish several older commits along with the intended change.

**TASKS.md: nudge at commit, block at push.** A `git commit` PreToolUse hook only reminds the agent to check `TASKS.md`. A `git push` PreToolUse hook (`.claude/hooks/check-tasks.sh`) blocks with exit 2 when none of the outgoing commits (`origin/main..HEAD`) touch `TASKS.md` and no commit message opts out with a `Tasks: none — <reason>` line. Push is the right granularity: a branch is the unit of work, and it needs a `TASKS.md` update once, not in every commit. Rejected alternative: blocking at commit. That's the wrong level, because intermediate commits (WIP, refactors, fixups) legitimately don't touch `TASKS.md`, so a commit-level block would mostly produce false positives and train opt-out habits.

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
