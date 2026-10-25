# Completed Tasks

Archive of fully-completed top-level sections from `TASKS-BUGS.md`, `TASKS-TECH.md` and `TASKS-FEATURES.md` (before those, `TASKS.md`) — see `CLAUDE.md` § Task Tracking for the archiving policy. Each section here was moved verbatim once every item in it (including all subsections) was checked off. No stub is left behind in the active files: a section number missing from them is here.

Sections archived after the split carry a `Type: tech` or `Type: feature` line under their heading. Fixed bugs are archived individually under § 10.

Sections are kept in numeric order.

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

### User provisioning (`user-provisioning`)

The seed script covers the single dev user. When real user accounts are
added (auth phase), the server must automatically provision default
contexts for every new user. Full plan in
`documentation/techDesign/user-provisioning/design.md`, written ahead of
auth so the provisioning shape is settled before it has to be threaded
through whichever auth approach gets picked.

(Since renamed to `documentation/techDesign/user-provisioning/lld.md`.)

Decided: default context list stays hardcoded (no config table — nothing
has ever needed to edit it without a deploy) but extracted to one shared
constant/function (`provisionDefaultContexts`) instead of living only in
`seed.ts`; provisioning triggers synchronously, in the same request,
immediately after a `users` row is first inserted (no DB trigger, no
standalone `POST /api/users` endpoint — that would be unauthenticated with
no auth chosen yet); idempotency is gated on "the insert actually returned
a new row" (same shape `seed.ts` already uses), with `onConflictDoNothing`
on the context batch insert as defense-in-depth for a concurrent
double-signup race only; a deleted default context is not re-created — it's
ordinary user data once created, same as any other context. The actual
auth implementation and its call site are out of scope and deferred until
auth work begins; `seed.ts` becomes a thin caller of the same shared
function so the dev and (future) production paths don't duplicate the
insert logic.

- [x] Write detailed plan for user provisioning flow before auth implementation begins

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

### 10.2 `Carousel.tsx` fails typecheck under React 19's updated `useRef` types

Surfaced while typechecking section 22's changes (`npx tsc -b --noEmit`) — unrelated to that work, pre-existing.

`src/components/Carousel/Carousel.tsx:27` — `const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();` calls `useRef` with no argument. React 19's types dropped the zero-argument overload; `useRef` now requires an explicit initial value.

- [x] Change to `useRef<ReturnType<typeof setTimeout>>(undefined)` (or a matching explicit initial value) so `npx tsc -b --noEmit` passes clean

---

### 10.3 Carousel active-dot tracking still feels laggy after a swipe

Surfaced during § 22.7's Storybook review (the Carousel Layer-3 migration, which added the dot's elongate transition and made the lag noticeable).

`Carousel.tsx`'s `handleScroll` debounces `onSlideChange` (which drives `activeIndex`, which drives the active dot) until scroll events stop — reduced from 100ms to 40ms as part of § 22.7, which helped but didn't fully fix it. User confirmed it's still perceptibly slow but chose not to invest further time now.

- [x] Investigate a fix that doesn't rely on a fixed post-scroll debounce — e.g. computing the nearest slide index continuously during scroll (`requestAnimationFrame` or the scroll event itself) so the dot tracks live rather than catching up after the fact. Resolved: added a `liveIndex` state, updated via an `requestAnimationFrame`-throttled read of `scrollLeft` on every scroll event, decoupled from the settle debounce; the dot's active class now follows `liveIndex` instead of `activeIndex`
- [x] Re-check whether any further debounce reduction below 40ms is safe (risk: `onSlideChange` firing mid-scroll, which the debounce exists to prevent) before or alongside the above. Resolved: moot — the 40ms debounce now only gates the committed `onSlideChange` call, not the dot's visual feedback, so there's no remaining tradeoff to tune; left at 40ms

---

### 10.4 `PriorityPicker` overflows horizontally on small mobile widths

Surfaced during § 24.2's Storybook/app review.

`PriorityPicker.module.css`'s `.group` lays out all five options (Urgent/Soon/Medium/Later/Ongoing) as a single-row segmented control (`.button { flex: 1; }` with fixed `padding: var(--space-2) var(--space-3)`), with no wrapping or min-width handling. At small mobile widths (e.g. 360pt) the five labels plus padding don't fit, and the row overflows rather than shrinking or wrapping.

- [x] Investigate a fix — candidates: smaller padding/font at narrow widths, wrapping onto two rows, or a horizontally scrollable row — and check whether `DurationPicker`/`EnergyPicker`/`LocationPicker` (same segmented-row pattern) have the same problem. Resolved: overflow lives in the shared `SplitGroup` primitive (covers `PriorityPicker`/`DurationPicker`/`EnergyPicker`), not per-picker CSS. `SplitGroup` now shows a vertical `Radio` list (mobile-first base, `Radio` gained an `icon` slot) with the pill row layered on via `@media (width >= 320px)` — breakpoint set by explicit user choice, below the ~480px point the 5-option row actually starts overflowing, so the fallback is a deliberate rare/edge-case path for now (see `ARCHITECTURE.md`). `LocationPicker`'s separate `Chip`-based row got a defensive `flex-wrap: wrap` only.

---

