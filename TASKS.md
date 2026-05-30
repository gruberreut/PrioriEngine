# Tasks

Implementation tasks for the engine ↔ web integration.

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

## 3. Web integration (`web-integration`)

Wire `RankingPage` to the live API; replace all hardcoded mock data.

- [ ] Add Vite dev proxy to `apps/web/vite.config.ts`: `/api` → `http://localhost:3001` (no CORS config needed in the browser)
- [ ] Create `apps/web/src/features/ranking/rankingService.ts` — exports `rank(params: RankParams): Promise<RankResultMode>` and `getContexts(): Promise<string[]>`; `rank` maps `RankParams → request body` (rename `energy → energyLevel`), calls `POST /api/rank`, maps the `RankResult` response to `RankResultMode` (rename `top → tasks`, map `NormalizedTask → TaskData` by picking the 7 fields `TaskData` needs; `ScoreBreakdown` fields match exactly)
- [ ] Update `RankingPage.tsx` — on mount call `getContexts()` and populate the `ParamsForm`; on submit call `rank(params)` (async, pass `loading` prop while pending); remove `MOCK_RESULT`; add an error state for when the API is unreachable

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

- [ ] `ARCHITECTURE.md` — update data model section and priority semantics table to reflect `location` field and revised context categories

---

## 6. Task Browser (`task-browser`)

A read-only page at `/tasks` that shows all tasks as an expandable tree. The collapsed view shows only titles and hierarchy; expanding a leaf reveals a dense `TaskCard` with its resolved field values. Parent nodes expand to reveal children only (no card — their fields exist to be inherited, not displayed standalone).

**Field inheritance rule:** child tasks may omit fields that exist on an ancestor. Before rendering, each task's effective values are resolved by walking up the parent chain — the same `inheritedValue` logic the engine normalizer uses.

---

### 6.1 Routing setup

- [ ] Install `react-router-dom`
- [ ] Update `App.tsx` to wrap the app in `<BrowserRouter>` with two routes: `/` → `RankingPage`, `/tasks` → `TasksPage`
- [ ] Add a minimal `NavBar` component (`src/components/NavBar/`) with links to both routes; write stories

### 6.2 `tasksService`

- [ ] Copy `packages/engine/test/data/tasks.example.json` to `apps/web/public/tasks.json`
- [ ] Create `apps/web/src/services/tasksService.ts` — exports `getTasks(): Promise<RawTask[]>`; initial impl uses `fetch('/tasks.json')`; swapping to `GET /api/tasks` later requires changing only this file

### 6.3 `resolveTask` utility

- [ ] Create `apps/web/src/features/tasks/resolveTask.ts` — exports `resolveTask(task: RawTask, ancestors: RawTask[]): ResolvedTask`
- [ ] `ResolvedTask` carries: `id`, `title`, `duration`, `energyRequired`, `location`, `contexts`, `status` — all resolved by walking the ancestor chain with the same `inheritedValue` logic as the engine normalizer; no filtering

### 6.4 `TaskCard` dense flavor

- [ ] Add `"dense"` to the `flavor` union in `TaskCard`; dense reduces padding and font sizes, hides score breakdown and action bar regardless of props
- [ ] Update `TaskCard` stories: add Dense story

### 6.5 `TaskTreeItem` component

- [ ] Create `apps/web/src/features/tasks/TaskTreeItem/`
- [ ] Props: `task: RawTask`, `ancestors: RawTask[]`, `depth: number`
- [ ] Collapsed state: one line — indent proportional to depth, chevron (parent) or bullet (leaf), title
- [ ] Leaf expanded: title row stays; dense `TaskCard` renders below using `resolveTask(task, ancestors)`
- [ ] Parent expanded: title row stays; children render as `TaskTreeItem` instances (no card for the parent itself)
- [ ] Write stories: LeafCollapsed, LeafExpanded, ParentCollapsed, ParentExpanded, DeepNesting

### 6.6 `TasksPage`

- [ ] Create `apps/web/src/features/tasks/TasksPage/`
- [ ] On mount, calls `tasksService.getTasks()`; shows loading state while pending, error state on failure
- [ ] Renders root-level `RawTask[]` as a list of `TaskTreeItem` components (depth 0)
- [ ] Write stories: Loading, Error, Populated

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

- [ ] Install PostgreSQL locally (Homebrew: `brew install postgresql@16`, or Docker)
- [ ] Add `drizzle-orm`, `drizzle-kit`, `pg`, `@types/pg` to `apps/api`
- [ ] Create `apps/api/src/db/schema.ts` — Drizzle schema definitions for all three tables
- [ ] Create `apps/api/src/db/index.ts` — exports db connection; reads `DATABASE_URL` env var
- [ ] Generate and apply first migration via drizzle-kit
- [ ] Create `apps/api/src/db/seed.ts` — creates one dev user + 4 default contexts: `Learning`, `Creativity`, `Projects`, `Physical`
- [ ] Add `"db:generate"`, `"db:migrate"`, `"db:seed"` scripts to `apps/api/package.json`
- [ ] Document `DATABASE_URL` in `apps/api/README.md`

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

Add DB-backed task and context endpoints alongside the existing JSON-backed ones. The JSON-backed `GET /api/tasks` and `GET /api/contexts` remain untouched until the ranking migration is planned.

**Source selection:** `?source=db` query parameter routes to the DB; omitting it falls through to the existing JSON-backed behaviour. This is intentionally temporary — see cleanup task below.

### Tasks

