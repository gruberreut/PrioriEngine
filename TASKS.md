# Tasks

Implementation tasks for the engine ↔ web integration.

**Priority order:** at this point in development, work through sections in order: known bugs (10), then the OpenAPI documentation migration (11), then new feature work (12 onward).

---

## 1. Engine API surface (`engine-api`)

Extract browser-safe utilities and add a clean programmatic entry point so `apps/api` can import the engine without pulling in Node.js file-system code.

- [x] Create `packages/engine/src/treeUtils.ts` — move `isLeafTask`, `flattenTaskTree`, and `asTaskArray` out of `taskLoader.ts` into this new file
- [x] Update `taskLoader.ts` to import those three functions from `treeUtils.ts`
- [x] Update `normalizer.ts` to import `isLeafTask` from `treeUtils.ts` (removes its dependency on `taskLoader.ts`)
- [x] Add `packages/engine/src/api.ts` — exports `rankFromPayload(tasks: RawTask[], params: RuntimeParams): RankResult`, which chains `asTaskArray → flattenTaskTree → normalizeTasks → rankTasks`
- [x] Add `packages/engine/src/index.ts` — barrel re-exporting `rankFromPayload`, `RawTask`, `RuntimeParams`, `RankResult`, `RankedTask`, `ScoreBreakdown`, `NormalizedTask`
- [x] Add `"exports": { ".": "./src/index.ts" }` to `packages/engine/package.json`
- [x] Add tests for `rankFromPayload` in `packages/engine/test/` using existing fixtures; maintain coverage thresholds

---

## 2. API server (`api-server`)

Plain Node.js `http` server in a new `apps/api` workspace package. Loads tasks once at startup; exposes three endpoints.

- [x] Create `apps/api/` with `package.json` — name `@priori/api`, workspace dep on `@priori/engine`, dev dep on `tsx`
- [x] `apps/api/src/server.ts` — `http.createServer`; reads `PRIORI_TASKS_PATH` env var (falls back to `packages/engine/test/data/tasks.example.json`); loads and parses tasks once at startup
- [x] `POST /api/rank` — parse JSON body `{ context?, location?, availableTime, energyLevel, explain, limit? }`, call `rankFromPayload`, respond with `RankResult` JSON; set `Content-Type: application/json` and CORS header for `http://localhost:5173`
- [x] `GET /api/contexts` — derive distinct context labels from the loaded tasks, respond as `string[]` JSON
- [x] `GET /api/tasks` — respond with the raw loaded task array (needed by the future task browser in section 7)
- [x] Add `"dev": "tsx watch src/server.ts"` script to `apps/api/package.json`
- [x] Add `"dev:api": "npm run dev -w @priori/api"` and `"dev:web": "npm run dev -w @priori/web"` to root `package.json`
- [x] Verify all three endpoints with `curl` before wiring the frontend

---

## 3. Web integration (`web-integration`) ✓

Wire `RankingPage` to the live API; replace all hardcoded mock data.

- [x] Add Vite dev proxy to `apps/web/vite.config.ts`: `/api` → `http://localhost:3001` (no CORS config needed in the browser)
- [x] Create `apps/web/src/features/ranking/rankingService.ts` — exports `rank(params: RankParams): Promise<RankResultMode>` and `getContexts(): Promise<string[]>`; `rank` maps `RankParams → request body` (rename `energy → energyLevel`), calls `POST /api/rank`, maps the `RankResult` response to `RankResultMode` (rename `top → tasks`, map `NormalizedTask → TaskData` by picking the 7 fields `TaskData` needs; `ScoreBreakdown` fields match exactly)
- [x] Update `RankingPage.tsx` — on mount call `getContexts()` and populate the `ParamsForm`; on submit call `rank(params)` (async, pass `loading` prop while pending); remove `MOCK_RESULT`; add an error state for when the API is unreachable

---

## 4. Components

One component at a time. Each must be reviewed in local Storybook before the next begins.
Reference: `documentation/TESTING_PAGE_COMPONENTS.md`, `guidelines/COMPONENT_BEST_PRACTICES.md`

**Setup (do once before first component):**
- [x] Install Storybook in `apps/web`: `@storybook/react-vite`
- [ ] Create `apps/web/test/storyFixtures.ts` with fixture data derived from `packages/engine/test/data/tasks.example.json`

---

### 4.1 `Select` ✓

Base dropdown primitive. Supports optional `placeholder` prop which renders a leading option and maps its selection to `undefined`.

- [x] Implement `Select` component with props: `options`, `value`, `onChange`, `label`, `placeholder`, `disabled`
- [x] Write stories: Default, WithPlaceholder
- [x] Review in Storybook — **approved**

---

### 4.1b `Checkbox` ✓ _(added)_

Base checkbox primitive with optional label. Lives in `src/components/` alongside `Select`.

- [x] Implement `Checkbox` with props: `checked`, `onChange`, `label` (optional), `disabled`
- [x] Write stories: Off, On, NoLabel, Disabled (interactive — stories use local state)
- [x] Review in Storybook — **approved**

