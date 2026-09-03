# Tasks

Implementation tasks for the engine ↔ web integration.

**Priority order:** at this point in development, work through sections in order: known bugs (10), then the OpenAPI documentation migration (11), then new feature work (12 onward).

Fully-completed top-level sections are moved to `TASKS-DONE.md` (see `CLAUDE.md` § Task Tracking), leaving a one-line stub in their place. A missing section number here means it's archived there, not deleted.

---

## 1. Engine API surface — completed, see TASKS-DONE.md

---

## 2. API server — completed, see TASKS-DONE.md

---

## 3. Web integration — completed, see TASKS-DONE.md

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

## 5. Location & Context Refactor — completed, see TASKS-DONE.md

---

## 6. Task Browser — completed, see TASKS-DONE.md

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

## 8. Task CRUD API — completed, see TASKS-DONE.md

---

## 9. Task entry UI — completed, see TASKS-DONE.md

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

- [ ] Investigate a fix that doesn't rely on a fixed post-scroll debounce — e.g. computing the nearest slide index continuously during scroll (`requestAnimationFrame` or the scroll event itself) so the dot tracks live rather than catching up after the fact
- [ ] Re-check whether any further debounce reduction below 40ms is safe (risk: `onSlideChange` firing mid-scroll, which the debounce exists to prevent) before or alongside the above

---

### 10.4 `PriorityPicker` overflows horizontally on small mobile widths

Surfaced during § 24.2's Storybook/app review.

`PriorityPicker.module.css`'s `.group` lays out all five options (Urgent/Soon/Medium/Later/Ongoing) as a single-row segmented control (`.button { flex: 1; }` with fixed `padding: var(--space-2) var(--space-3)`), with no wrapping or min-width handling. At small mobile widths (e.g. 360pt) the five labels plus padding don't fit, and the row overflows rather than shrinking or wrapping.

- [x] Investigate a fix — candidates: smaller padding/font at narrow widths, wrapping onto two rows, or a horizontally scrollable row — and check whether `DurationPicker`/`EnergyPicker`/`LocationPicker` (same segmented-row pattern) have the same problem. Resolved: overflow lives in the shared `SplitGroup` primitive (covers `PriorityPicker`/`DurationPicker`/`EnergyPicker`), not per-picker CSS. `SplitGroup` now shows a vertical `Radio` list (mobile-first base, `Radio` gained an `icon` slot) with the pill row layered on via `@media (width >= 320px)` — breakpoint set by explicit user choice, below the ~480px point the 5-option row actually starts overflowing, so the fallback is a deliberate rare/edge-case path for now (see `ARCHITECTURE.md`). `LocationPicker`'s separate `Chip`-based row got a defensive `flex-wrap: wrap` only.

---

## 11. API Documentation Migration to OpenAPI — completed, see TASKS-DONE.md

---

## 12. Task Actions — completed, see TASKS-DONE.md

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

When a user creates a new context, assign it a stable `slide_index` so it always renders with the same background in the ranking carousel. Currently, slide colors are assigned by index into a fixed palette — this works but means colors shift if contexts are reordered or deleted.

The DB stores an index, not a color value. The frontend maps that index onto the existing `--color-slide-{n}` design tokens (`apps/web/src/styles/tokens.css`), which are already light/dark-aware — see `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 8.7. This keeps one color system instead of two.

### Tasks

- [ ] Add a `slide_index` (integer) column to the `contexts` table; generate a migration
- [ ] On context creation (`POST /api/contexts`), auto-assign the next unused index, cycling through the available `--color-slide-*` slots and avoiding duplicates where possible
- [ ] Return `slide_index` in `GET /api/contexts` responses
- [ ] Update the web frontend to key `--color-slide-{n}` off the context's `slide_index` instead of raw carousel-page position
- [ ] Handle the edge case where more contexts exist than palette entries (cycle the indices)

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

## 17. Bottom navigation bar — completed, see TASKS-DONE.md

---

## 18. App design review (`design-review`)

A broader visual/UX pass across the app. Not scoped yet — needs a walkthrough of current screens to produce a concrete list of issues before any implementation begins.

- [ ] Walk through all screens (Rank, Tasks, Task Detail, Task Creation) and note visual/UX inconsistencies
- [ ] Produce a prioritized list of design improvements
- [ ] Scope out and implement approved improvements as follow-up tasks

---

## 19. Loading sequence / loading page (`app-loading-gate`)

Currently the app renders straight into its routes on mount — there's no single point where cross-cutting startup concerns (auth, authorization, blocking-state checks) can run before the rest of the app appears. Build a generic bootstrap mechanism for that, independent of what the individual steps end up being (those are separate tasks — see 20).

- [x] Create a `LoadingPage` / bootstrap gate component that runs on app mount, wraps the router, and renders before any route
- [ ] Design the gate as an ordered sequence of async steps; each step can pass through, redirect, or block until resolved
- [ ] Add a placeholder authentication step (no-op today; ties into section 7's deferred "User provisioning" design work), just to give the sequence the right shape for when auth exists
- [ ] Add a placeholder authorization step (no-op today), same reasoning
- [x] Show a loading state while steps are in flight
- [x] Update `ARCHITECTURE.md` documenting the gate as the app's bootstrap sequence
- [ ] Replace `LoadingScreen`'s placeholder visual design (enlarged `Tendril` icon + wordmark on a plain background) with a considered design once the app's visual language for this screen is decided

---

## 20. In-progress-task check as an early gate step (`in-progress-check`)

**Depends on:** section 19 (the loading gate must exist to add a step to it), section 21 (needs the dedicated route to redirect to).

Today, whether an in-progress task exists is discovered lazily and per-slide: `RankingPage` finds out only when a given carousel slide's `rank` call returns `in_progress_block`, so on refresh the user briefly sees the full ranking carousel, and then every slide (except the params slide) independently renders the same in-progress task. Replace this with a single check that runs once as a step in the loading gate (section 19), before any route renders.

- [x] Add an in-progress-task check step to the loading gate: fetch tasks; if one has `status: "in_progress"`, redirect to the dedicated in-progress route (section 21)
- [ ] Keep the user on that route — block navigation to other routes — until they resolve it via Complete / Snooze / Delete
- [ ] Update `ARCHITECTURE.md` — record this step as the canonical place in-progress blocking is enforced, superseding the current per-slide discovery in `ResultsPanel`/`RankingPage` (not yet true — the gate only runs on initial mount, so the per-slide check still catches a task started mid-session without a reload; revisit once that's unified too)

---

## 21. Dedicated in-progress task route — completed, see TASKS-DONE.md

---

## 22. Tendril design token rollout (`tendril-design-rollout`)

Moved from `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 8 ("Tasks — what the patch could not carry"). That document's §§ 1–7 define the three-layer token model and the per-component diffs (§3 existing components, §4 new primitives, §5 the per-component checklist, §6 Storybook additions, §7 the CLAUDE.md block); its § 9 gives the suggested build order across this section and those component-by-component tasks. Original subsection numbers (8.1–8.9) are kept below as 22.1–22.9 for traceability back to that doc's own cross-references.