### 10.5 Entry/loading screen shows "Priori" instead of the app's name — fixed

Per `CLAUDE.md`'s Naming section: "Priori" is reserved for the backend ranking engine specifically. Originally filed to rename to "Tendril"; superseded mid-flight once "Tendril" itself turned out to need replacing (see §41) — landed against the "TempAppName" placeholder instead, so it doesn't need touching again until §41 picks a real name.

`apps/web/src/features/loading/LoadingScreen/LoadingScreen.tsx:8-9` — the `Icon` label and the wordmark `<span>` read "Priori". Line 10's "Powered by Priori Engine" is correct as-is and was left unchanged.

- [x] Changed the `Icon`'s `label` prop and the wordmark text on lines 8–9 from "Priori" to "TempAppName"; line 10 untouched

---

### 10.6 Duplicate context option after creating one from the task-creation Select

Reported by the user. Repro: on the task-creation page, open the context `Select`, choose "New context…", create one. Reopen the context `Select` — the newly created context is listed twice, and the browser console logs a "two children with the same key" React warning.

**Actual cause (differs from the original hypothesis):** not a re-entrancy issue — `handleAddContext` only ever ran once per click/Enter. The real cause was two independent lists both tracking the same created context: `TaskCreationPage.tsx`'s `handleCreateContext` appends the new context to its own `contexts` state after `onCreateContext` resolves, while `TaskCreationForm.tsx` also appended it to its own local `addedContexts` state. `allContexts = [...contexts, ...addedContexts]` then contained the same `id` twice as soon as the parent's updated `contexts` prop flowed back down — deterministic on every context creation, not a race.

- [x] Confirmed the actual cause by tracing `onCreateContext`'s one real call site (`TaskCreationPage.tsx`) rather than assuming the original hypothesis
- [x] Fixed by extracting `mergeContexts(contexts, addedContexts)` in `TaskCreationForm.tsx` — dedupes by `id`, caller's `contexts` list wins on overlap; keeps `addedContexts` as a fallback for callers (e.g. Storybook) that don't reflect the new context back into `contexts` themselves. Also added a cheap `if (contextLoading) return;` guard at the top of `handleAddContext` as defense-in-depth against the originally-suspected double-invocation, even though it wasn't the actual cause
- [x] Added `TaskCreationForm.test.ts` (first test file for this component) covering `mergeContexts`: appends a new context, dedupes when the caller's list already has it (caller's version wins), and the empty case

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

## 14. Context theming (`context-theming`)

**Depends on:** Section 8 (contexts table must exist).

When a user creates a new context, assign it a stable `slide_index` so it always renders with the same background in the ranking carousel. Currently, slide colors are assigned by index into a fixed palette — this works but means colors shift if contexts are reordered or deleted.