---

### ~~4.2 `ContextSelect`~~ _(removed)_

Inlined into `ParamsForm`. Thin wrapper added no value as a standalone component.

---

### ~~4.3 `AvailableTimeSelect`~~ _(removed)_

Inlined into `ParamsForm`. Fixed options with no logic; not worth a separate file.

---

### ~~4.4 `EnergySelect`~~ _(removed)_

Inlined into `ParamsForm`. Same reasoning as `AvailableTimeSelect`.

---

### ~~4.5 `ExplainToggle`~~ _(replaced by `Checkbox`)_

Inlined into `ParamsForm` using the `Checkbox` base primitive.

---

### 4.6 `ParamsForm` ✓

Composes context, available time, and energy selects (inlined) plus `Checkbox` for explain. Emits `onSubmit` with typed `RankParams`.

- [x] Implement `ParamsForm`
- [x] Write stories: Default (idle), Loading, No contexts
- [x] Review in Storybook — **approved**

---

### 4.7 `ScoreBreakdown` ✓

Score detail panel rendered inside a task card when explain is on.

- [x] Implement `ScoreBreakdown`
- [x] Write stories: All positive, With penalties, Zero flow bonus
- [x] Review in Storybook — **approved**

---

### 4.8 `TaskCard` ✓

Single ranked task. Conditionally renders `ScoreBreakdown`.

- [x] Implement `TaskCard`
- [x] Write stories: Explain off, Explain on, Long title
- [x] Review in Storybook — **approved**

---

### 4.9 `InProgressBlock` ✓

Shown when the engine returns `in_progress_block` mode.

- [x] Implement `InProgressBlock`
- [x] Write story: Default (task title + action list)
- [x] Review in Storybook — **approved**

---

### 4.10 `EmptyState` ✓

Shown when ranking returns zero results.

- [x] Implement `EmptyState`
- [x] Write stories: With context, Without context
- [x] Review in Storybook — **approved**

---

### 4.11 `ResultsPanel` ✓

Composes `TaskCard`, `InProgressBlock`, and `EmptyState`. Switches between states based on `RankResult`.

- [x] Implement `ResultsPanel`
- [x] Write stories: No result, Three cards (explain off), Three cards (explain on), In-progress block, Empty state
- [x] Review in Storybook — **approved**

---

### 4.12 `Breadcrumbs` (`task-breadcrumbs`) ✓

Shows ancestor context for subtasks inside `TaskCard`. When a task is nested under a project or parent task, the title alone may not provide enough context — breadcrumbs display the ancestor chain above the title.

**Engine:**
- [x] `types.ts` — add optional `ancestors?: { id: string; title: string }[]` to `NormalizedTask`
- [x] `normalizer.ts` — populate `ancestors` by walking the `LoadedTask.parent` chain (root-first order); omit when the task has no parent

**Frontend:**
- [x] Add optional `ancestors?: { id: string; title: string }[]` to `Task` in `src/types/task.ts` and `src/entity/TaskCard/TaskCard.tsx`
- [x] Create `Breadcrumbs` component in `src/components/Breadcrumbs/` — renders `Ancestor1 › Ancestor2` in muted style; displayed above the title, full width
- [x] Write `Breadcrumbs` stories: TwoLevels, SingleParent, ThreeLevels
- [x] Review in Storybook — **approved**
- [x] Integrate `Breadcrumbs` into `TaskCard` — render above title when `task.ancestors` is present and non-empty
- [x] Update `TaskCard` stories: add WithAncestors, WithDeepAncestors variants
- [x] Review in Storybook — **approved**

**Integration:**
- [x] Update `rankingService.ts` — map `ancestors` from `NormalizedTask` to `TaskData` when present

_Note: `TaskCard` was moved from `src/features/ranking/` to `src/entity/` as part of this task, establishing the entity component layer._

---

## 5. Location & Context Refactor (`location-context-refactor`)

Separate the two roles that `contexts` currently plays. `contexts` becomes open-ended abstract mental-mode categories (starting set: `creativity`, `learning`, `admin`, `physical`) — new categories can be added to the JSON at any time without code changes. A new `location` field captures where the task physically requires you to be; its values are fixed and structural.

**Location values:** `"home"` | `"in-person"` | `"anywhere"` (default: `"anywhere"`)
**Context categories:** open-ended `string[]` — no fixed enum; starting set is `creativity`, `learning`, `admin`, `physical`

---

### 5.1 Engine ✓

- [x] `types.ts` — add `location: "home" | "in-person" | "anywhere"` to `RawTask` and `NormalizedTask`; add optional `location` to `RuntimeParams`; `contexts` remains `string[]` with no fixed enum
- [x] `normalizer.ts` — inherit `location` up the parent chain; default to `"anywhere"` when unset; validate `location` against the three allowed values only (no context validation)
- [x] `ranker.ts` — add hard location filter: when `RuntimeParams.location` is set, exclude tasks whose `location` does not match (tasks with `"anywhere"` always pass)
- [x] `cliParse.ts` — add `--location` flag
- [x] Update test fixtures in `test/fixtures/` to include `location`; add location-filter test cases; maintain 100% line/function/statement and 95% branch coverage thresholds
- [x] `tasks.example.json` — rework all `contexts` from specific labels to abstract categories; add `location` to every task; remove location labels from `contexts` arrays