`priori-patch/` contains complete file replacements for §§ 22.1–22.2. Everything else here needs a call site the patch couldn't see, a decision, or a file outside `apps/web/src`.

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

- [ ] Confirm no remaining checklist item points at `priori-patch/`
- [ ] Delete the `priori-patch/` directory
- [ ] Review in Storybook — **approved**

---

## 23. Theme settings screen (`theme-settings-screen`) — deferred, low priority

Since § 22.4, theme has no manual UI: `auto` picks light/dark by time of day (`timeOfDayTheme()` in `useTheme.ts`), and the only override is `window.switchTheme('light' | 'dark' | 'auto')` from the browser console. Build a real settings screen so a user can set this without the console.

- [ ] Add a `/settings` route and page
- [ ] `ThemeToggle` no longer exists — deleted in § 24.8 once it was confirmed to have zero real callers (it had briefly become just an unused wrapper around `SplitGroup`). Build the control fresh here instead of reviving it, and decide first: the tinted-track-with-inset-pill construction in `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 3.3 (never actually built — that's what a theme toggle was originally spec'd to look like, distinct from `SplitGroup`'s joined-seam shape) vs. just using `SplitGroup` directly for simplicity. Either way, wire it to `useTheme`'s `setTheme`
- [ ] Add a way to reach `/settings` from the app — `NavBar` has no slot for it currently; decide whether it gets one or the entry point is elsewhere
- [ ] Reconsider `timeOfDayTheme()`'s fixed 6am–6pm split at the same time — e.g. treat `Auto` as "time-of-day split" only when the user hasn't explicitly picked Light/Dark, or consider deriving real sunrise/sunset if that's ever worth the complexity

**Trigger:** whenever a settings screen is needed for anything else, or the `window.switchTheme()` console workaround becomes annoying enough to fix.

---

## 24. New Tendril primitives (`tendril-primitives`)

Scheduled by § 22.8 — `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 4 carries the token blocks and target values only; these subsections are what actually schedules building them. **These are specifications, not implementations** — nothing below has a component file, a story, or a call site yet.

**Depends on:** § 22.1 — satisfied (`--control-height-*`, `--radius-*`, `--focus-ring*`, `--motion-*` all landed in `tokens.css`).

**Build order:** `Button` (§ 24.1) first, held for review before any of the other nine start — it settles the Layer-3 conventions the rest repeat. § 24.4–24.10 (the seven table-only components) additionally expand their `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 4.4 row into a full token block as part of their own task, not up front.

**Fixed during § 24.1/24.2 work, cross-cutting:** the user supplied the real design file (`documentation/Tendril components design.png`, dark theme) and flagged that the app/Storybook background had been set to `--color-bg-surface` — the artboard shows the opposite pairing: `--color-bg-page` (canvas) is the page everything sits on, `--color-bg-surface` is for things that lift off it (cards, inputs, menus, chips). Fixed the root in both places (`apps/web/src/index.css`'s `:root`, `.storybook/preview.ts`'s body background) to `--color-bg-page`. That surfaced the same pre-existing mistake in nine component files that were using `--color-bg-page` for their *own* elevated fill instead of `--color-bg-surface` (previously invisible because the page itself was wrongly the surface color, which accidentally gave some contrast) — fixed all of them: `TaskCard.module.css` (`.outlined`, `.dense`), `Select.module.css`, `LocationPicker.module.css`, `EnergyPicker.module.css`, `TaskCreationForm.module.css` (title input, new-context input), `TaskCreationPage.module.css`, `TaskTreeItem.module.css`, `DurationPicker.module.css`, `PriorityPicker.module.css` (pill button, date input), `ThemeToggle.module.css`. These are all still pre-migration components referencing Layer 2 directly — no Layer-3 groups were added here, that happens when each one gets its own § 24.x task.

**Per-component checklist** (from `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 5 — apply to every subsection below rather than repeating it ten times):
```
- [ ] Layer-3 block added to tokens.css under a `/* <Component> — components/<Component> */` header
- [ ] Every entry defaults to a Layer-2 role; each literal has a comment saying why
- [ ] No new dark-mode override for a component token
- [ ] Module CSS references ONLY --<component>-* (layer3.test.ts, added in § 22.6, checks this automatically once the group comment lands)
- [ ] No literal hex, px radius, or px height left in the module CSS
- [ ] :focus-visible styled; browser default suppressed
- [ ] Anything tappable is ≥44px (or the group containing it is)
- [ ] Hover and active states present for interactive elements
- [ ] Transitions use --motion-fast/--motion-ease, not ad-hoc timings
- [ ] Verified in light and dark, at 360pt width
- [ ] Body text ≥4.5:1 on its own background in both modes
- [ ] Stories cover every visual state, including disabled and error
- [ ] Docs page gets a `<ComponentTokens prefix="--<component>-" />` block (component built in § 22.6) — also confirms layer3.test.ts's directory-match assertion passes
```

---

### 24.1 Button (`primitive-button`)

The most-needed missing primitive. Variants: `primary`, `secondary`, `ghost`, `destructive`. Sizes: `sm` 36, `md` 46, `icon` 44 square. Props: `variant`, `size`, `block`, `disabled`, `loading`.

```css
  /* Button — components/Button */
  --button-height:            var(--control-height-lg);
  --button-height-sm:         var(--control-height-sm);
  --button-radius:            var(--radius-md);
  --button-radius-sm:         var(--radius-sm);
  --button-pad-x:             var(--space-5);
  --button-pad-x-sm:          var(--space-3);
  --button-size:              var(--font-size-body);
  --button-weight:            500;

  --button-primary-bg:        var(--color-primary);
  --button-primary-bg-hover:  var(--color-primary-hover);
  --button-primary-bg-active: var(--color-primary-active);
  --button-primary-fg:        var(--color-text-on-primary);

  --button-secondary-border:  var(--color-border-input);
  --button-secondary-fg:      var(--color-text-body);
  --button-secondary-bg-hover: var(--color-primary-tint);

  --button-ghost-fg:          var(--color-primary);
  --button-ghost-bg-hover:    var(--color-primary-tint);

  --button-danger-border:     var(--color-error);
  --button-danger-fg:         var(--color-error);

  --button-bg-disabled:       var(--color-bg-disabled);
  --button-fg-disabled:       var(--color-text-disabled);

  --button-icon-size:         var(--control-height-md);
  --button-icon-radius:       var(--radius-md);
```