The DB stores an index, not a color value. The frontend maps that index onto the existing `--color-slide-{n}` design tokens (`apps/web/src/styles/tokens.css`), which are already light/dark-aware — see `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 8.7. This keeps one color system instead of two.

- [x] Light-mode slide tints finalized per `documentation/Carousel backgrounds per theme.png` (dark-mode tints already matched this doc from § 22.1/22.7; only light was still the earlier washed-out placeholder) — `--tendril-slide-0..7` and `--tendril-slide-params` in `tokens.css` updated to the doc's hex values, comments unchanged since the hue/degree labels already matched

**Assignment order decision:** `slide_index` must be assigned by a monotonically increasing counter (`(max assigned + 1) mod 8`), never by reusing the first free slot left by a deleted context. The design doc's hue wheel is meant to read in a fixed, pleasing order — reusing gaps could put a newer context at an earlier index than an older one, so contexts wouldn't display in ascending hue-wheel order even though display order is otherwise creation order. The accepted trade-off is the reverse case — heavy create/delete churn can eventually make two live contexts share a hue after wrapping past 8 — which is a smaller visual problem than out-of-order hues and is expected to be rare at this app's current single-user scale.

### Tasks

- [x] Add a `slide_index` (integer) column to the `contexts` table; generate a migration. Existing rows backfilled via `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at)` before the column was made `NOT NULL` (no default — every insert path now supplies it explicitly)
- [x] On context creation (`POST /api/contexts`), assign `slide_index` from a monotonically increasing per-user counter, wrapping mod 8 (never reuse a freed index — see decision above). Computed as `(MAX(slide_index) for this user + 1) mod 8` inside the same transaction as the insert
- [x] Return `slide_index` in `GET /api/contexts` responses
- [x] Update the web frontend to key `--color-slide-{n}` off the context's `slide_index` instead of raw carousel-page position. `RankingPage.tsx` now uses `getContextItems()` (was the name-only `getContexts()`) and colors each slide via `SLIDE_PALETTE[slideIndex % 8]`; the "All" slide has no `slideIndex` and stays pinned to `SLIDE_PALETTE[0]`, unchanged from its previous de facto behavior
- [x] Sort contexts by `slide_index` (not raw fetch/DB order) when building the carousel slides, so display order always matches the intended hue-wheel order. Done server-side — `GET /api/contexts` orders by `slide_index ASC`, so the frontend doesn't need to re-sort
- [x] Handle the edge case where more contexts exist than palette entries (indices repeat past 8, per the wraparound above — confirm this reads acceptably rather than confusingly once it's actually reachable). Covered by a wraparound test (`contexts.test.ts`); visual confirmation once a user actually reaches 9 contexts is deferred, as this is expected to be rare at current scale
- [x] Moved `routes/contexts.ts` from a mocked-DB test to a real-DB one (`CLAUDE.md`'s API Testing Strategy) now that `slide_index` assignment is a real invariant, not simple CRUD

---

## 17. Bottom navigation bar (`bottom-nav`)

Replace the current top `NavBar` (`src/components/NavBar/`) with a fixed bottom bar with icon links, matching the mobile-first patterns already used elsewhere in the app (FAB, swipeable carousel).

- [x] Redesign `NavBar` as a fixed-position bottom bar; icon-based links for Rank / Tasks (label optional depending on space) — done in § 22.1 (`position: fixed`, `--bottom-nav-*` tokens); this checklist was never ticked off at the time, found stale while auditing for archival
- [x] Respect mobile safe-area insets (`env(safe-area-inset-bottom)`) so the bar sits above the home-indicator/gesture area on iOS/Android; add enough height/padding that icons aren't flush with the device edge — `--bottom-nav-safe-area: env(safe-area-inset-bottom, 0px)`, § 22.1
- [x] Check for overlap with the `FAB` (bottom-right) and the carousel's dots/swipe-hint (bottom-center) — adjust their positioning if the new bar collides with either — confirmed clear in § 22.2 (`--fab-inset-bottom` accounts for the bar; Carousel's dots/hint needed no change)
- [x] Update `NavBar` stories to reflect the new layout — § 22.1
- [x] Review in Storybook — **approved** (§ 22.1)

---

## 20. In-progress-task check as an early gate step (`in-progress-check`)

**Depends on:** section 19 (the loading gate must exist to add a step to it), section 21 (needs the dedicated route to redirect to).

Today, whether an in-progress task exists is discovered lazily and per-slide: `RankingPage` finds out only when a given carousel slide's `rank` call returns `in_progress_block`, so on refresh the user briefly sees the full ranking carousel, and then every slide (except the params slide) independently renders the same in-progress task. Replace this with a single check that runs once as a step in the loading gate (section 19), before any route renders.

- [x] Add an in-progress-task check step to the loading gate: fetch tasks; if one has `status: "in_progress"`, redirect to the dedicated in-progress route (section 21)
- [x] Keep the user on that route — block navigation to other routes — until they resolve it via Complete / Snooze / Delete. Three small pieces, not one mechanism: `NavBar`'s `linksHidden` already removed its links from the DOM (not just CSS) on `/in-progress`; `AppShell`'s `showFAB` gained the same condition, since the FAB was the one remaining in-app affordance that could navigate away; and a typed URL/bookmark to any other route triggers a full reload, re-running `inProgressStep` from scratch and bouncing back if still in progress. Browser back/forward wasn't specifically hardened — the redirect uses `{ replace: true }`, so there's normally no same-session history entry underneath to go back to
- [x] Update `ARCHITECTURE.md` — record this step as the canonical place in-progress blocking is enforced, superseding the current per-slide discovery in `ResultsPanel`/`RankingPage` (not yet true — the gate only runs on initial mount, so the per-slide check still catches a task started mid-session without a reload; revisit once that's unified too). Documented honestly rather than as a completed supersession: the new "Staying on /in-progress until resolved" note in `ARCHITECTURE.md` explains what the gate now covers and explicitly says the per-slide check remains the fallback for the mid-session case — full supersession is still a future task, not something this bullet claims is done

---

## 21. Dedicated in-progress task route (`in-progress-route`)

**Depends on:** none — only needs the Start action (already done), not Complete/Snooze/Delete. The page can render with those buttons unwired, same as they are today in the ranking carousel's `InProgressBlock`; they'll light up once section 12 lands.

Add a standalone route/page for the in-progress task, separate from the ranking carousel, so section 20 has somewhere real to redirect to.

- [x] Add a new route (e.g. `/in-progress`) and page component
- [x] Reuse the existing `InProgressBlock` component (Complete/Snooze/Delete remain unwired until section 12 lands)
- [x] Register the route in `App.tsx`
- [x] Hide the top `NavBar` (Rank / Tasks) on `/in-progress` — the `FAB` should be the only button visible on this route

---

## 22. TempAppName design token rollout (`tendril-design-rollout`)

Type: tech

Moved from `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 8 ("Tasks — what the patch could not carry"). That document's §§ 1–7 define the three-layer token model and the per-component diffs (§3 existing components, §4 new primitives, §5 the per-component checklist, §6 Storybook additions, §7 the CLAUDE.md block); its § 9 gives the suggested build order across this section and those component-by-component tasks. Original subsection numbers (8.1–8.9) are kept below as 22.1–22.9 for traceability back to that doc's own cross-references.

`priori-patch/` contained complete file replacements for §§ 22.1–22.2 (since deleted — see § 22.9). Everything else here needs a call site the patch couldn't see, a decision, or a file outside `apps/web/src`.

---

### 22.1 Apply the patch (`tendril-tokens-apply`)

Prerequisite for all the rest.