### 5.2 Frontend ✓

- [x] `ParamsForm` — add location selector (home / in-person / anywhere / no filter); update stories
- [x] `TaskCard` — add location badge; update stories
- [x] `RankingPage` — pass `location` through to the rank request

### 5.3 Documentation

- [x] `ARCHITECTURE.md` — update data model section and priority semantics table to reflect `location` field and revised context categories

---

## 6. Task Browser (`task-browser`)

A read-only page at `/tasks` that shows all tasks as an expandable tree. The collapsed view shows only titles and hierarchy; expanding a leaf reveals a dense `TaskCard` with its resolved field values. Parent nodes expand to reveal children only (no card — their fields exist to be inherited, not displayed standalone).

**Field inheritance rule:** child tasks may omit fields that exist on an ancestor. Before rendering, each task's effective values are resolved by walking up the parent chain — the same `inheritedValue` logic the engine normalizer uses.

---

### 6.1 Routing setup ✓

- [x] Install `react-router-dom`
- [x] Update `App.tsx` to wrap the app in `<BrowserRouter>` with two routes: `/` → `RankingPage`, `/tasks` → `TasksPage`
- [x] Add a minimal `NavBar` component (`src/components/NavBar/`) with links to both routes; write stories

### 6.2 `tasksService` ✓

- [x] ~~Copy `packages/engine/test/data/tasks.example.json` to `apps/web/public/tasks.json`~~ (skipped — tasks are DB-backed)
- [x] Create `apps/web/src/services/taskService.ts` — exports `getTasks(): Promise<Task[]>`; calls `GET /api/tasks`

### 6.3 `resolveTask` utility ✓

- [x] Create `apps/web/src/features/tasks/resolveTask.ts` — exports `resolveTask(task: RawTask, ancestors: RawTask[]): ResolvedTask`
- [x] `ResolvedTask` carries: `id`, `title`, `duration`, `energyRequired`, `location`, `contexts`, `status` — all resolved by walking the ancestor chain with the same `inheritedValue` logic as the engine normalizer; no filtering

### 6.4 `TaskCard` dense flavor ✓

- [x] Add `"dense"` to the `flavor` union in `TaskCard`; dense reduces padding and font sizes, hides score breakdown and action bar regardless of props
- [x] Update `TaskCard` stories: add Dense story

### 6.5 `TaskTreeItem` component

- [x] Create `apps/web/src/features/tasks/TaskTreeItem/`
- [x] Props: `task: Task`, `ancestors: Task[]`, `depth: number`, `allTasks: Task[]` (needed to find children for recursive rendering)
- [x] Collapsed state: one line — indent proportional to depth, chevron (parent) or bullet (leaf), title
- [x] Leaf expanded: title row stays; dense `TaskCard` renders below using `resolveTask(task, ancestors)`
- [x] Parent expanded: title row stays; children render as `TaskTreeItem` instances (no card for the parent itself)
- [x] Write stories: LeafCollapsed, LeafExpanded, ParentCollapsed, ParentExpanded, DeepNesting

### 6.6 `TasksPage` ✓

- [x] Create `apps/web/src/features/tasks/TasksPage/`
- [x] On mount, calls `tasksService.getTasks()`; shows loading state while pending, error state on failure
- [x] Renders root-level `RawTask[]` as a list of `TaskTreeItem` components (depth 0)
- [x] Write stories: Loading, Error, Populated

---

## 7. Database layer (`db-setup`)

**Depends on:** none — can start immediately.

Set up PostgreSQL and Drizzle ORM. Creates the foundational schema that all task CRUD operations will use.

### Schema

```
users
  id          UUID PK DEFAULT gen_random_uuid()
  email       TEXT UNIQUE NOT NULL
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()

contexts
  id          UUID PK DEFAULT gen_random_uuid()
  user_id     UUID NOT NULL → users
  name        TEXT NOT NULL
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  UNIQUE(user_id, name)

tasks
  id                  UUID PK  (client-generated)
  user_id             UUID NOT NULL → users
  parent_id           UUID → tasks  (NULL = standalone)
  context_id          UUID → contexts
  title               TEXT NOT NULL
  priority            INTEGER NOT NULL  (1–10)
  priority_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  due_date            TIMESTAMPTZ  (required when priority = 1)
  duration            INTEGER NOT NULL  (minutes)
  energy_required     TEXT NOT NULL  ('low' | 'medium' | 'high')
  location            TEXT NOT NULL DEFAULT 'anywhere'  ('home' | 'in-person' | 'anywhere')
  status              TEXT NOT NULL DEFAULT 'pending'  ('pending' | 'in_progress' | 'completed')
  last_suggested_at   TIMESTAMPTZ
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
```

### Tasks