- [ ] `POST /api/tasks` — body: `{ id, parentId?, contextId?, title, priority, dueDate?, duration, energyRequired, location }`; `id` is a client-generated UUID; inserts into DB for the dev user; returns created task
- [ ] `GET /api/tasks?source=db` — returns all tasks for the dev user from DB as a flat array; `GET /api/tasks` (no param) continues reading from JSON file
- [ ] `POST /api/contexts` — body: `{ name }`; creates context for dev user; returns created context
- [ ] `GET /api/contexts?source=db` — returns all contexts for dev user from DB; `GET /api/contexts` (no param) continues reading from JSON file
- [ ] `POST /api/tasks/:id/split` — atomic transaction: (1) create new parent task from body `{ title }`; (2) set current task's `parent_id` to new parent's id; (3) create blank sibling task under same parent; returns `{ parent, original, sibling }`
- [ ] Update `apps/api/API.md` with all new endpoints including split mechanics and `?source=db` behaviour

**Future cleanup:** Remove `?source=db` parameter and JSON file fallback from `GET /api/tasks` and `GET /api/contexts` once the ranking pipeline is migrated to read from the DB. Track as part of the ranking migration planning.

---

## 9. Task entry UI (`task-entry-ui`)

FAB-triggered creation flow and post-creation task detail page.

**Depends on:** Section 6.1 (routing skeleton must exist before pages can be wired); Section 8 (API endpoints must exist before the form and detail page can talk to the server). Components 9.1 and 9.2 are pure UI and can be built ahead of the API.

One component at a time; Storybook review required before the next begins.

---

### 9.1 `DurationPicker`

**Depends on:** none — pure component, no API dependency.

4-button segmented control; identical structure and CSS pattern to `EnergyPicker`. No icons — text labels only.

- [ ] Props: `value: number`, `onChange: (value: number) => void`, `label?: string`, `disabled?: boolean`
- [ ] Options: `10` / `20` / `30` / `60` minutes; default `20`
- [ ] Write stories: Default (20 selected), Each option selected, Disabled
- [ ] Review in Storybook — **approved**

---

### 9.2 `PriorityPicker`

**Depends on:** none — pure component, no API dependency.

5-button segmented control; same button/CSS pattern as `EnergyPicker`. Selecting Urgent reveals an inline due date input below the picker.

- [ ] Props: `value: number`, `onChange: (value: number) => void`, `dueDate?: string`, `onDueDateChange?: (date: string) => void`, `label?: string`, `disabled?: boolean`
- [ ] Options and mappings: Urgent → 1, Soon → 3, Medium → 6, Later → 8, Ongoing → 10; default Soon (3)
- [ ] Due date input appears inline beneath the picker only when Urgent is selected
- [ ] Write stories: Default (Soon), Urgent selected (due date visible), Each option, Disabled
- [ ] Review in Storybook — **approved**

---

### 9.3 `TaskCreationForm`

**Depends on:** 9.1, 9.2, Section 8 (`POST /api/tasks`, `GET /api/contexts?source=db`, `POST /api/contexts`), Section 6.1 (routing — form lives at `/tasks/new`).

Composes all pickers into a single creation form. Submits via `POST /api/tasks` with a client-generated UUID.

- [ ] Fields: title (text input, required), context (`Select` populated from `GET /api/contexts?source=db`; includes an inline "New context…" option that calls `POST /api/contexts` and appends the result to the list), `PriorityPicker` (default Soon), `DurationPicker` (default 20 min), `EnergyPicker` (default medium), `LocationPicker` (default anywhere)
- [ ] On success: navigates to `/tasks/:id`
- [ ] Props: `onSubmit`, `onCancel`, `loading`, `contexts: string[]`
- [ ] Write stories: Default, Loading, With existing contexts
- [ ] Review in Storybook — **approved**

---

### 9.4 `FAB`

**Depends on:** Section 6.1 (needs routes to exist so the render condition can reference `/tasks/new`).

Fixed-position `+` button. Not rendered on the `/tasks/new` route (controlled at the router level, not via a prop).

- [ ] Props: `onClick`
- [ ] Write story: Default
- [ ] Review in Storybook — **approved**

---

### 9.5 `TaskDetailPage`

**Depends on:** 9.3 (tasks must be creatable before a detail page is useful), Section 8 (`GET /api/tasks?source=db`, `POST /api/tasks/:id/split`, `PUT /api/tasks/:id`), Section 6.1 (routing — page lives at `/tasks/:id`).

Shown immediately after task creation and reachable at `/tasks/:id`.

- [ ] Fetches task by id from `GET /api/tasks?source=db`; shows loading and error states
- [ ] Renders `TaskCard` with `showActionLabels={true}`, `flavor="outlined"`, and four actions:
  - **Add another** — navigates to `/tasks/new`
  - **Add subtask** — navigates to `/tasks/new?parentId=:id`
  - **Split** — calls `POST /api/tasks/:id/split`; navigates to the new parent's `/tasks/:parentId`
  - **Start** — calls `PUT /api/tasks/:id` with `{ status: "in_progress" }`; disabled when any task already has `status: "in_progress"` (checked from the loaded task list)
- [ ] Write stories: Default, Start disabled (in-progress exists), Loading, Error
- [ ] Review in Storybook — **approved**

### 9.6 Routing expansion

**Depends on:** Section 6.1, 9.3, 9.4, 9.5 all complete.

- [ ] Expand `App.tsx` routes (from 6.1) to add: `/tasks/new` → `TaskCreationForm`, `/tasks/:id` → `TaskDetailPage`
- [ ] Render `FAB` on all routes except `/tasks/new`

---

## 10. Offline sync (`offline-sync`) — placeholder

Deferred. Will cover: Dexie.js in `apps/web`; local IndexedDB schema mirroring the server schema; client-side UUID generation so the same id is used locally and in Postgres; a sync loop that drains `syncStatus: "pending"` writes to the API on the `online` event.