**Strategy change:** the tree has since diverged from the patch's baseline with in-progress dark/light theme work (`useTheme`, `ThemeToggle`, per-slide dark tints). Treat `priori-patch/apps/web/src/**` as suggested diffs, not a blind copy — reconcile file-by-file, one component at a time, and only apply where there's no unresolved conflict. Discuss and resolve real conflicts before applying (e.g. `NavBar`'s existing theme-toggle wiring, which the patch's `NavBar` predates). Each slice: Storybook verification → commit → update this file before moving to the next.

- [x] `tokens.css` foundation tokens reconciled and applied: spacing (`--space-5/6/7`), font sizes (`--font-size-body/meta/micro`), border radius rename + expansion (`--radius-xs/sm/md/lg/xl/full`, 6px/8px → 12px/16px), control heights, focus ring, motion, z-index, and the Layer-3 `--bottom-nav-*`/`--fab-*` groups. Dark slide tints (`--tendril-d-slide-*`) deliberately left as-is — deferred to § 22.7 where they're actually consumed; the color-story plan itself flags that design as unconfirmed (single tint vs. eight hues) and the patch offers a third, uncompared option.
- [x] `DesignTokens.mdx` updated to match: Spacing/Border Radius sections now read values live via `useTokenValue` (previously hardcoded px labels, which had already gone stale on the radius rename) and list all the new tokens
- [x] Reconcile and apply `NavBar.tsx`/`NavBar.module.css`/`NavBar.stories.tsx` and the two new icon assets (`Tendril.tsx`, `ListChecks.tsx`) — on inspection the patch's `NavBar` already carried the `ThemeToggle`/`useTheme` wiring forward (an earlier read of a stale diff wrongly suggested otherwise), so this landed close to verbatim. Bar is now `position: fixed` to the bottom using `--bottom-nav-*` tokens — will visually overlap page content until § 22.2 adds shell padding (expected, sequenced). Storybook stories brought in line with the `defaultArgs` convention (the previous file predated it). Approved in Storybook.
- [x] Reconcile and apply `FAB.module.css` (additive only, no known conflicts). Approved in Storybook.
- [x] `stylelint` flagged 11 formatting violations in the patch's CSS (blank-line/declaration-order rules, `max-width` media query) — the patch predates the `.stylelintrc.json` the color-story work added. Fixed with `--fix`, purely cosmetic. **Note for § 22.8**: the new-primitive patches will likely hit the same gap — run `stylelint --fix` on each as it lands.
- [x] Confirm `--radius-sm` 6px → 12px and `--radius-md` 8px → 16px landed, then run the visual audit from `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 2 — the rename reaches roughly fifteen files beyond `Select`/`NavBar`/`ThemeToggle` (full list in that section). Visual audit covered `Select`, `ThemeToggle`, `TaskCard`, `EmptyState`, `EnergyPicker`, `InProgressBlock`, `LocationPicker`, `ResultsSlide`, `DurationPicker`, `PriorityPicker`, `TaskCreationForm`, `TaskCreationPage`, `TaskTreeItem` — **all approved** in Storybook
- [x] `npm run typecheck` (`apps/web` has no `typecheck` script — use `npx tsc -b`) — clean except the same two pre-existing, unrelated errors (`Carousel.tsx` argument count, `vite.config.ts` `test` property). One new error surfaced from the patch's `NavBar.stories.tsx` (`Cannot find namespace 'JSX'` on a bare `JSX.Element` type) — fixed by importing `ReactElement` from `react` instead.
- [x] Confirm `test/tokenParity.test.ts` still passes with the Layer-3 block present (verified — the test only extracts the `:root[data-theme='dark']` and `@media (prefers-color-scheme: dark)` blocks by selector, so the block is never inspected)
- [x] Review in Storybook — **approved**

---

### 22.2 App-shell bottom padding (`bottom-nav-inset`)

Without this the fixed bar covers the last item of every scrollable route. Applies once on the shell rather than per page.

**Finding:** "applies once on the shell" didn't fully hold as written. `AppShell` is a Fragment (no DOM node) and `NavBar`/`FAB` are `position: fixed`, so `#root` (`index.css`) already *is* the element wrapping `<Routes>` — no new wrapper needed. But only Rank and Tasks were `flex: 1; min-height: 0`-constrained against it; Task Detail, Task Creation, and In-Progress (not in this checklist's original route list — added after it was written, same bug) had no height constraint at all and relied on native document scroll, so a shell-level padding would never have reached them. Discussed three options (shell+per-route patch / unify scroll architecture / no-cascade symmetric fix) — chose **unify**: bring all routes onto the same `flex: 1; min-height: 0; overflow-y: auto` pattern `TasksPage` already used, so one shell padding genuinely covers everyone and any future route follows the same self-enforcing convention.