- [x] Install PostgreSQL locally (Homebrew: `brew install postgresql@16`, or Docker)
- [x] Add `drizzle-orm`, `drizzle-kit`, `pg`, `@types/pg` to `apps/api`
- [x] Create `apps/api/src/db/schema.ts` — Drizzle schema definitions for all three tables
- [x] Create `apps/api/src/db/index.ts` — exports db connection; reads `DATABASE_URL` env var
- [x] Generate and apply first migration via drizzle-kit
- [x] Create `apps/api/src/db/seed.ts` — creates one dev user + 4 default contexts: `Learning`, `Creativity`, `Projects`, `Physical`
- [x] Add `"db:generate"`, `"db:migrate"`, `"db:seed"` scripts to `apps/api/package.json`
- [x] Document `DATABASE_URL` in `apps/api/README.md`
- [x] Create `apps/api/src/db/migrateTasks.ts` — one-time script to import `tasks.example.json` into the DB; maps `admin` context → `Projects`; resolves inherited fields; safe to re-run

### User provisioning — needs detailed planning

The seed script covers the single dev user. When real user accounts are added (auth phase), the server must automatically provision default contexts for every new user. This needs a detailed design before auth is implemented.

**Open questions to resolve:**
- Trigger point: where does provisioning run? (auth callback, a `POST /api/users` endpoint, DB trigger)
- Default list: hardcoded in server code, or stored in a config table so it can be updated without a deploy?
- Can users delete a default context? If yes, is it re-created on next login or gone permanently?
- Idempotency: if the creation event fires more than once, provisioning must not duplicate contexts
- Dev vs production: seed script is dev-only; production path must go through the auth-triggered flow

- [ ] Write detailed plan for user provisioning flow before auth implementation begins

---

## 8. Task CRUD API (`task-crud-api`)

**Depends on:** Section 7 complete (schema and DB connection must exist).

`GET /api/tasks` and `GET /api/contexts` now read from the DB directly. `POST /api/rank` continues to use the JSON file until the ranking migration is planned. All new write endpoints are DB-backed.

### Tasks

- [x] `POST /api/tasks` — body: `{ id, parentId?, contextId?, title, priority, dueDate?, duration, energyRequired, location }`; `id` is a client-generated UUID; inserts into DB for the dev user; returns created task
- [x] `GET /api/tasks` — returns all tasks for the dev user from DB as a flat array
- [x] `POST /api/contexts` — body: `{ name }`; creates context for dev user; returns created context (409 if name already exists)
- [x] `GET /api/contexts` — returns all contexts for dev user from DB as `{ id, userId, name, createdAt }[]`
- [x] `POST /api/tasks/:id/split` — atomic transaction: (1) create new parent task from body `{ title }`; (2) set current task's `parent_id` to new parent's id; (3) create blank sibling task under same parent; returns `{ parent, original, sibling }`
- [x] Update `apps/api/API.md` with all new endpoints

---

## 9. Task entry UI (`task-entry-ui`)

FAB-triggered creation flow and post-creation task detail page.

**Depends on:** Section 6.1 (routing skeleton must exist before pages can be wired); Section 8 (API endpoints must exist before the form and detail page can talk to the server). Components 9.1 and 9.2 are pure UI and can be built ahead of the API.

One component at a time; Storybook review required before the next begins.

---

### 9.1 `DurationPicker` ✓

**Depends on:** none — pure component, no API dependency.

4-button segmented control; identical structure and CSS pattern to `EnergyPicker`. No icons — text labels only.

- [x] Props: `value: number`, `onChange: (value: number) => void`, `label?: string`, `disabled?: boolean`
- [x] Options: `10` / `20` / `30` / `60` minutes; default `20`
- [x] Write stories: Default (20 selected), Each option selected, Disabled
- [x] Review in Storybook — **approved**

---

### 9.2 `PriorityPicker` ✓

**Depends on:** none — pure component, no API dependency.

5-button segmented control; same button/CSS pattern as `EnergyPicker`. Selecting Urgent reveals an inline due date input below the picker.

- [x] Props: `value: number`, `onChange: (value: number) => void`, `dueDate?: string`, `onDueDateChange?: (date: string) => void`, `label?: string`, `disabled?: boolean`
- [x] Options and mappings: Urgent → 1, Soon → 3, Medium → 6, Later → 8, Ongoing → 10; default Soon (3)
- [x] Due date input appears inline beneath the picker only when Urgent is selected; defaults to tomorrow's date
- [x] Write stories: Default (Soon), Urgent selected (due date visible), Each option, Disabled
- [x] Review in Storybook — **approved**

---

### 9.3 `TaskCreationForm` ✓

**Depends on:** 9.1, 9.2, Section 8 (`POST /api/tasks`, `GET /api/contexts?source=db`, `POST /api/contexts`), Section 6.1 (routing — form lives at `/tasks/new`).

Composes all pickers into a single creation form. Submits via `POST /api/tasks` with a client-generated UUID.