Primary is a **fill**, not an outline — this app is Tendril throughout, the two systems (Tendril fills, Nocturne outlines) are never mixed. Focus: `box-shadow: var(--focus-ring-offset)` on filled variants, `var(--focus-ring)` on outlined ones.

- [x] Build `components/Button` per the checklist above
- [x] Stories: all four variants × both sizes, plus `block`, `disabled`, `loading`, and the icon-only 44px square variant
- [x] Review in Storybook — **approved**
- [x] Integrate at existing call sites: `EmptyState.tsx`'s "← Back to parameters" button (now `ghost`/`sm`, wrapped in a centered `.backButtonWrapper` since Button doesn't take a `className`); `TaskCreationForm.tsx`'s Add/Cancel (inline context creation, `sm`), Cancel/Save task (form actions — Save now uses `Button`'s own `loading` spinner instead of swapping to "Saving…" text), removing the now-dead `.addButton`/`.cancelContextButton`/`.cancelButton`/`.submitButton` CSS
- [x] Extended `Button` with optional `type` (`"button" | "submit"`, default `"button"`) and made `onClick` optional — needed for `TaskCreationForm`'s submit button, which relies on the enclosing `<form onSubmit>` rather than a click handler
- [ ] **Decided (not integrated):** `TaskCard.tsx`'s complete/snooze/delete/start icon actions keep their existing bespoke markup/inline-color styling rather than moving to `Button` — the per-action pastel tints (`InProgressBlock.tsx`) don't fit the four fixed variants, and forcing them through `Button` now would mean picking colors without a real design pass. Revisit as its own task if/when TaskCard's action styling is redesigned.

---

### 24.2 TextInput / Textarea (`primitive-text-input`)

**Depends on:** § 24.1 (`Button`) reviewed and approved first.

The label/control/help triplet is one component with `label`, `help`, and `error` props — not three separate components. Error state changes the border and the help color; it does not change the background. Textarea shares the same token block; `--input-pad-y`/`--input-min-height` are textarea-only.

```css
  /* TextInput — components/TextInput */
  --input-height:          var(--control-height-xl);
  --input-radius:          var(--radius-md);
  --input-pad-x:           var(--space-4);
  --input-pad-y:           var(--space-3);      /* textarea only */
  --input-min-height:      92px;                /* textarea only — tall enough
                                                    for a few lines before the
                                                    field scrolls; not tied to
                                                    any existing role */
  --input-bg:              var(--color-bg-surface);
  --input-border:          var(--color-border-input);
  --input-border-focus:    var(--color-primary);
  --input-border-error:    var(--color-error);
  --input-fg:              var(--color-text-strong);
  --input-fg-placeholder:  var(--color-text-disabled);
  --input-bg-disabled:     var(--color-bg-disabled);
  --input-size:            var(--font-size-body);
  --input-label-size:      var(--font-size-micro);
  --input-label-fg:        var(--color-text-body);
  --input-help-size:       var(--font-size-micro);
  --input-help-fg:         var(--color-text-muted);
  --input-help-fg-error:   var(--color-error);
```

- [x] Build `components/TextInput` per the checklist above, sharing markup/tokens between the single-line and textarea variants — one internal `FieldChrome` renders the label/control/help triplet for both `TextInput` and `Textarea` via a render-prop, so the a11y wiring (`id`, `aria-describedby`, `aria-invalid`) isn't duplicated
- [x] Props: `label`, `help`, `error`, `hideLabel` (visually hides the label via the app's existing global `.sr-only`, needed for `TaskCreationForm`'s title field which has no visible label today), plus the standard controlled-input set (`value`, `onChange`, `placeholder`, `disabled`, `type` for TextInput vs. `rows` for Textarea) — no artboard was available to check exact naming against, so these are a best-effort match to the task's own stated set; open to renaming on review
- [x] Stories: default, focused (autofocus via a small ref-based wrapper, no interaction-test addon in use elsewhere in this repo), disabled, help, error (with `help` replaced by the error message), and the textarea variant at its `--input-min-height` floor
- [x] User supplied the real artboard (`documentation/Tendril text input design.png`) after the component was built from the § 4 spec snippet alone. Checked against it and fixed two real mismatches: `--input-label-size` was `--font-size-micro` (11px) but the artboard's field labels render bold and body-sized — `--font-size-micro` is correct for `--input-help-size` (the small gray annotation captions) instead, not the label; `--input-label-fg` was `--color-text-body` but the artboard's labels read as strong/dark ink, not muted. Also added `--input-fg-disabled` (`--color-text-disabled`) — the disabled example's value text is visibly faded, which nothing in the original spec snippet accounted for (only the background was specified as changing). Background, border, focus ring (3px tint ring + accent border), error styling, placeholder color, and textarea's 12px padding all matched the artboard as originally built.
- [x] Review in Storybook — **approved**
- [x] Integrate at existing call sites: `TaskCreationForm.tsx`'s task-title input (its `titleError` boolean now maps to `error="Title is required"`) and its inline "new context name" input (kept its Enter/Escape `onKeyDown` and `autoFocus`); `PriorityPicker.tsx`'s `<input type="date">`. Removing the raw markup left `.titleInput`/`.inputError`/`.errorText`/`.newContextInput` (TaskCreationForm) and `.dateInput` (PriorityPicker) dead — deleted.
- [x] Extended `TextInput` with `autoFocus` and `onKeyDown` (both pass straight through to the underlying `<input>`) — needed by the two `TaskCreationForm` call sites (autofocus on mount; Enter submits the new context, Escape cancels it), neither anticipated when the component was built in isolation

---

### 24.3 Card (`primitive-card`)

**Depends on:** § 24.1 (`Button`) reviewed and approved first.

```css
  /* Card — components/Card */
  --card-bg:             var(--color-bg-surface);
  --card-radius:         var(--radius-lg);
  --card-pad:            var(--space-5);
  --card-border:         var(--color-border);
  --card-border-active:  var(--color-primary);
  --card-shadow:         var(--shadow-sm);
  --card-shadow-active:  none;            /* the active card is marked by its
                                             border, not by lifting off the page */
  --card-title-size:     var(--font-size-label);  /* 16px — reuses the existing
                                                      role instead of repeating
                                                      its value as a literal */
  --card-title-fg:       var(--color-text-strong);
  --card-meta-size:      var(--font-size-meta);
  --card-meta-fg:        var(--color-text-muted);
  --card-kicker-size:    9.5px;   /* smaller than every existing --font-size-*
                                     role; the kicker sits above the title as
                                     a label on a label, and nothing else in
                                     the set needs this size */
  --card-kicker-fg:      var(--color-primary);
```

