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

## 17. Bottom navigation bar (`bottom-nav`)

Replace the current top `NavBar` (`src/components/NavBar/`) with a fixed bottom bar with icon links, matching the mobile-first patterns already used elsewhere in the app (FAB, swipeable carousel).

- [x] Redesign `NavBar` as a fixed-position bottom bar; icon-based links for Rank / Tasks (label optional depending on space) — done in § 22.1 (`position: fixed`, `--bottom-nav-*` tokens); this checklist was never ticked off at the time, found stale while auditing for archival
- [x] Respect mobile safe-area insets (`env(safe-area-inset-bottom)`) so the bar sits above the home-indicator/gesture area on iOS/Android; add enough height/padding that icons aren't flush with the device edge — `--bottom-nav-safe-area: env(safe-area-inset-bottom, 0px)`, § 22.1
- [x] Check for overlap with the `FAB` (bottom-right) and the carousel's dots/swipe-hint (bottom-center) — adjust their positioning if the new bar collides with either — confirmed clear in § 22.2 (`--fab-inset-bottom` accounts for the bar; Carousel's dots/hint needed no change)
- [x] Update `NavBar` stories to reflect the new layout — § 22.1
- [x] Review in Storybook — **approved** (§ 22.1)

---