- [x] Fields: title (text input, required), context (`Select` populated from `GET /api/contexts?source=db`; includes an inline "New context…" option that calls `POST /api/contexts` and appends the result to the list), `PriorityPicker` (default Soon), `DurationPicker` (default 20 min), `EnergyPicker` (default medium), `LocationPicker` (default anywhere)
- [x] On success: navigates to `/tasks/:id`
- [x] Props: `onSubmit`, `onCancel`, `loading`, `contexts: ContextItem[]` (uses ContextItem with id+name rather than plain strings)
- [x] Write stories: Default, Loading, WithExistingContexts
- [x] Review in Storybook — **approved**

---

### 9.4 `FAB` ✓

**Depends on:** Section 6.1 (needs routes to exist so the render condition can reference `/tasks/new`).

Fixed-position `+` button. Not rendered on the `/tasks/new` route (controlled at the router level, not via a prop).

- [x] Props: `onClick`
- [x] Write story: Default
- [x] Review in Storybook — **approved**

---

### 9.5 `TaskDetailPage`

**Depends on:** 9.3 (tasks must be creatable before a detail page is useful), Section 8 (`GET /api/tasks?source=db`, `POST /api/tasks/:id/split`, `PUT /api/tasks/:id`), Section 6.1 (routing — page lives at `/tasks/:id`).

Shown immediately after task creation and reachable at `/tasks/:id`.

- [x] Fetches task by id from `GET /api/tasks?source=db`; shows loading and error states
- [x] Renders `TaskCard` with `showActionLabels={true}`, `flavor="outlined"`, and four actions:
  - **Add another** — navigates to `/tasks/new`
  - **Add subtask** — navigates to `/tasks/new?parentId=:id&parentTitle=:title`; `TaskCreationPage` reads search params to pre-fill parent
  - **Split** — calls `POST /api/tasks/:id/split` (prompts for parent title via `window.prompt`); navigates to the new parent's `/tasks/:parentId`
  - **Start** — calls `PUT /api/tasks/:id` with `{ status: "in_progress" }`; disabled when any task already has `status: "in_progress"` (checked from the loaded task list)
- [x] Added `PUT /api/tasks/:id` API endpoint and documented in `API.md`
- [x] Write stories: Default, Start disabled (in-progress exists), Loading, Error
- [ ] Review in Storybook — **approved**

### 9.6 Routing expansion

**Depends on:** Section 6.1, 9.3, 9.4, 9.5 all complete.

- [x] Expand `App.tsx` routes (from 6.1) to add: `/tasks/new` → `TaskCreationPage`, `/tasks/:id` → `TaskDetailPage`
- [x] Render `FAB` on all routes except `/tasks/new`

---

## 10. Known Bugs (`known-bugs`)

Fix before starting section 11 or later — see priority note at the top of this file.

### 10.1 DB-backed tasks never reconstruct hierarchy before ranking

`routes/rank.ts` builds the engine's input (`rawTasks`) as a **flat** array — each task carries only a `parentId` field — and passes it straight to `rankFromPayload`. The engine's `flattenTaskTree` only discovers parent/child relationships by recursing into a `RawTask.children` array, which is never populated for DB-sourced rows. Consequences, all silent:

- `isLeafTask`-based filtering (normalizer is supposed to drop any task that has children) never fires for DB data — every task is treated as a top-level leaf, so a parent task marked `in_progress` can surface in `in_progress_block` even though it has subtasks.
- `ancestors` (and therefore `TaskCard` breadcrumbs) are always empty for anything returned by `/api/rank`, since the `LoadedTask.parent` chain is never built from `parentId`.
- `inheritedValue`'s parent-chain walk (used to resolve fields a child task omits) never has a parent to walk to, so field inheritance silently fails for DB-sourced child tasks.

- [x] Add `groupTasksByParent(rows)` to `apps/api/src/db/queries.ts` — builds a `Map<parentId | null, Row[]>` from a flat task-row list in one pass. This is a shared foundational primitive: sections 11 (`hasChildren`) and 12 (cascading completion) both reuse it, so build it here first rather than duplicating ad hoc grouping in three places
- [x] `routes/rank.ts` — reconstruct nested `children` arrays from the flat `parentId`-linked DB rows using `groupTasksByParent` (attach recursively starting from root tasks) before calling `rankFromPayload`, so the existing (already 100%-covered) `flattenTaskTree`/`normalizeTasks` logic receives real hierarchy
- [x] Add a regression test in `apps/api/test/routes/rank.test.ts` with a seeded parent/child pair: parent is excluded from ranking output, child is ranked with inherited fields and populated `ancestors`
- [x] Note in `ARCHITECTURE.md` that `/api/rank`'s task-loading path constructs the tree from `parentId` before calling the engine, so this doesn't regress silently again

---

## 11. API Documentation Migration to OpenAPI (`openapi-docs`)

**Depends on:** section 10 (bugs fixed first).

`apps/api` is past the 5-endpoint threshold in `CLAUDE.md`'s own stated policy for upgrading from markdown to OpenAPI (7 endpoints today; section 12/13 add 2 more). This is docs-only for now — no request/response validation library is being introduced, and no schema-driven code generation. The spec is hand-authored and kept in sync manually, same discipline `API.md` used, just in a different format with an interactive external view.

