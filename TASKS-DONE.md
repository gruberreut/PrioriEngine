# Completed Tasks

Archive of fully-completed top-level sections from `TASKS.md` — see `CLAUDE.md` § Task Tracking for the archiving policy. Each section here was moved verbatim once every item in it (including all subsections) was checked off; `TASKS.md` keeps a one-line stub at that section number pointing back here.

Sections are appended in numeric order as they're archived.

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
- [x] Review in Storybook — **approved**

### 9.6 Routing expansion

**Depends on:** Section 6.1, 9.3, 9.4, 9.5 all complete.

- [x] Expand `App.tsx` routes (from 6.1) to add: `/tasks/new` → `TaskCreationPage`, `/tasks/:id` → `TaskDetailPage`
- [x] Render `FAB` on all routes except `/tasks/new`

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

- [x] `queryTasks(db, userId)` — compute `hasChildren: boolean` per row using `groupTasksByParent` (section 10.1): `hasChildren = grouped.has(row.id)`; no extra query; flows through to every consumer (`GET /api/tasks`, `routes/rank.ts`)
- [x] `routes/rank.ts` — merge `hasChildren` onto `inProgressTask` in the `in_progress_block` response using the `taskRows` it already has in scope
- [x] `POST /api/tasks/:id/snooze` — new endpoint; sets `lastSuggestedAt = now()` only (per `ARCHITECTURE.md` § Task status); returns the updated row; 404 if not found
- [x] `DELETE /api/tasks/:id` — single-call endpoint; optional body `{ childAction?: "delete" | "reparent" }`; `"delete"` recursively removes the task and all descendants in a transaction; `"reparent"` sets each direct child's `parentId = null` then deletes the task; a task with children but no `childAction` supplied (race condition) defaults to `"reparent"`; 404 if the task doesn't exist
- [x] Update `apps/api/openapi.yaml` with both new endpoints and the `hasChildren` field (same commit)
- [x] Update `ARCHITECTURE.md` recording the delete/reparent decision and `hasChildren` becoming a standard field on `Task` (same commit)
- [x] Real-DB integration tests: snooze sets `lastSuggestedAt`; delete with no children; delete with children via `"delete"`; delete with children via `"reparent"`; delete on a nonexistent id → 404

### Frontend

- [x] Add `hasChildren: boolean` to `Task` (`src/types/task.ts`)
- [x] `taskService.ts` — reuse `updateTask` for complete
- [x] `taskService.ts` — add `snoozeTask(id)` and `deleteTask(id, childAction?)`
- [x] New `ConfirmDialog` component (`src/components/ConfirmDialog/`) — generic question + button-options popup. One component at a time; Storybook story required; review/approval needed before it's wired in
- [x] Wire `RankingPage` → `ResultsPanel.onInProgressAction` and `InProgressPage`'s `InProgressBlock.onAction`: `complete` calls `updateTask(id, { status: "completed" })` then re-runs ranking (`RankingPage`) or navigates back to `/` (`InProgressPage`)
- [x] Wire `snooze`: call `snoozeTask` then re-run ranking
- [x] Wire `delete`: check `task.hasChildren` — if true, opens `ConfirmDialog` first — then calls `deleteTask` exactly once with the decision (if any) already included, then re-runs ranking

---

## 17. Bottom navigation bar (`bottom-nav`)

Replace the current top `NavBar` (`src/components/NavBar/`) with a fixed bottom bar with icon links, matching the mobile-first patterns already used elsewhere in the app (FAB, swipeable carousel).

- [x] Redesign `NavBar` as a fixed-position bottom bar; icon-based links for Rank / Tasks (label optional depending on space) — done in § 22.1 (`position: fixed`, `--bottom-nav-*` tokens); this checklist was never ticked off at the time, found stale while auditing for archival
- [x] Respect mobile safe-area insets (`env(safe-area-inset-bottom)`) so the bar sits above the home-indicator/gesture area on iOS/Android; add enough height/padding that icons aren't flush with the device edge — `--bottom-nav-safe-area: env(safe-area-inset-bottom, 0px)`, § 22.1
- [x] Check for overlap with the `FAB` (bottom-right) and the carousel's dots/swipe-hint (bottom-center) — adjust their positioning if the new bar collides with either — confirmed clear in § 22.2 (`--fab-inset-bottom` accounts for the bar; Carousel's dots/hint needed no change)
- [x] Update `NavBar` stories to reflect the new layout — § 22.1
- [x] Review in Storybook — **approved** (§ 22.1)

---

## 21. Dedicated in-progress task route (`in-progress-route`)

**Depends on:** none — only needs the Start action (already done), not Complete/Snooze/Delete. The page can render with those buttons unwired, same as they are today in the ranking carousel's `InProgressBlock`; they'll light up once section 12 lands.

Add a standalone route/page for the in-progress task, separate from the ranking carousel, so section 20 has somewhere real to redirect to.

- [x] Add a new route (e.g. `/in-progress`) and page component
- [x] Reuse the existing `InProgressBlock` component (Complete/Snooze/Delete remain unwired until section 12 lands)
- [x] Register the route in `App.tsx`
- [x] Hide the top `NavBar` (Rank / Tasks) on `/in-progress` — the `FAB` should be the only button visible on this route

---

## 29. Delete action in the tasks list (`task-list-delete`)

Adds delete for the plain task-browsing list (`TasksPage` → `TaskTreeItem`),
reusing the `DELETE /api/tasks/:id` endpoint and `ConfirmDialog`
children-choice flow already built in §12 for the in-progress block. Full
design in `documentation/techDesign/task-list-delete/design.md`.

Leaf rows switch off `TaskCard`'s `dense` flavor (which blocked its
`actions` prop) onto the normal `TaskCard`, since more per-task actions are
expected later (add-to-project, reparent) and should reuse the same
mechanism `InProgressBlock`/`TaskDetailPage` already use rather than a
one-off. That mechanism's button is extracted into a shared `ActionButton`
(`src/components/ActionButton/`) so the tree's project/parent rows (not
`TaskCard` at all) can show the same delete affordance. The delete itself is
optimistic — removes the task locally and calls the API in the background,
only resyncing from the server if that call fails — deliberately scoped to
this one page rather than building a general mechanism now (see §30/§31).

- [x] Extract `ActionButton` (`src/components/ActionButton/`) from `TaskCard`'s inline action-button rendering; `TaskCard.tsx` now composes it
- [x] Drop `TaskCard`'s `dense` flavor (was only used by `TaskTreeItem`) — removed from the prop union, CSS, and the `Dense` story
- [x] Move `getDescendants` from `TaskTreeItem.tsx` into the shared `resolveTask.ts`; added test coverage
- [x] `TaskTreeItem.tsx` — leaf rows render `flavor="outlined"` with a `delete` action; project/parent rows get a single `ActionButton` delete affordance; `onDelete` threaded through recursion
- [x] `TasksPage.tsx` — optimistic delete: `removeLocally`/`reparentLocally` update state immediately; `deleteTask(...).catch(...)` only triggers a "something went wrong" `ConfirmDialog` on failure, whose OK calls `getTasks()` to resync
- [x] `resolveTask.test.ts`, `tsc -b --noEmit`, `vitest run`, `eslint`, `stylelint` all clean
- [x] Review in Storybook — `Atomic/ActionButton`, `Entity/TaskCard`, `Features/Tasks/TaskTreeItem`, `Features/Tasks/TasksPage` — **approved**

---