Note: this is a distinct primitive from the existing `entity/TaskCard`, which predates this token model and (as of the cross-cutting background-token fix earlier in § 24) now uses `--color-bg-surface`/`--color-border` directly rather than going through `--card-*`. Whether `TaskCard` should eventually be rebuilt on top of this `Card` primitive, or stay separate, is an open question for whenever this task starts — not decided here.

- [x] Build `components/Card` per the checklist above. Props landed as `title`, `kicker?`, `meta?`, `active?`, and a `children` content slot (for e.g. action buttons) — derived from the dark-theme artboard's "NEXT / Ring the bike shop about the wheel / Ten minutes… / [Done] [Later]" example (`documentation/Tendril components design.png`, CARD · LIST ROW section), no separate artboard 05 was available. Card itself is presentational only (no `onClick`/focus handling) — the artboard's own interactive elements inside a card are separate `Button`s
- [x] Stories: default (no kicker), with kicker, active (with `Done`/`Later` `Button` children, bordered, no shadow)
- [x] Review in Storybook — **approved**
- [x] Made `title` optional (children render as the entire content when omitted) — neither flagged call site has title/meta text of its own: `InProgressBlock` wraps a nested `TaskCard` + a prompt string, and `ResultsSlide`'s skeleton renders shimmer placeholder bars, not real text. Added a `ChromeOnly` story demonstrating this mode.
- [x] Integrate at existing call sites: `InProgressBlock.tsx`'s bordered/padded container (deleted `.container` CSS) and `ResultsSlide.tsx`'s `.skeletonCard` (deleted its CSS) both now use `Card` in chrome-only mode, both at `Card`'s single default radius (`--radius-lg`) — briefly added a second `radius="compact"` variant to match the skeleton to `TaskCard`'s separate `--radius-md`, then reverted per user feedback: not worth two radius variants on the primitive just to paper over `TaskCard` predating it. The mismatch stays exactly what it already was — the tracked open question above about whether `TaskCard` moves onto `Card`

---

### 24.4 Radio (`primitive-radio`)

**Depends on:** § 24.1 (`Button`) reviewed and approved first.

`documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 4.4 gives the starting point only — expand into a full token block as part of this task: `--radio-*`, 22px, `--radius-full`, 11px inner dot at `--color-primary`.

- [x] Expand the § 4.4 row into a full Layer-3 token block, then build `components/Radio` per the checklist above. Single controlled radio (`checked`/`onChange`/`label`/`disabled`), same minimal shape as the existing (pre-migration, unstyled-native) `Checkbox` — not a `RadioGroup`, since nothing consumes this yet and building group/exclusivity management with no caller would be speculative. Unlike `Checkbox`, the native `<input>` is visually hidden and a sibling `<span>` renders the custom 22px ring + 11px dot (`:checked`/`:disabled`/`:focus-visible` driven off the real input via sibling selectors), since the artboard's radio is fully custom-styled, not the browser default `Checkbox` left in place
- [x] Stories: unchecked, checked, disabled, disabled+checked
- [x] Fixed a click bug found in Storybook review: `.dot` (the visual circle, absolutely positioned over the real input) had no `pointer-events: none`, so it intercepted every click before it reached the actual `<input>` — nothing ever toggled when clicking the visible circle itself. Clicking the label text still worked (native `label[for]` behavior bypasses the stacking order), which is why this wasn't obvious from the code alone.
- [x] User then found they could check but not uncheck a radio in Storybook — expected native behavior (a lone radio can only go unchecked→checked by click; it's only ever unchecked by a *different* radio in the same group getting checked), but exposed a real gap: `Radio` had no `name` prop at all, so it couldn't form a real native group even if two were rendered side by side. Added `name?: string` (passed straight to the `<input>`) and a `Group` story (two `Radio`s sharing a `name`, local `useState` picking between them) so the exclusive-selection behavior is actually verifiable in Storybook
- [x] Review in Storybook — **approved**
- [ ] No existing raw `<input type="radio">` or circular-radio UI found in the app to integrate — the closest existing analogs (`EnergyPicker`, `LocationPicker`, `DurationPicker`, `PriorityPicker`) are pill-shaped single-select groups that map to Chip (§ 24.6) instead. Leave unintegrated until a real call site needs this shape.

---

### 24.5 Switch (`primitive-switch`)

**Depends on:** § 24.1 (`Button`) reviewed and approved first.

`documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 4.4 starting point: `--switch-*`, 44×26 track `--radius-full`, 20px knob on `--color-bg-surface` + `--shadow-sm`.