- [x] Added `padding-bottom: calc(var(--bottom-nav-total-height) + var(--space-4))` to `#root` in `index.css`
- [x] Unified `TaskDetailPage`, `TaskCreationPage`, and `InProgressPage` onto `flex: 1; min-height: 0; overflow-y: auto` (matching `TasksPage`); `RankingPage`/`Carousel` already used the constrained pattern via `.page` → `.wrapper` (`height: 100%`) → `.carouselContainer` (`flex: 1`) → `.slide` (`height: 100%; overflow-y: auto`)
- [x] Confirmed the Carousel's dots and swipe hint clear the bar — no `Carousel.module.css` change needed, confirmed correct. Also found and removed a now-redundant `padding-bottom: env(safe-area-inset-bottom, 0)` on `RankingPage.module.css`'s `.page`, left over from before the bottom-nav redesign — it double-counted the safe-area inset now already folded into `--bottom-nav-total-height`
- [x] Checked in Chrome DevTools mobile emulation and Storybook — nothing sits under the inset. **Not verified on a physical device with a home indicator** — flag for a follow-up check when one's available
- [x] Review in Storybook — **approved**

---

### 22.3 Hide navigation on blocking routes (`bottom-nav-links-hidden`)

§ 17 and § 21 above both want this; the `linksHidden` prop exists on `NavBar` but nothing passes it.

- [x] Pass `linksHidden` to `NavBar` on `/in-progress` (`App.tsx`: `linksHidden={location.pathname === "/in-progress"}`) so the FAB and the theme toggle remain the only actions visible
- [x] Decide whether the bar renders at all on that route, or renders with the theme control only — went with the patch's assumption (bar keeps its place, theme control only) since that was already built into `NavBar` in § 22.1; no further change needed here
- [x] Confirm the FAB's `--fab-inset-bottom` still clears the bar in the links-hidden state — unaffected either way, since the bar's height (`--bottom-nav-total-height`) doesn't change based on `linksHidden`
- [x] Review in Storybook — **approved**

---

### 22.4 Decide where the theme control lives (`theme-control-placement`)

Kept in the bar's right slot so nothing else breaks, but a three-option segmented control inside a bottom nav is crowded at 360pt and has no icon language of its own.

**Decision (superseded the three original options):** rather than keep a manual toggle anywhere right now, `auto` switches theme by time of day instead of OS preference (`timeOfDayTheme()` in `useTheme.ts` — see `documentation/ARCHITECTURE.md`). No UI at all for now; `window.switchTheme('light' | 'dark' | 'auto')` from the browser console is the only manual override until a real settings screen exists (tracked below, § 23, deferred/low priority).

- [x] Decided: no manual control in the bar or anywhere else yet — see above
- [x] Removed the `themeToggle` slot from `NavBar.module.css` and the `useTheme`/`ThemeToggle` imports from `NavBar.tsx` — the component now has no theme knowledge at all. `.nav`'s `justify-content` changed from `space-between` to `center` now that there's nothing to push to the right
- [x] `useTheme()` still needs to run somewhere for its side effects (applying the theme, exposing `window.switchTheme`) even with no UI — mounted in `App.tsx`'s `AppShell` instead
- [x] Fixed a flash-of-wrong-theme regression this introduced: `index.html`'s inline anti-flash script resolved `'auto'` via the CSS `prefers-color-scheme` fallback, which can now disagree with the JS-computed time-of-day value (e.g. OS set to dark mode at 3pm) — the script now duplicates the same hour split to resolve `'auto'` before first paint
- [x] Review in Storybook — **approved**

---

### 22.5 Record the token architecture (`tendril-tokens-docs`)

- [x] Renamed `documentation/Tendril - applying the design to components.md` to `documentation/DESIGN-TOKENS-BY-COMPONENT.md` (`git mv`, content unchanged) and updated the seven other references to the old filename elsewhere in this file
- [x] Added that document's § 7 block to `CLAUDE.md` under a new `## Design tokens` heading, after the Storybook section
- [x] Updated the `ARCHITECTURE.md` "Design tokens" entry from two layers to three: what was decided, the forces (per-component adjustability without a preprocessor or a build step), and the rejected alternatives (a single flat token layer; per-component CSS files owning their own values; a generated `tokens.ts`)
- [x] Noted in the same entry that Layer 3 deliberately sits outside the light/dark split, and why

---

### 22.6 Storybook token surface (`storybook-component-tokens`)

Makes the Layer-3 block self-documenting instead of a second thing to maintain.

- [x] Built `<ComponentTokens prefix="--bottom-nav-" />` in `src/styles/ComponentTokens.tsx`, on the existing `useTokenValue`/`listTokens` — lists whatever is actually in `tokens.css`, resolved through the cascade, following the theme toolbar. Along the way, fixed an inconsistency the assertion below would otherwise have caught the reference implementation on: `NavBar`/`FAB` both referenced `--focus-ring`/`--focus-ring-offset` (Layer 2) directly in their `:focus-visible` rules — added `--bottom-nav-focus-ring` and `--fab-focus-ring-offset` (Layer 3, same resolved values, zero visual diff) so they route through Layer 3 like everything else
- [x] Added it to the docs page of every migrated component — no per-component docs-page precedent existed yet (no `tags: ['autodocs']`, no component `.mdx` files), so added `NavBar.mdx`/`FAB.mdx` using `<Meta of={...Stories} />` to attach custom docs to the existing story files; this is the template future migrated components (§ 22.8) should follow
- [x] Added a test assertion (`src/styles/layer3.test.ts`) that no `*.module.css` in a migrated component's directory references `--color-*`/`--radius-*`/`--shadow-*`/`--control-height-*`/`--focus-ring*` directly (the `--space-*`/font-family/`--motion-*` carve-out from CLAUDE.md stays allowed), failure message pointing at `documentation/DESIGN-TOKENS-BY-COMPONENT.md`
- [x] Added a matching assertion in the same file that every `/* Label — components/Dir */` group Layer 3 declares has a matching `src/components/Dir` directory on disk, to catch tokens orphaned by a rename. Both assertions discover their component set from `tokens.css`'s own Layer-3 group comments (currently `NavBar`, `FAB`), so they self-scale as more components migrate rather than needing a maintained list
- [x] Review in Storybook — **approved**