- [x] Add `apps/api/openapi.yaml` covering every endpoint currently in `API.md` (rank, tasks GET/POST/PUT/split, contexts GET/POST): full request/response schemas and examples, equivalent in content to what `API.md` has today
- [x] Add `swagger-ui-dist` as an `apps/api` dependency (static assets only — no server framework needed)
- [x] Serve the raw spec (e.g. `GET /openapi.yaml`) and Swagger UI (e.g. `GET /docs`, pointed at that spec) from `server.ts`
- [x] Retire `apps/api/API.md` — replace its content with a short pointer to `/docs` (Swagger UI) and `openapi.yaml`, same superseded-doc pattern used for the snooze documentation cleanup, rather than deleting the file outright
- [x] Update `CLAUDE.md`'s "API Documentation" section: change the standard from markdown/`API.md` to `openapi.yaml` + Swagger UI, and update the "must be documented before implementation is considered complete" rule to point at the spec instead
- [x] Update `documentation/ARCHITECTURE.md`'s repo-layout listing (currently shows `API.md` as "endpoint documentation, kept in sync with every change") to reference `openapi.yaml` instead
- [x] Update the still-open `API.md` references later in this file (sections 12 and 13's "update `API.md`" bullets) to say `openapi.yaml` — done in this pass so the plan stays internally consistent

---

## 12. Task Actions (`task-actions`)

Wire up the `Complete` / `Snooze` / `Delete` actions on `InProgressBlock` (shown on the ranking page when a task is `in_progress`) — the buttons and `onAction`/`onInProgressAction` plumbing already exist in the component tree but nothing calls the API yet. `TaskDetailPage`'s action set (Add another / Add subtask / Split / Start) is unchanged for this pass.

- [x] Consolidate conflicting snooze-semantics documentation across `ARCHITECTURE.md`, `PRIORI_ENGINE_MVP_TECHNICAL_DESIGN.md`, `POST_ENGINE_NEXT_STEPS.md`, `user_experience_process.md` — `ARCHITECTURE.md` is now the canonical description (`lastSuggestedAt = now` only); the others point back to it. (Note: `documentation/` is gitignored, so this edit isn't tracked by git.)

### Backend

- [ ] `queryTasks(db, userId)` — compute `hasChildren: boolean` per row using `groupTasksByParent` (section 10.1): `hasChildren = grouped.has(row.id)`; no extra query; flows through to every consumer (`GET /api/tasks`, `routes/rank.ts`)
- [ ] `routes/rank.ts` — merge `hasChildren` onto `inProgressTask` in the `in_progress_block` response using the `taskRows` it already has in scope
- [ ] `POST /api/tasks/:id/snooze` — new endpoint; sets `lastSuggestedAt = now()` only (per `ARCHITECTURE.md` § Task status); returns the updated row; 404 if not found
- [ ] `DELETE /api/tasks/:id` — single-call endpoint; optional body `{ childAction?: "delete" | "reparent" }`; `"delete"` recursively removes the task and all descendants in a transaction; `"reparent"` sets each direct child's `parentId = null` then deletes the task; a task with children but no `childAction` supplied (race condition) defaults to `"reparent"`; 404 if the task doesn't exist
- [ ] Update `apps/api/openapi.yaml` with both new endpoints and the `hasChildren` field (same commit)
- [ ] Update `ARCHITECTURE.md` recording the delete/reparent decision and `hasChildren` becoming a standard field on `Task` (same commit)
- [ ] Real-DB integration tests: snooze sets `lastSuggestedAt`; delete with no children; delete with children via `"delete"`; delete with children via `"reparent"`; delete on a nonexistent id → 404

### Frontend

- [ ] Add `hasChildren: boolean` to `Task` (`src/types/task.ts`)
- [ ] `taskService.ts` — add `snoozeTask(id)` and `deleteTask(id, childAction?)`; reuse `updateTask` for complete
- [ ] New `ConfirmDialog` component (`src/components/ConfirmDialog/`) — generic question + button-options popup. One component at a time; Storybook story required; review/approval needed before it's wired in
- [ ] Wire `RankingPage` → `ResultsPanel.onInProgressAction`: `complete`/`snooze` call their service function then re-run ranking; `delete` checks `task.hasChildren` — if true, opens `ConfirmDialog` first — then calls `deleteTask` exactly once with the decision (if any) already included, then re-runs ranking

---

## 13. Cascading Task Completion (`cascading-completion`)

**Depends on:** section 10.1 (`groupTasksByParent` primitive), section 12 (Complete action wired up).

When completing a task makes it the last non-completed direct child of its parent, the parent should automatically be marked `completed` too — and the check repeats up the ancestor chain, so finishing the last subproject under a project completes the project as well. The user finds out via accomplishment feedback after the fact, not a confirmation prompt beforehand. This applies uniformly regardless of the parent's priority — a priority-10/recurring parent is not exempt, even though "ongoing" tasks are expected to keep gaining children over time.

### Backend

- [ ] `PUT /api/tasks/:id` — when a status update results in `status: "completed"`, after committing, walk up the `parentId` chain using `groupTasksByParent`: at each level, check whether all direct children of that parent now have `status: "completed"`; if so, mark that parent `completed` too and continue to its parent; stop at the first parent with an incomplete child, or when there's no parent
- [ ] Run the cascade in the same DB transaction as the original status update, so a crash mid-cascade can't leave the tree half-completed
- [ ] Response shape: `{ task: <updated>, autoCompletedAncestors: Task[] }` — empty array when nothing cascaded
- [ ] Update `openapi.yaml` for the new response shape
- [ ] Update `ARCHITECTURE.md` recording this as a decision: automatic cascade (no per-level confirmation), applies uniformly regardless of priority/recurrence
- [ ] Real-DB integration tests: completing the last leaf under a parent completes the parent; completing the last remaining subproject under a project cascades two levels; completing a task with incomplete siblings does not cascade; completing the last child of a priority-10/recurring parent still auto-completes it

### Frontend

- [ ] `taskService.ts` — `updateTask`'s return type gains `autoCompletedAncestors`
- [ ] Surface accomplishment feedback when `autoCompletedAncestors` is non-empty (e.g. "You also finished 'Home Renovation'!"), in addition to the existing per-task completion feedback — exact placement (toast vs. banner vs. dedicated screen) ties into `ARCHITECTURE.md`'s planned "brief celebration" step, which isn't built yet and needs its own design pass before this can be wired up

---

## 14. Context theming (`context-theming`)

**Depends on:** Section 8 (contexts table must exist).

When a user creates a new context, assign it a stable color or theme seed so it always renders with the same background in the ranking carousel. Currently, slide colors are assigned by index into a fixed palette — this works but means colors shift if contexts are reordered or deleted.

### Tasks

- [ ] Add a `color` (or `theme_seed`) column to the `contexts` table; generate a migration
- [ ] On context creation (`POST /api/contexts`), auto-assign a color from the palette, cycling through available slots and avoiding duplicates where possible
- [ ] Return the color in `GET /api/contexts` responses
- [ ] Update the web frontend to use the DB-assigned color instead of index-based assignment
- [ ] Handle the edge case where more contexts exist than palette entries (cycle or generate complementary colors)

---

## 15. Offline sync (`offline-sync`) — placeholder

Deferred. Will cover: Dexie.js in `apps/web`; local IndexedDB schema mirroring the server schema; client-side UUID generation so the same id is used locally and in Postgres; a sync loop that drains `syncStatus: "pending"` writes to the API on the `online` event.

---

## 16. OpenAPI documentation maintenance (`openapi-maintenance`) — deferred, low priority

None of these are indicated by the project's current state — single dev user, no auth, `apps/api` reachable only at `localhost:3001`, one consumer (`apps/web`, local). Per `CLAUDE.md`'s "smallest footprint" guidance, don't do any of these preemptively; revisit each independently once its own trigger condition below is actually met.

- [ ] **Spec/route sync check** — `openapi.yaml` is hand-authored and nothing enforces that it matches the real route handlers; drift is caught only by remembering to update it per `CLAUDE.md`'s rule. Add automated verification (e.g. a script diffing paths in `src/routes/*.ts` against the spec, or `openapi-spec-validator` for at least catching YAML/schema syntax errors) in CI or as a pre-commit check.
  **Trigger:** endpoint count grows well past today's ~9, or spec drift has actually caused confusion or a bug at least once.
- [ ] **Publish docs outside the running server** — e.g. GitHub Pages hosting a static Swagger UI build + the spec, or serving `/docs` from a deployed instance. Right now docs only exist while the local dev server is running.
  **Trigger:** the API gains a consumer that isn't `apps/web` running locally — a second team, a deployed environment, a third-party integration. This mirrors the same "more than one consumer" condition `CLAUDE.md` already uses for the markdown → OpenAPI upgrade itself.
- [ ] **Gate or remove `/docs` and `/openapi.yaml`** — currently unauthenticated, which is fine while everything is localhost-only.
  **Trigger:** `apps/api` is deployed anywhere reachable outside localhost.
- [ ] **Revisit CORS** — `Access-Control-Allow-Origin` is hardcoded to `http://localhost:5173` in `lib/http.ts`.
  **Trigger:** same as above — any real deployment, or a second frontend origin.
- [ ] **Bump `swagger-ui-dist`** — pinned to `^5.32.14` in `apps/api/package.json`. Not tied to a project milestone; routine dependency maintenance whenever convenient.

---

## 17. Bottom navigation bar (`bottom-nav`)

Replace the current top `NavBar` (`src/components/NavBar/`) with a fixed bottom bar with icon links, matching the mobile-first patterns already used elsewhere in the app (FAB, swipeable carousel).

- [ ] Redesign `NavBar` as a fixed-position bottom bar; icon-based links for Rank / Tasks (label optional depending on space)
- [ ] Respect mobile safe-area insets (`env(safe-area-inset-bottom)`) so the bar sits above the home-indicator/gesture area on iOS/Android; add enough height/padding that icons aren't flush with the device edge
- [ ] Check for overlap with the `FAB` (bottom-right) and the carousel's dots/swipe-hint (bottom-center) — adjust their positioning if the new bar collides with either
- [ ] Update `NavBar` stories to reflect the new layout
- [ ] Review in Storybook — **approved**

---

## 18. App design review (`design-review`)

A broader visual/UX pass across the app. Not scoped yet — needs a walkthrough of current screens to produce a concrete list of issues before any implementation begins.

- [ ] Walk through all screens (Rank, Tasks, Task Detail, Task Creation) and note visual/UX inconsistencies
- [ ] Produce a prioritized list of design improvements
- [ ] Scope out and implement approved improvements as follow-up tasks

---

## 19. Loading sequence / loading page (`app-loading-gate`)

Currently the app renders straight into its routes on mount — there's no single point where cross-cutting startup concerns (auth, authorization, blocking-state checks) can run before the rest of the app appears. Build a generic bootstrap mechanism for that, independent of what the individual steps end up being (those are separate tasks — see 20).

- [ ] Create a `LoadingPage` / bootstrap gate component that runs on app mount, wraps the router, and renders before any route
- [ ] Design the gate as an ordered sequence of async steps; each step can pass through, redirect, or block until resolved
- [ ] Add a placeholder authentication step (no-op today; ties into section 7's deferred "User provisioning" design work), just to give the sequence the right shape for when auth exists
- [ ] Add a placeholder authorization step (no-op today), same reasoning
- [ ] Show a loading state while steps are in flight
- [ ] Update `ARCHITECTURE.md` documenting the gate as the app's bootstrap sequence

---

## 20. In-progress-task check as an early gate step (`in-progress-check`)

**Depends on:** section 19 (the loading gate must exist to add a step to it), section 21 (needs the dedicated route to redirect to).

Today, whether an in-progress task exists is discovered lazily and per-slide: `RankingPage` finds out only when a given carousel slide's `rank` call returns `in_progress_block`, so on refresh the user briefly sees the full ranking carousel, and then every slide (except the params slide) independently renders the same in-progress task. Replace this with a single check that runs once as a step in the loading gate (section 19), before any route renders.

- [ ] Add an in-progress-task check step to the loading gate: fetch tasks; if one has `status: "in_progress"`, redirect to the dedicated in-progress route (section 21)
- [ ] Keep the user on that route — block navigation to other routes — until they resolve it via Complete / Snooze / Delete
- [ ] Update `ARCHITECTURE.md` — record this step as the canonical place in-progress blocking is enforced, superseding the current per-slide discovery in `ResultsPanel`/`RankingPage`

---

## 21. Dedicated in-progress task route (`in-progress-route`)

**Depends on:** none — only needs the Start action (already done), not Complete/Snooze/Delete. The page can render with those buttons unwired, same as they are today in the ranking carousel's `InProgressBlock`; they'll light up once section 12 lands.

Add a standalone route/page for the in-progress task, separate from the ranking carousel, so section 20 has somewhere real to redirect to.

- [x] Add a new route (e.g. `/in-progress`) and page component
- [x] Reuse the existing `InProgressBlock` component (Complete/Snooze/Delete remain unwired until section 12 lands)
- [x] Register the route in `App.tsx`
- [ ] Hide the top `NavBar` (Rank / Tasks) on `/in-progress` — the `FAB` should be the only button visible on this route

---

## Open Issues

Issues that came up during implementation but were deferred to keep scope focused.

- **Split sibling title** — `POST /api/tasks/:id/split` creates the blank sibling with `title: ""`. Decide whether the API should accept an optional `siblingTitle` in the request body, or whether the client is always expected to prompt for it after navigation.
- **Carousel swipe direction** — currently parameterized (swipe-right reveals results). Finalize after UX testing whether this should be fixed or follow locale direction.
- **Ranking filtering and sort order** — when filtering by available time (e.g. 10 minutes), tasks that exceed the time budget are still returned. Investigate whether the engine's `durationScore` penalizes but doesn't exclude over-budget tasks, and whether a hard filter is needed. Additionally, returned tasks are not sorted in a user-intuitive order — sort results from low to high based on energy level and available time so the easiest/quickest tasks surface first.
- **Hide context label in context-specific slides** — when viewing results in a context-specific carousel slide (e.g. "Learning"), the context badge in each `TaskCard` is redundant. Only display the context label when the card is shown on the "All" slide.
- **Use EnergyIcon in TaskCard** — replace the "medium energy" text in `TaskCard` meta with the `EnergyIcon` component (from `EnergyPicker`) for a more compact, visual representation.
- ~~**ResultsSlide idle/loading text**~~ — replaced "Swipe here to load results" and "Loading…" text with a shimmer skeleton of 3 placeholder task cards for both `idle` and `loading` states. ✓