- [x] Expand the § 4.4 row into a full Layer-3 token block, then build `components/Switch` per the checklist above. Same hidden-native-input + styled-sibling pattern as `Radio` (applied the `pointer-events: none` fix on the visual layer from the start, learned from Radio's Storybook bug) — `<input type="checkbox" role="switch">` for correct a11y semantics, sibling `track`/`knob` spans driven off `:checked`/`:disabled`/`:focus-visible`
- [x] Stories: off, on, disabled, disabled+on
- [x] Review in Storybook — **approved**
- [ ] No existing toggle-switch markup found in the app to integrate. Leave unintegrated until a real call site needs one.

---

### 24.6 Chip (`primitive-chip`)

**Depends on:** § 24.1 (`Button`) reviewed and approved first.

`documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 4.4 starting point: `--chip-*`, 34px, `--radius-xs`, selected = `--color-primary-tint` fill + `--color-primary` text, border transparent.

- [x] Expand the § 4.4 row into a full Layer-3 token block, then build `components/Chip` per the checklist above. Unlike `Radio`/`Switch`, this is a plain `<button>` (no native form-control equivalent for a chip, and the existing pill-picker call sites already use `<button aria-pressed>`) — props are `label`, `selected`, `onClick`, `disabled`, plus an optional `icon` slot since the real call sites (`EnergyPicker`, `LocationPicker`) render an icon beside the label
- [x] Stories: unselected, selected, disabled
- [x] Review in Storybook — **approved**
- [x] **Finding:** on closer inspection, `EnergyPicker.tsx`/`DurationPicker.tsx`/`PriorityPicker.tsx` render a *joined segmented row* (buttons butted together, `margin-left: -1px`, only first/last corners rounded, one shared border ring, always exactly one selected) — structurally and semantically `SplitGroup` (§ 24.8, "mutually exclusive"), not `Chip` (separate gapped pills, "pick any"). Only `LocationPicker.tsx` (deselectable — can toggle off to none) actually matches `Chip`'s shape. Per user decision, deferred all four together rather than integrating `LocationPicker` alone at the time — resolved once `SplitGroup` was built: see § 24.8 for the actual integration of all four (three onto `SplitGroup`, `LocationPicker` onto `Chip`)

---

### 24.7 ListRow (`primitive-list-row`)

**Depends on:** § 24.1 (`Button`) reviewed and approved first.

`documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 4.4 starting point: `--list-row-*`, 44px min, `--radius-md`, selected = `--color-primary-tint`, 8px leading dot.

- [x] Expand the § 4.4 row into a full Layer-3 token block, then build `components/ListRow` per the checklist above. Props: `title`, `meta?`, `selected?`, `onClick`, `disabled?`. **Correction after user re-checked the artboard:** the leading dot isn't selected-only — every row has one, just muted (`--color-border-input`) when unselected and recolored to accent (`--color-primary`) when selected; originally built as conditional-on-selected only, fixed to always render and just swap `--list-row-dot-bg`/`--list-row-dot-bg-selected`
- [x] Stories: default, selected, with/without leading dot (now both stories show the dot, just recolored), plus a no-meta variant
- [x] Review in Storybook — **approved**
- [x] **Finding:** `TaskTreeItem.tsx`'s row turned out not to match `ListRow`'s shape — no selection state at all, a leading expand/collapse chevron instead of a selection dot, and trailing inline progress text ("12 / 30 min") instead of a meta line stacked below the title. `TaskCreationPage.tsx`'s `CreatedTaskRow` (parent-task picker) is the clean fit — title/meta/`selected` matches the artboard's own "1 selected" example almost exactly. Per user decision: integrate `CreatedTaskRow` only; `TaskTreeItem` stays as its own thing rather than stretching `ListRow`'s API with generic leading/trailing slots to force a fit. See § 24.12 for reconsidering `TaskTreeItem`'s own design instead.
- [x] Integrate `ListRow` into `TaskCreationPage.tsx`'s `CreatedTaskRow` — now a thin wrapper composing the priority/duration/energy/context fields into `ListRow`'s single `meta` string. Deleted the now-dead `.taskRow`/`.taskRow:hover`/`.taskRowSelected`/`.taskTitle`/`.taskMeta` CSS.

---

### 24.8 SplitGroup (`primitive-split-group`)

**Depends on:** § 24.1 (`Button`) reviewed and approved first.

`documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 4.4 starting point: `--split-*`, 44px, outer `--radius-md`, 1px `--color-border-input` seams, selected = `--color-primary-tint`.

- [x] Expand the § 4.4 row into a full Layer-3 token block, then build `components/SplitGroup` per the checklist above. Generic over a string-literal type (`SplitGroupOption<T>[]`, `value: T`, `onChange: (value: T) => void`) so it slots into each picker's own value type (`EnergyLevel`, priority number-as-string, etc.) without a cast. Same joined-segment CSS technique as the existing (pre-migration) `EnergyPicker`/`DurationPicker`/`PriorityPicker` — negative-margin overlap, first/last-child radius — since that's exactly the shape being formalized
- [x] Stories: 2-way and 3-way splits, one segment selected, disabled
- [x] User checked whether icon+label segments (as in `EnergyPicker`'s real pills) would work — they didn't yet: `SplitGroupOption` had no icon field. Added an optional `icon` (rendered above the label, matching `EnergyPicker`'s current vertical icon-over-text layout), switched `.segment` from a fixed 44px `height` to `min-height` so icon segments can grow past it, and added a `WithIcons` story
- [x] Review in Storybook — **approved**
- [x] Integrate at existing call sites: `ThemeToggle.tsx`'s 3-way Light/Auto/Dark control — first made into a thin wrapper around `SplitGroup`, then deleted outright per user follow-up once it was clearly zero-value (no real caller, not atomic). **Finding while deleting it:** `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 3.3 shows `ThemeToggle` was originally spec'd as a *different* construction entirely — a tinted track with an inset selected pill, no shared borders — distinct from `SplitGroup`'s joined-seam shape; that design was never actually built, and wrapping `ThemeToggle` around `SplitGroup` used the wrong one. No live impact today since there's no caller, but flagged in § 23 and § 3.3 for whoever builds the real theme control. `ThemePreviewToggle.tsx`'s 2-way Light/Dark toggle is Storybook-docs tooling only, not app UI — left as-is, optional/lower priority.
- [x] Also (found during § 24.6's `Chip` integration pass): `EnergyPicker.tsx`, `DurationPicker.tsx`, and `PriorityPicker.tsx` were joined segmented rows — the same shape as this component, not `Chip`. Integrated all three onto `SplitGroup` here instead. `DurationPicker`/`PriorityPicker`'s `value` is a `number`; `SplitGroup` is generic over `T extends string`, so both map `String(value)`/`Number(val)` at the boundary rather than widening the primitive to accept numbers for two callers. `EnergyPicker` supplies its existing `EnergyIcon` per option via `SplitGroup`'s new `icon` slot. Deleted the now-dead joined-segment CSS (`.group`/`.button`/`.selected`/`.levelLabel` and friends) from all three
- [x] `LocationPicker.tsx` (the one genuine `Chip` call site among the four) integrated onto `Chip` at the same time. Note: this is a real visual change, not just a token swap — `LocationPicker` previously rendered the same *joined* segmented shape as the other three (icon-above-label, taller pills), but `Chip`'s artboard shape is a fixed 34px single-row pill, so the icon moved from above the label to beside it and the pills are now separate with gaps instead of joined seams. This follows directly from `LocationPicker` being the deselectable/"pick any" one — flag if the shorter, gapped-pill look doesn't read right at this call site.

---

### 24.9 InlineMessage (`primitive-inline-message`)

**Depends on:** § 24.1 (`Button`) reviewed and approved first.

`documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 4.4 starting point: `--message-*`, `--color-bg-surface`, `--radius-md`, 7px status dot in `--color-success` / `--color-error`.

- [x] Expand the § 4.4 row into a full Layer-3 token block, then build `components/InlineMessage` per the checklist above. Props: `status` (`"success" | "error"`), `children: ReactNode` (not `string` — `TaskCreationPage`'s "Adding as subtask of **X**" call site needs embedded markup, not plain text). `role="alert"` for error, `role="status"` for success
- [x] Stories: success, error
- [x] Review in Storybook — **approved**
- [x] Added a third `status: "info"` (muted dot, `role="status"`) — two of the six flagged call sites (`TaskCreationPage`'s subtask notice, `InProgressBlock`'s prompt) turned out to be neutral banners, not success/error, which the § 4.4 spec's two-status design didn't cover
- [x] `TaskCreationForm.tsx`'s "Title is required" is **not** an `InlineMessage` call site after all — it's rendered through `TextInput`'s own `error` prop (§ 24.2), which is the correct place for a field-level validation message (linked via `aria-describedby`); wrapping it separately would duplicate/conflict with that
- [x] Integrated: `ResultsSlide.tsx`'s "Failed to load results" (error); `InProgressPage.tsx`'s fetch-failure message (error); `TaskDetailPage.tsx`'s top-level fetch-error and the `actionError` start/split-failure banner (both error; the "Loading…" text stayed plain, not a status message); `TaskCreationPage.tsx`'s save-failure error and "Adding as subtask of…" banner (now `info` — previously an ad hoc `--color-primary-tint` pill, now the standard surface+dot treatment, a real visual change worth a look) — wrapped both in a small `.notice` div since `InlineMessage` doesn't take a `className` and the old classes carried the bottom margin. Also found and fixed `TasksPage.tsx`'s identical fetch-error text, which wasn't in the original candidate list.
- [x] **Left `InProgressBlock.tsx`'s "Finish this task or mark it complete…" prompt as plain text, not integrated:** it renders inside a `Card`, and `Card`/`InlineMessage` share the same `--color-bg-surface` background — nesting one inside the other would make the message pill invisible (no contrast against its own container). Revisit if `Card` or `InlineMessage` ever gets a way to differentiate nested surface levels.
- [x] Deleted now-dead `.error`/`.subtaskNotice` CSS from every touched file (`ResultsSlide`, `InProgressPage`, `TaskDetailPage`, `TaskCreationPage`, `TasksPage`)

---

### 24.10 Sheet / Modal (`primitive-sheet-modal`)

**Depends on:** § 24.1 (`Button`) reviewed and approved first.

`documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 4.4 starting point: `--sheet-*`, `--radius-xl` top corners, `--shadow-lg`, `--motion-medium` entry.

- [ ] Expand the § 4.4 row into a full Layer-3 token block, then build `components/Sheet` per the checklist above
- [ ] Stories: open/closed states, with a scrollable-content variant
- [ ] Review in Storybook — **approved**
- [ ] No dedicated overlay markup exists yet. `TaskDetailPage.tsx`'s Split action uses a native `window.prompt("Name the new parent task:")` — the nearest analog, but replacing it means designing the input flow inside a sheet, not just swapping a container. Treat as a follow-up decision when this task starts, not a mechanical integration.

---

### 24.11 Skeleton (`primitive-skeleton`)

**Depends on:** § 24.1 (`Button`) reviewed and approved first.

Added after § 24.3 (`Card`): `ResultsSlide.tsx`'s loading placeholder (shimmer bars inside a `Card`) is currently one-off, feature-local CSS (`ResultsSlide.module.css`'s `.skeletonLine`/`.skeletonTitle`/`.skeletonMeta` + `@keyframes shimmer`) rather than a shared primitive — formalize it so any future loading state reuses the same shimmer treatment instead of re-implementing it.

Not in `documentation/DESIGN-TOKENS-BY-COMPONENT.md` — no artboard reference for this one; derive the token block from `ResultsSlide`'s existing shimmer implementation (gradient sweep over `--color-border`, `1.4s` cycle) rather than a design doc.

- [ ] Design the token block (line height(s), radius, shimmer base/highlight colors, cycle duration) and add it to `tokens.css` under `/* Skeleton — components/Skeleton */`
- [ ] Build `components/Skeleton` per the checklist above — likely a single bar primitive (`width`/`height` props) that `ResultsSlide` composes multiple of, same shape as its current two stacked lines
- [ ] Stories: single bar at a few widths, and a composed multi-line example matching `ResultsSlide`'s current title+meta pair
- [ ] Review in Storybook — **approved**
- [ ] Integrate at existing call site: `ResultsSlide.tsx`'s skeleton lines — delete `.skeletonLine`/`.skeletonTitle`/`.skeletonMeta`/`@keyframes shimmer` from `ResultsSlide.module.css` once replaced. Also update `Atomic/Card`'s `Skeleton` story (added during § 24.3 review) to use the new primitive instead of its static inline-styled bars

---

### 24.12 Reconsider `TaskTreeItem`'s row design (`task-tree-item-redesign`)

Added during § 24.7 (`ListRow`): `TaskTreeItem.tsx`'s expandable row (leading chevron, title, trailing inline progress, no selection state) doesn't match `ListRow`'s shape (leading dot, title + stacked meta, selectable) or any other migrated primitive, so it was deliberately left out of that integration rather than force-fit. Since it's the only remaining un-migrated "row" in the task list/tree UI, decide whether it should be redesigned to align with `ListRow` (or a variant of it) or is legitimately a distinct shape (a disclosure row, not a selectable list item) that just needs its own Layer-3 tokens.

- [ ] Compare `TaskTreeItem`'s row against `ListRow` and the artboard and decide: adapt `ListRow` (e.g. generic leading/trailing slots), give `TaskTreeItem` its own small token-driven primitive, or leave it as a pre-migration component like `TaskCard`
- [ ] Whichever direction — migrate `TaskTreeItem.module.css`'s `.row`/`.indicator`/`.title`/`.progress` off direct Layer-2 references

---

### 24.13 Redesign `Select` (`select-redesign`) — blocked on a mobile design

Added after user review of the DROPDOWN/SELECT artboard section. `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 3.4 already anticipated this and lays out two options that were never turned into a task: (a) keep the native `<select>`, migrate only the closed-field styling onto `--select-*` tokens (cheap, no custom open-menu — the doc's own "correct choice for now"); (b) replace it with a fully custom listbox matching the artboard's open state exactly (18px radius menu, 40px rows, `--color-primary-tint` selected row, `--shadow-md`) — real cost: keyboard handling, focus trapping, positioning.

User wants a third direction beyond either of those: the **same** `Select` component opening as a dropdown on desktop and as a **bottom sheet** on mobile. There is no design for the mobile bottom-sheet variant yet — do not invent one. This also depends on § 24.10 (`Sheet`/`Modal`), which doesn't exist yet either.

- [ ] **Blocked:** get or create a design for the mobile bottom-sheet variant of `Select` before implementation starts
- [ ] Once designed, sequence this after § 24.10 (`Sheet`/`Modal`) is built, since the mobile variant presumably composes it
- [ ] Decide the responsive-switch mechanism (viewport breakpoint via CSS/JS, or a shared hook) and whether `Select`'s external API (`options`/`value`/`onChange`/`label`/`placeholder`/`disabled`) needs to change to support both presentations
- [ ] Migrate the closed-field styling onto `--select-*` tokens (§ 3.4 option (a)'s block) regardless of which open-state direction wins — that part isn't blocked on the above

---

## 25. Centralized message service (`message-service`)

`InlineMessage` (`src/components/InlineMessage/`) is currently rendered inline, per-page, wherever a page needs to show a status/error/success message — each of `InProgressPage`, `ResultsSlide`, `TaskDetailPage`, `TasksPage`, and `TaskCreationPage` owns its own local state and renders its own `<InlineMessage>` independently. This works today but doesn't manage the case where a page (or an action within a page) might want to fire multiple messages in quick succession — there's no shared mechanism to queue them, dedupe, or prevent one message's render from stomping another's.

Evaluate whether `InlineMessage` should stay page-local or move behind a central message/toast service — a single place that owns a message queue, decides what's currently visible, and exposes a simple `notify(status, text)`-style API that any page or feature can call instead of managing its own local state.

- [ ] Audit every current `InlineMessage` call site (`InProgressPage`, `ResultsSlide`, `TaskDetailPage`, `TasksPage`, `TaskCreationPage`) and characterize each usage: is it a one-shot page-load error, a transient action-result toast, or something that could plausibly overlap with another message on the same page?
- [ ] Decide whether a central queueing service is actually warranted yet, or whether it's premature given current usage is all single-message-per-page — per `CLAUDE.md`'s "smallest footprint" guidance, this should be raised as an explicit trade-off (uncertainty about future needs) rather than assumed
- [ ] If warranted: design the service's shape (a React context + provider vs. a standalone singleton store), its queue/collision behavior (replace, stack, or dismiss-then-show-next), and how a page opts in to firing a message through it (a hook, e.g. `useMessageQueue()` or `notify()`)
- [ ] If warranted: migrate existing call sites one at a time, removing each page's local message state as it's migrated
- [ ] Update `documentation/ARCHITECTURE.md` recording the decision either way (centralize now, or explicitly defer with the reasoning)

---

## 26. Completed tasks in the tasks list (`completed-tasks-list`)

**Current state (confirmed by reading the code):** `queryTasks(db, userId, options)` (`apps/api/src/db/queries.ts`) only filters by status when a caller passes `options.status` — `GET /api/tasks` with no `?status=` query param returns tasks of every status, completed included. Both `TasksPage.tsx` and `TaskDetailPage.tsx` call `getTasks()` with no status argument, so completed tasks are already present in the tree today. `TaskTreeItem.tsx` uses each descendant's `status === "completed"` only to compute a parent's aggregate `completedMinutes / totalMinutes` progress line — a completed row itself has no visual marking (no strikethrough, badge, dimming) distinguishing it from a pending one.

Decide the intended UX for completed tasks inside a project tree — per-user request, this shouldn't default to silently hiding them, since the user may want to view completed tasks in the context of their project (e.g. reviewing what's been done on a project so far).

**Growth concern:** because `GET /api/tasks` returns every status with no pagination, the response grows unbounded as a user accumulates completed tasks over time — every `TasksPage`/`TaskDetailPage` load re-fetches the user's entire completed history whether or not it's shown. This pushes toward filtering completed tasks out **server-side by default** (not a client-side filter over an ever-growing unfiltered payload) and fetching them on demand — e.g. scoped to one project/parent, possibly paginated — only when the user actually asks to see them, rather than loading them eagerly with everything else.

- [ ] Decide default visibility. Candidate approach: default `GET /api/tasks` load includes a completed *leaf* task only when it belongs to an *active* project (i.e. has an ancestor project that is not itself fully completed) — so recently-finished work still shows in context under a project the user is actively working — but excludes (a) completed tasks with no parent (standalone, not part of any project) and (b) entire projects that are fully completed (root + all descendants `completed`, per §13's cascade). This bounds default load growth to "active project" completions rather than the full historical set, while still answering the user's "view completed in project context" ask for the common case.
- [ ] If the above is adopted, decide the query shape needed to express it server-side: e.g. `queryTasks` needs to know, per row, whether its root ancestor project is fully completed (likely via `groupTasksByParent`, walking each candidate row's ancestor chain, or precomputing a `projectCompleted` flag) — this is nontrivial to do efficiently in one query and needs its own design pass, not just a `WHERE status != 'completed'`
- [ ] Decide how the user reaches the excluded set (standalone completed tasks + fully-completed projects) — two options raised, not mutually exclusive: (a) a checkbox/toggle in `TasksPage` that re-fetches with completed+archived projects included; (b) a dedicated Archive page/route for browsing completed tasks and completed projects separately from the active list. Pick one for v1 or decide both are worth building and sequence them
- [ ] Whichever fetch-on-demand shape is chosen (toggle vs. archive page), decide the query shape: `?status=completed&parentId=` for a scoped per-project fetch, a dedicated endpoint, or pagination (`limit`/`cursor`) if a single project can itself accumulate many completed tasks over time
- [ ] Add a visual indicator for `status: "completed"` on individual task rows in `TaskTreeItem` (and any other place a completed leaf task can appear in a list, e.g. `TaskCard`) — e.g. strikethrough title, muted color, checkmark badge — using existing design tokens, not new literals
- [ ] If a "show completed" toggle/action is added, decide where it lives (per-project, global to `TasksPage`) and whether the state should persist (e.g. across navigations/sessions)
- [ ] Reconcile with `TaskTreeItem`'s existing `completedMinutes / totalMinutes` progress line — decide whether that number can still be computed cheaply (e.g. a server-side count) once completed descendants are no longer fetched by default alongside everything else
- [ ] Cross-check against §13 (Cascading Task Completion, not yet built) — once a parent can auto-complete when its last child completes, confirm the chosen display behaves sensibly for a fully-completed subtree (e.g. does the whole branch collapse, stay expanded and greyed out, etc.)

---

## 27. Task search (`task-search`)

Add the ability to search tasks. MVP scope is search by label (task title text match); a later pass extends this to more complex parameters (context, priority, energy, duration, location, status, date range, combined/multi-field criteria).

### MVP: search by label

- [ ] Decide where the search entry point lives (e.g. a search input on `TasksPage`) and whether it searches the currently-loaded task list client-side, or issues a server query — consider `§26`'s growth concern (the task list won't always be fully loaded client-side once completed/archived tasks are excluded by default) when deciding
- [ ] If server-side: add a `?q=` (or similarly named) param to `GET /api/tasks` doing a case-insensitive substring/partial match against `title`; update `queryTasks` and `apps/api/openapi.yaml`
- [ ] Decide match behavior against the task tree: does matching a child task also surface its ancestor chain (so the result reads in project context, similar to `TaskCard`'s `ancestors` breadcrumb), or is it a flat list of matches?
- [ ] Write real-DB integration test(s) for the search query if server-side (per `CLAUDE.md`'s API testing strategy, since it's a new query pattern) — or client-side unit tests if implemented as a local filter
- [ ] Update `ARCHITECTURE.md` recording the MVP approach taken (client-side filter vs. server query) and why

### Later: search by additional parameters

- [ ] Design the filter model once the MVP ships and real usage patterns are known — candidate fields: `context`, `priority`, `energyRequired`, `duration` (range), `location`, `status`, `dueDate` (range)
- [ ] Decide whether this reuses/extends the label search's query mechanism (e.g. combinable query params) or is a separate structured filter UI
- [ ] Revisit whether pagination becomes necessary at this point, per `§26`'s dataset-growth concern

---

## 28. Task status transition audit (`transition-audit`)

Prompted by the snooze bug found and fixed in §12 (`POST /api/tasks/:id/snooze` set `lastSuggestedAt` but left `status: "in_progress"` untouched, so the in-progress block never actually cleared — silently contradicting `ARCHITECTURE.md`'s own User Flow doc, which lists snooze as a way to resolve the block). Audit every action that changes a task's status or otherwise affects the in-progress block, to catch similar gaps before they ship rather than after.

- [ ] `Start` (`PUT /api/tasks/:id` → `status: "in_progress"`, wired from `TaskDetailPage` and `RankingPage.handleStartTask`) — confirm every call site is blocked when another task is already `in_progress`, and that no path can leave two tasks `in_progress` at once
- [ ] `Snooze` (`POST /api/tasks/:id/snooze`) — verify the fix end-to-end from both `RankingPage` and `InProgressPage`: the block clears on the next `/api/rank` call, and the task is correctly suppressed for the recency window afterward rather than immediately re-suggested
- [ ] `Complete` (`PUT /api/tasks/:id` → `status: "completed"`) — verify completing the in-progress task clears the block immediately on the next `/api/rank` call; re-check once §13 (Cascading Task Completion) lands, since a cascade could interact with this
- [ ] `Delete` (`DELETE /api/tasks/:id`, both `childAction` values, with and without children) — verify deleting the currently in-progress task clears the block, and that no child is left with a `parentId` pointing at a deleted task
- [ ] Record the resulting status-transition expectations (status before → action → status after, and whether the in-progress block clears) in `ARCHITECTURE.md`'s Task status section, so future actions can be checked against a written table instead of re-discovered by testing

---

## 29. Delete action in the tasks list — completed, see TASKS-DONE.md

---

## 30. `RankingPage` optimistic updates (`ranking-optimistic-updates`)

Today `RankingPage.handleInProgressAction`/`handleStartTask`/
`handleDeleteChildrenChoice` all call `refreshAfterMutation()`, which resets
every slide back to `idle` and re-runs `/api/rank` for the active slide —
a full reload rather than a local update. `TasksPage`'s delete action
(§29) instead updates local state optimistically and only
refetches if the backend call fails. Review whether `RankingPage`'s
complete/snooze/delete/start actions should move to the same pattern
instead of the current reload-every-slide approach.

- [ ] Decide what "optimistic" means for a ranked result set specifically (removing a completed/deleted/started task from the currently-displayed slide is straightforward; snoozing changes ranking order, which arguably still needs a re-rank) — this isn't a 1:1 copy of `TasksPage`'s simpler flat-list case
- [ ] Depends on §31 (a general failed-backend-call mechanism) landing first, or at least being designed, so this doesn't duplicate the same "what happens when the optimistic update turns out wrong" problem §29's MVP delete is deliberately punting on
- [ ] Apply the chosen pattern consistently to complete/snooze/delete/start, replacing `refreshAfterMutation()` per-action rather than leaving a mix

---

## 31. General failed-backend-call handling (`backend-error-handling`)

Prompted by `TasksPage`'s optimistic delete (§29): rather
than build a bespoke "something went wrong, click OK to refresh" flow per
page/action, the app needs one general mechanism for handling a backend call
that fails (whether following an optimistic update or any other unexpected
failure) — notify the user once, in one consistent way, and refresh the
current page's data afterward.

- [ ] Design where this mechanism lives — a shared hook (e.g. `useBackendCall`/`useMutation`-style wrapper other pages/actions call through), a top-level error boundary/interceptor, or a shared notice component + a small utility both `TasksPage` and (eventually) `RankingPage` call into
- [ ] Decide the notification UX: a modal/dialog requiring acknowledgment before refresh (current `TasksPage` MVP behavior) vs. a dismissible toast that refreshes in the background
- [ ] Decide what "refresh the current page" means generically across different pages (each page currently owns its own fetch — `getTasks()`, `rank()`, etc.) — likely each page needs to expose/register its own refetch function to this mechanism
- [ ] Migrate `TasksPage`'s bespoke failure handling onto this mechanism once built, and revisit §30 (`RankingPage` optimistic updates) against it
- [ ] Update `ARCHITECTURE.md` recording the decision

---

## 32. Analytics and error tracking setup (`analytics-setup`) — deferred, low priority

Not needed while the app has a single dev user and no production
deployment. Once production deployment is under consideration, add a way
to track usage events and errors (e.g. a client-side analytics/error-
tracking SDK, or a lightweight self-hosted event log) so real usage
patterns and failures are visible instead of only discoverable by manual
testing.

- [ ] Decide on a provider/approach once this becomes relevant (a hosted product analytics tool, a self-hosted event log, or piggybacking on whatever error-tracking service is chosen for the backend) — no research done yet, intentionally deferred
- [ ] Once §31 (general failed-backend-call handling) exists, wire it to also emit an error event through this mechanism, so failures are visible in aggregate and not just shown to the one user who hit them

**Trigger:** production deployment is actually being planned, or the "single dev user" assumption elsewhere in this file stops holding.

---

## Open Issues

Issues that came up during implementation but were deferred to keep scope focused.

- **Split sibling title** — `POST /api/tasks/:id/split` creates the blank sibling with `title: ""`. Decide whether the API should accept an optional `siblingTitle` in the request body, or whether the client is always expected to prompt for it after navigation.
- **Carousel swipe direction** — currently parameterized (swipe-right reveals results). Finalize after UX testing whether this should be fixed or follow locale direction.
- **Ranking filtering and sort order** — when filtering by available time (e.g. 10 minutes), tasks that exceed the time budget are still returned. Investigate whether the engine's `durationScore` penalizes but doesn't exclude over-budget tasks, and whether a hard filter is needed. Additionally, returned tasks are not sorted in a user-intuitive order — sort results from low to high based on energy level and available time so the easiest/quickest tasks surface first.
- **Hide context label in context-specific slides** — when viewing results in a context-specific carousel slide (e.g. "Learning"), the context badge in each `TaskCard` is redundant. Only display the context label when the card is shown on the "All" slide.
- **Use EnergyIcon in TaskCard** — replace the "medium energy" text in `TaskCard` meta with the `EnergyIcon` component (from `EnergyPicker`) for a more compact, visual representation.
- ~~**ResultsSlide idle/loading text**~~ — replaced "Swipe here to load results" and "Loading…" text with a shimmer skeleton of 3 placeholder task cards for both `idle` and `loading` states. ✓