---

### 22.7 Carousel page tints (`carousel-page-tints`)

The eight dark values are real now, so this is unblocked. Reconciled with § 14 above (context theming): the DB stores a `slide_index` per context, not a color value, and the frontend maps that index onto `--color-slide-{n}`, which is already theme-aware — one color system, not two.

- [x] `background: var(--color-slide-{n})` per page, indexed from raw carousel-page position, was already wired (`RankingPage.tsx`'s `SLIDE_PALETTE`) — this is the § 14 fallback path itself, so nothing to add here; will automatically switch to `slide_index`-based indexing once § 14's DB column lands
- [x] Gave the Carousel a Layer-3 group (`--carousel-*`, `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 3.7) and moved `.dot`/`.dotActive`/`.hint` onto it — `.dot` 8×8 → `--carousel-dot-size` (6px), `.dotActive` gains a `width` transition to `--carousel-dot-size-active` (16px, elongates rather than resizing), `border-radius: 50%` → `--radius-full`, hint `color`/`font-size` → `--carousel-hint-fg`/`--carousel-hint-size`
- [x] Replaced the dark slide tints' placeholder (`#221F1C` × 7, `#2A2622` × 1, deferred from § 22.1) with the patch's eight hand-tuned hues, resolving the color-story plan's own flagged-but-unconfirmed design question — decided in conversation (see below)
- [x] Investigated "cards read as cards in dark mode" with real contrast numbers rather than eyeballing it: **every** candidate dark slide-tint design (current placeholder, the patch's 8 hues, a hypothetical single shared tint) gives near-identical ~1.0–1.2:1 contrast against `TaskCard`'s actual background (`--color-bg-page`, not `--color-bg-surface` as this doc's § 3.7 assumes — that assumption doesn't match the current `TaskCard` implementation). The hairline border was equally weak (~1.14–1.17:1 against the patch's 8 hues) — including in the *untinted* baseline case (1.31:1 against plain `--color-bg-page`), so this isn't a tint-specific problem. Fixed by strengthening `--tendril-d-hairline` from `#332E29` to `#786E5D` (empirically verified ≥3:1 against canvas, surface, and all eight dark slide tints) — a general dark-mode `--color-border` fix, not scoped to tinted-carousel cards, since the existing value was already too weak everywhere in dark mode
- [x] Also reduced the active-dot `onSlideChange` debounce from 100ms to 40ms (`Carousel.tsx`'s `handleScroll`) after review flagged it as laggy — improved but not fully resolved; tracked as § 10.3 rather than pursued further now
- [x] Review in Storybook — **approved**

---

### 22.8 Add the new primitives to the task list (`new-primitives-tasks`)

`documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 4 carries token blocks and target values only. Before any of it is built, each primitive needs its own TASKS.md entry — otherwise the specs sit in a document with nothing scheduling them.

- [x] Wrote a TASKS.md entry per primitive (§ 24.1–24.10, in order: `Button`, `TextInput`, `Card`, then `Radio`, `Switch`, `Chip`, `ListRow`, `SplitGroup`, `InlineMessage`, `Sheet`/`Modal`)
- [x] Each entry gets the § 4 token block (or, for the seven table-only ones, the § 4.4 row plus a note to expand it into a full block as part of that task — not up front), a props note, a pointer at the shared § 5 checklist (stated once rather than repeated ten times), and a Storybook-states bullet
- [x] Each entry depends on § 22.1 — noted as already satisfied, since § 22.1 completed earlier in this same session
- [x] Sequenced `Button` (§ 24.1) first; § 24.2–24.10 each explicitly depend on it being reviewed and approved first
- [x] Table-only components (§ 24.4–24.10) note to expand their § 4.4 row into a full token block as part of their own task, not up front

---

### 22.9 Delete `priori-patch/` (`tendril-patch-cleanup`)

**Depends on:** every task in this section and every component in `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 9 being complete — `priori-patch/` is a reference for diffs until then.

- [x] Confirm no remaining checklist item points at `priori-patch/`
- [x] Delete the `priori-patch/` directory
- [x] Review in Storybook — **approved**

---

## 29. Delete action in the tasks list (`task-list-delete`)

Adds delete for the plain task-browsing list (`TasksPage` → `TaskTreeItem`),
reusing the `DELETE /api/tasks/:id` endpoint and `ConfirmDialog`
children-choice flow already built in §12 for the in-progress block. Full
design in `documentation/techDesign/task-list-delete/design.md`.
(Since renamed to `documentation/techDesign/task-list-delete/lld.md`.)

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

## 45. Filter/params slide redesign (`params-slide-redesign`)

Real design supplied: `documentation/Landing page design.png` (the carousel's first slide — the location/time/energy filter form, rendered today by `ParamsForm`/`RankingPage`). Reviewed against the current implementation; several gaps found, some already decided and landed, others still open.

**Decisions made in conversation:**
- The mock's "Anywhere" runtime location is **not** a union of Home + In-person — confirmed via `packages/engine/test/ranker.test.ts`'s existing `"filters tasks by location: anywhere shows only anywhere tasks"` test: it's a deliberate exclusive category (only location-agnostic tasks), not "no constraint." Kept as-is — not an engine change.
- That label was misleading given the actual behavior (a user picking "Anywhere" would reasonably expect to see every task, not a narrower subset). Renamed `"Anywhere"` → `"Flexible"` in `LOCATION_LABELS` (`LocationIcon.tsx`) instead of changing the filtering semantics. This is the shared component's label, so it also renames the option in `TaskCreationForm`'s task-location tagging — reads fine there too ("this task is flexible about location").
- `LocationPicker` dropped its deselect-to-`undefined` behavior; `ParamsForm`'s `location` default changed from `undefined` (no filter, every task shown) to `"home"` (a real filtered default) — an intentional behavior change, not just cosmetic, made so `LocationPicker` could move onto `SplitGroup` (a plain radio group, always one value active) like the other two pickers.
- **Divergence from the mock, decided in conversation:** the mock's pills render individually separated with a gap between each; `SplitGroup`'s existing joined-segment treatment (chosen in § 24.8) was kept as-is rather than chased pixel-for-pixel, since unifying all three pickers onto the existing primitive was prioritized over new visual fidelity to the artboard.

- [x] Converted `LocationPicker` from `Chip` (separate pills, horizontal icon+label) onto `SplitGroup` (the primitive `EnergyPicker`/`DurationPicker` already use) for one consistent look across all three groups
- [x] `LOCATION_LABELS.anywhere` renamed "Anywhere" → "Flexible" (`LocationIcon.tsx`)
- [x] `ParamsForm`'s `location` default changed `undefined` → `"home"`; `RankParams.location` type drops `| undefined`
- [x] `rankingService.ts` — `location` is now always sent in the rank request body (previously omitted when `undefined`); updated `rankingService.test.ts` accordingly
- [x] `TaskCreationForm.tsx` — simplified `onChange={(val) => setLocation(val ?? "anywhere")}` to `onChange={setLocation}` now that `LocationPicker` never emits `undefined`
- [x] Added a heading above the params card: `getGreeting(now)` (`ParamsForm/getGreeting.ts`, new small pure utility, 3 buckets — morning <12, afternoon <17, evening after — with its own test) + the static subtitle "Set what fits right now, then swipe."
- [x] Wrapped the three pickers in the existing `Card` primitive (used purely for its chrome — no `title`/`kicker`/`meta` — exactly the "wrapping a different component that renders its own title" case its own prop comment already documents) rather than a bespoke card class, so the surface/border/radius/shadow stay centrally themed through `--card-*` instead of a second hardcoded copy
- [x] Added section captions ("Location" / "Available Time" / "Energy", `text-transform: uppercase` in CSS rather than literal caps text) styled `--font-size-micro`/`--color-primary`/600 weight/`0.06em` letter-spacing in `ParamsForm.module.css` — mirrors the pattern already established by `Card`'s own `.kicker` (`--card-kicker-fg` already resolves to `--color-primary`), but kept as ParamsForm's own local style rather than reusing `Card`'s Layer-3 tokens directly (rule 6: never reference another component's Layer-3 token). `LocationPicker`/`DurationPicker`/`EnergyPicker` are called from `ParamsForm` without a `label` prop so their own internal (differently-styled) label doesn't render a duplicate underneath this caption — each falls back to its own hardcoded `aria-label` default, so nothing is lost for accessibility. Plain `.divider` line (`--color-border`) between each section
- [x] `DurationPicker` pills now go two-line: repurposed `SplitGroup`'s existing `icon` slot (previously used for `EnergyPicker`'s per-level icon) to hold a bold number span, with `"min"` as the (now-shared, no-longer-per-option) label — no `SplitGroup` changes needed, since the slot already renders above the label for any `ReactNode`
- [x] Review in Storybook — `Features/Ranking/ParamsForm`, `Features/Ranking/LocationPicker`, `Features/Tasks/DurationPicker` — **approved**

---

## 46. `ParamsBar` — carry filter choices across result pages (`params-bar`)

Real design: `documentation/Selected filter component design.png` (frame 11c, "Three equal parts, editable in a sheet"). Once the user swipes past the filter page, the chosen Location/Time/Energy need to stay visible on every results page — not repeated per slide's own markup, and not lost.

**Decisions made in conversation:**
- Named `ParamsBar` (ties to the existing `RankParams`/`ParamsForm` vocabulary already in this codebase), not `FilterSelectionSummary`.
- Renders once, as a `RankingPage`-local sibling of `<Carousel>` — not per-slide, and not a new general "app-level top bar slot" mechanism. `ParamsBar`'s content is identical across every slide (only `context` differs per slide, which `ParamsBar` doesn't show), so one persistent instance toggled by `activeIndex > 0` fully covers "visible on every page except the first" without new architecture. `NavBar` itself isn't built as a slot system either — revisit only if a second real use case for per-route top-bar content shows up.
- ~~Accepted trade-off: swiping from the params page to the first results page changes the carousel's available height by `ParamsBar`'s height (it appears above results for the first time). Not reserving invisible space on the params page to avoid this — a one-time step at first swipe, not scroll-time jank.~~ Superseded: the jump was visible enough in practice to fix. `ParamsBar` is now always mounted (a `visible` prop toggles `visibility: hidden` instead of unmounting), so its height is reserved from the very first render and the carousel's available height never changes across slides. Traded a slightly shorter params slide (its whole life, not just after first swipe) for zero layout jump.
- `RankingPage` tracks the carousel's visible slide two ways: `activeIndex` (settled, drives data fetching) and `visibleIndex` (live, mirrors `Carousel`'s own dot indicator via a new `onVisibleIndexChange` callback) — added because gating `ParamsBar` on the settled index made it visibly lag behind `ResultsSlide`'s skeleton, which already renders in both `idle` and `loading` states and so appears the instant the slide scrolls into view, well before the swipe settles.
- Picking a new value from a `ParamsBar` sheet and landing back on the same results slide never actually reloaded it: `handleParamsChange` reset every slide to `idle` (which also renders the skeleton), but only `handleSlideChange`'s on-arrival check ever called `loadSlide` again. That was fine for `ParamsForm` (still on the params slide - no results slide has loaded yet, the swipe that follows triggers it) but never fires for `ParamsBar` (already on a results slide; no swipe happens). Fixed by extracting `refreshAfterMutation`'s existing "reset to idle, then reload the current slide" logic into a shared `resetSlidesAndReload`, used by both.
- The active/tapped column's tint stopped short of `.bar`'s own outer horizontal padding, leaving an unpainted sliver at the far left/right edges. Fixed with the same negative-margin-plus-matching-padding bleed already used to extend the tap target into the bar's vertical padding, applied horizontally to the first/last column only.
- Added a fade transition (`--motion-medium`/`--motion-ease`, the same tokens `Sheet` already uses for its own animations) for the `visible`/hidden toggle: opacity animates both ways, but `visibility` only switches to `hidden` once the fade-out finishes (staying in the accessibility tree for the transition), while becoming visible flips `visibility` back instantly as opacity fades in.
- Color choice: the mock's own "LOCATION"/"TIME"/"ENERGY" captions read as a muted secondary tone, distinct from the vivid `--color-primary` captions elsewhere in the same mock (the context group headings, the bottom sheet's own caption) and from `ParamsForm`'s own section captions (§45, deliberately `--color-primary`). Per the `CLAUDE.md` "Resolving a supplied design mock against existing tokens" guidance (added this session), didn't trust the exact shade read off a screenshot: matched `ParamsBar`'s captions to the already-established muted-label pattern (`--color-text-body`, the same color `LocationPicker`/`EnergyPicker`/`DurationPicker` already use for their own labels) instead.
- MVP is display-only, per explicit scope: no tap/`onClick`, no `Sheet` integration yet. Phases 2 and 3 below are separate, later tasks — deliberately not built now. `RankingPage.tsx`'s `handleParamsChange`/`loadSlide` state machine (skeleton while re-ranking, then new results) already exists and needs no new infrastructure for Phase 3 — it's an integration once Phase 2 exists, not a build.

**MVP:**
- [x] Build `ParamsBar` (`src/features/ranking/ParamsBar/`) — read-only, three equal-width columns (Location icon+value, Time value only, Energy icon+value), muted caption above each value, reusing `LocationIcon`/`EnergyIcon` for the icons
- [x] Wire into `RankingPage.tsx` as a sibling of `<Carousel>`, visible when `activeIndex > 0`; give `RankingPage.module.css` a wrapper around `<Carousel>` (`flex: 1; min-height: 0`) so it absorbs the remaining space rather than changing the shared `Carousel` primitive's own sizing contract
- [x] Stories: Default (home/30/medium), plus one variant per field showing a different value
- [x] Review in Storybook — **approved**

**Follow-up:**
- [x] Phase 2 — tapping a column opens a `Sheet` holding just that group's picker (reusing `LocationPicker`/`DurationPicker`/`EnergyPicker` without a `label`, matching how `Select`'s mobile presentation already composes `Sheet` in § 24.13); no title, no confirm button — picking a value applies it and closes the sheet, per the mock. The tapped column shows a tinted/"washed" background while its sheet is open.
- [x] Phase 3 — wire the sheet's `onChange` into the same params-change path `ParamsForm` already feeds (`RankingPage.handleParamsChange`), so picking a new value resets slides to `idle` and re-fetches exactly like today
- [x] Reviewed in the app and Storybook — **approved**

---

## Resolved open issues

Type: feature

Unnumbered. Items from the Open Issues list at the end of `TASKS-FEATURES.md`, moved here once resolved.

- ~~**ResultsSlide idle/loading text**~~ — replaced "Swipe here to load results" and "Loading…" text with a shimmer skeleton of 3 placeholder task cards for both `idle` and `loading` states. ✓
