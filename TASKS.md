# Tasks

Implementation tasks for the engine ↔ web integration.

---

## 1. Engine API surface (`engine-api`)

Extract browser-safe utilities and add a clean programmatic entry point so `apps/api` can import the engine without pulling in Node.js file-system code.

- [ ] Create `packages/engine/src/treeUtils.ts` — move `isLeafTask`, `flattenTaskTree`, and `asTaskArray` out of `taskLoader.ts` into this new file
- [ ] Update `taskLoader.ts` to import those three functions from `treeUtils.ts`
- [ ] Update `normalizer.ts` to import `isLeafTask` from `treeUtils.ts` (removes its dependency on `taskLoader.ts`)
- [ ] Add `packages/engine/src/api.ts` — exports `rankFromPayload(tasks: RawTask[], params: RuntimeParams): RankResult`, which chains `asTaskArray → flattenTaskTree → normalizeTasks → rankTasks`
- [ ] Add `packages/engine/src/index.ts` — barrel re-exporting `rankFromPayload`, `RawTask`, `RuntimeParams`, `RankResult`, `RankedTask`, `ScoreBreakdown`, `NormalizedTask`
- [ ] Add `"exports": { ".": "./src/index.ts" }` to `packages/engine/package.json`
- [ ] Add tests for `rankFromPayload` in `packages/engine/test/` using existing fixtures; maintain coverage thresholds

---

## 2. API server (`api-server`)

Plain Node.js `http` server in a new `apps/api` workspace package. Loads tasks once at startup; exposes three endpoints.

- [ ] Create `apps/api/` with `package.json` — name `@priori/api`, workspace dep on `@priori/engine`, dev dep on `tsx`
- [ ] `apps/api/src/server.ts` — `http.createServer`; reads `PRIORI_TASKS_PATH` env var (falls back to `packages/engine/test/data/tasks.example.json`); loads and parses tasks once at startup
- [ ] `POST /api/rank` — parse JSON body `{ context?, location?, availableTime, energyLevel, explain, limit? }`, call `rankFromPayload`, respond with `RankResult` JSON; set `Content-Type: application/json` and CORS header for `http://localhost:5173`
- [ ] `GET /api/contexts` — derive distinct context labels from the loaded tasks, respond as `string[]` JSON
- [ ] `GET /api/tasks` — respond with the raw loaded task array (needed by the future task browser in section 7)
- [ ] Add `"dev": "tsx watch src/server.ts"` script to `apps/api/package.json`
- [ ] Add `"dev:api": "npm run dev -w @priori/api"` and `"dev:web": "npm run dev -w @priori/web"` to root `package.json`
- [ ] Verify all three endpoints with `curl` before wiring the frontend

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
