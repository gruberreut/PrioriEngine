# Tasks

Implementation tasks for the engine ↔ browser architecture.
Based on: `~/.cursor/plans/engine–frontend_architecture_a972788d.plan.md`

---

## 1. Programmatic API (`programmatic-api`)

Add a structured result path from the engine so the API layer gets typed objects, not CLI strings.

- [ ] Add `rankFromPayload(tasks: RawTask[], params: RuntimeParams): RankResult` to `packages/engine/src/runCli.ts` (or a new `packages/engine/src/api.ts`) — reuses `normalizeTasks` + `rankTasks` directly, skips `formatRankOutput`
- [ ] Add a barrel export `packages/engine/src/index.ts` that re-exports `rankFromPayload`, `RawTask`, `RuntimeParams`, `RankResult`, and related types — this becomes the library surface for `apps/api`
- [ ] Add tests for `rankFromPayload` in `packages/engine/test/` using existing fixtures

---

## 2. Task Source (`task-source`)

Introduce a `TaskSource` abstraction in `apps/api` so storage is decoupled from the ranker.

- [ ] Create `apps/api/` directory with `package.json` (depends on `@priori/engine` via workspace)
- [ ] Define `TaskSource` interface: `getTasks(): Promise<RawTask[]>`
- [ ] Implement `FileTaskSource`: reads a JSON file path from an env var (`PRIORI_TASKS_PATH`), falls back to the engine's sample file
- [ ] Wire `FileTaskSource` into a service layer that calls `rankFromPayload`

---

## 3. HTTP Layer (`http-layer`)

Small Node server exposing stable REST endpoints; Vite proxies to it in dev.

- [ ] Choose and install HTTP framework in `apps/api` (Hono or Fastify recommended — small, typed, fast)
- [ ] `GET /api/tasks` — returns raw task list from the active `TaskSource`
- [ ] `POST /api/rank` — accepts `{ params: RuntimeParams }`, calls `rankFromPayload` with tasks from `TaskSource`, returns `RankResult` JSON
- [ ] `GET /api/contexts` — returns distinct context labels from the active task list (so the UI doesn't hardcode them)
- [ ] Add a shared `apps/api/src/dto.ts` with request/response types the React app can import or copy
- [ ] Add `npm run dev` script to `apps/api` (e.g. `tsx watch src/index.ts`)
- [ ] Verify with `curl` against the sample task file before wiring up the frontend

---

## 4. React SPA (`react-spa`)

Vite + React app; speaks to the API only — no direct engine imports.

- [ ] Scaffold `apps/web` with `npm create vite@latest` (React + TypeScript template)
- [ ] Configure Vite dev proxy: `/api` → `http://localhost:3000`
- [ ] Copy or import `dto.ts` types from `apps/api` (or create `packages/types` if duplication becomes painful)
- [ ] **Available time selector** — dropdown: 10 / 15 / 30 / 60 min
- [ ] **Energy selector** — dropdown: low / medium / high
- [ ] **Context selector** — dropdown populated from `GET /api/contexts`; first option is "All" (no filter)
- [ ] **Explain toggle** — checkbox that adds `explain: true` to the rank request
- [ ] **Rank button** — calls `POST /api/rank`, displays top 3 results
- [ ] **Results list** — task title; when explain is on, show score breakdown below each task
- [ ] **In-progress block** — if `RankResult.mode === "in_progress_block"`, show the active task and action prompt instead of recommendations
- [ ] Add root-level `npm run dev:api` and `npm run dev:web` scripts (and optionally `dev:all` with `concurrently`)

---

## 5. Components

One component at a time. Each must be reviewed in local Storybook before the next begins.
Reference: `documentation/TESTING_PAGE_COMPONENTS.md`, `guidelines/COMPONENT_BEST_PRACTICES.md`

**Setup (do once before first component):**
- [ ] Install Storybook in `apps/web`: `@storybook/react-vite`
- [ ] Create `apps/web/test/storyFixtures.ts` with fixture data derived from `packages/engine/test/data/tasks.example.json`

---

### 5.1 `Select` ← start here

Base dropdown primitive. All dropdown styling lives here.

- [ ] Implement `Select` component with props: `options`, `value`, `onChange`, `label`, `disabled`
- [ ] Write stories: Default, Disabled, Single option, Long labels
- [ ] Review in Storybook — **approve before proceeding**

---

### 5.2 `ContextSelect`

Wraps `Select`. Prepends an "All" option; maps `undefined` to no context filter.

- [ ] Implement `ContextSelect`
- [ ] Write stories: With contexts, Empty list (All only)
- [ ] Review in Storybook — **approve before proceeding**

---

### 5.3 `AvailableTimeSelect`

Wraps `Select`. Fixed options: 10, 15, 30, 60 min.

- [ ] Implement `AvailableTimeSelect`
- [ ] Write stories: Each option selected
- [ ] Review in Storybook — **approve before proceeding**

---

### 5.4 `EnergySelect`

Wraps `Select`. Fixed options: low, medium, high.

- [ ] Implement `EnergySelect`
- [ ] Write stories: Low, Medium, High selected
- [ ] Review in Storybook — **approve before proceeding**

---

### 5.5 `ExplainToggle`

Toggle switch for score breakdown visibility.

- [ ] Implement `ExplainToggle`
- [ ] Write stories: Off, On
- [ ] Review in Storybook — **approve before proceeding**

---

### 5.6 `ParamsForm`

Composes the four controls above. Renders a submit button internally. Emits `onSubmit` with typed `RankParams`.

- [ ] Implement `ParamsForm`
- [ ] Write stories: Default (idle), Loading, No contexts
- [ ] Review in Storybook — **approve before proceeding**

---

### 5.7 `ScoreBreakdown`

Score detail panel rendered inside a task card when explain is on.

- [ ] Implement `ScoreBreakdown`
- [ ] Write stories: All positive, With penalties, Zero flow bonus
- [ ] Review in Storybook — **approve before proceeding**

---

### 5.8 `TaskCard`

Single ranked task. Conditionally renders `ScoreBreakdown`.

- [ ] Implement `TaskCard`
- [ ] Write stories: Explain off, Explain on, Long title
- [ ] Review in Storybook — **approve before proceeding**

---

### 5.9 `InProgressBlock`

Shown when the engine returns `in_progress_block` mode.

- [ ] Implement `InProgressBlock`
- [ ] Write story: Default (task title + action list)
- [ ] Review in Storybook — **approve before proceeding**

---

### 5.10 `EmptyState`

Shown when ranking returns zero results.

- [ ] Implement `EmptyState`
- [ ] Write stories: With context, Without context
- [ ] Review in Storybook — **approve before proceeding**

---

### 5.11 `ResultsPanel`

Composes `TaskCard`, `InProgressBlock`, and `EmptyState`. Switches between states based on `RankResult`.

- [ ] Implement `ResultsPanel`
- [ ] Write stories: No result, Three cards (explain off), Three cards (explain on), In-progress block, Empty state
- [ ] Review in Storybook — **approve before proceeding**
