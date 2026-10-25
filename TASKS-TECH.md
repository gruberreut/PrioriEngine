# Technical tasks

Technical work: the goal is not a change users can see (refactors, infrastructure, tooling, docs, quality). Read this file when `TASKS-BUGS.md` has no open, unblocked items, and before `TASKS-FEATURES.md` (see `CLAUDE.md` § Task Tracking).

**Priority order:** §48 (shared queries split by entity) first, then the rest of this file in order.

**§37 (Alpha Readiness)** collects everything needed to deploy an Alpha to friends and family for feedback, cross-referencing sections in all the task files, including §38 (Deployment) and §39 (Alpha access control). Check there for the current shape of that effort rather than re-deriving it from the full section list.

Section numbers are shared with `TASKS-BUGS.md`, `TASKS-FEATURES.md` and `TASKS-DONE.md`, and never reused. A number missing here is in one of those files.

---

## 48. Split shared queries by entity into `db/sharedQueries/` (`shared-queries-by-entity`) — high priority

Filed out of order, right after Known Bugs, because it's high priority; the section number doesn't reflect that.

`apps/api/src/db/queries.ts` holds the queries that more than one file needs, so they aren't duplicated when one entity's code reads another entity's data (e.g. `routes/rank.ts` reading tasks through `queryTasks`). With every entity in one file it will keep growing and mix entities together. Split it into one file per entity so each entity's shared access is easy to find and review.

Scope stays **shared queries only**: the directory's purpose is de-duplication across files. Queries used by just one route stay inline in that route, as today.

Current contents (31 lines): `queryTasks` and `groupTasksByParent`, both task-related, used by `routes/tasks.ts` and `routes/rank.ts`. `contexts` and `users` have no shared queries yet.

- [ ] Replace `apps/api/src/db/queries.ts` with a directory `apps/api/src/db/sharedQueries/`, one file per entity named after its table in `schema.ts` (`tasks.ts` now; `contexts.ts`, `users.ts` only when their first shared query exists, no empty placeholder files)
- [ ] Move the `Db` type into a shared `sharedQueries/types.ts`, so each entity file doesn't redefine it
- [ ] No re-exporting `index.ts`: callers import from the entity file directly (`../db/sharedQueries/tasks.js`), so the import shows which entity is being accessed
- [ ] Connect each entity's route file to its shared-queries file: import from it where the route uses a shared query; where it doesn't (yet), a short comment at the top of the route file pointing at `db/sharedQueries/<entity>.ts`, only once that file exists
- [ ] Move `test/db/queries.test.ts` to `test/db/sharedQueries/tasks.test.ts`, mirroring the new structure
- [ ] Update the Database Access Pattern section in `apps/api/CLAUDE.md`: new path, one file per entity, shared-only scope, import-or-comment link from the route file
- [ ] Record the decision in `documentation/ARCHITECTURE.md` in the same commit (why per-entity, why shared-only, why no barrel `index.ts`), and update its existing `queries.ts` mentions (the directory tree, the `hasChildren` note, the shared-query rule, the `groupTasksByParent` note)
- [ ] Update the `queries.ts` mention in `documentation/techDesign/user-provisioning/lld.md`
- [ ] `npm test -w @priori/api` passes

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

## 22. TempAppName design token rollout (`tendril-design-rollout`)

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
- [ ] Review in Storybook — **approved**

---

## 24. New TempAppName primitives (`tendril-primitives`)

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

Primary is a **fill**, not an outline — this app is TempAppName throughout, the two systems (TempAppName fills, Nocturne outlines) are never mixed. Focus: `box-shadow: var(--focus-ring-offset)` on filled variants, `var(--focus-ring)` on outlined ones.

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

- [x] Expand the § 4.4 row into a full Layer-3 token block, then build `components/Sheet` per the checklist above. Props: `open`, `onClose`, `title?`, `children`. Bottom-anchored backdrop+panel (`role="dialog"`, `aria-modal`, Escape-to-close, backdrop-click-to-close — same interaction shape as `ConfirmDialog`), rounded top corners only (`--sheet-radius`), capped at `--sheet-max-height` with the content area scrolling internally past that (`flex: 1; min-height: 0; overflow-y: auto`, the same pattern §22.2 established for page-level scroll containers). No exit animation designed, matching the spec's singular "motion-medium **entry**" wording and `ConfirmDialog`'s own precedent — the panel unmounts immediately on `open: false`, entry is a CSS `@keyframes` slide-up.
- [x] **Correction after user review:** first pass added a close (`X`) button that isn't in any artboard mockup — none of § 9a/§9b's sheet or menu states show one, dismissal is scrim/Escape/grabber/row-tap only. Removed it (and the now-unused `Close` icon asset it required). Also fixed: the header row rendered unconditionally even with no `title`, reading as an oversized empty band — now the header doesn't render at all when `title` is omitted, and its top padding dropped from `--sheet-pad-y` (24px) to `--space-3` (12px) so the title bar reads as a compact label, not another content block
- [x] **Finding:** the task's own premise ("no dedicated overlay markup exists yet") was stale — `components/ConfirmDialog` (built in §12, already Layer-3 migrated with its own `--confirm-dialog-*` group) is a real backdrop+panel overlay already in production use across `RankingPage`/`InProgressPage`/`TasksPage`. Decided these are two distinct primitives, not a case of Sheet replacing or being built on ConfirmDialog: `ConfirmDialog` is a small centered choice-prompt built on `Card`, `Sheet` is a bottom-anchored free-form-content panel matching the artboard-table's `--radius-xl`-top-corners spec — same "distinct primitive, open question whether the older one migrates onto it" relationship §24.3 already established between `Card` and `TaskCard`, left open here too rather than decided
- [x] Per CLAUDE.md's Design-tokens rule 5 (a literal in two Layer-3 groups gets promoted to a Layer-2 role), promoted `ConfirmDialog`'s backdrop scrim literal to a new Layer-2 role `--color-scrim`; repointed `--confirm-dialog-backdrop-bg` at it too. Initially declared this mode-independent (a single `rgb(0 0 0 / .45)`) since no design existed to check it against — **corrected once the user supplied `documentation/Tendril Select component.png`** (see below): `--color-scrim` is actually mode-dependent, `rgb(46 42 38 / .38)` light / `rgb(0 0 0 / .58)` dark, the same warm-ink-tinted formula `--shadow-*` already uses rather than flat black — now declared in all three theme blocks, matching `test/tokens.parity.test.ts`'s existing guard
- [x] Stories: Default (open, titled), Closed, NoTitle, ScrollableContent (20-row list, exercises the internal-scroll cap)
- [x] Review in Storybook — **approved**
- [ ] No dedicated overlay markup exists yet **for this specific replacement**. `TaskDetailPage.tsx`'s Split action uses a native `window.prompt("Name the new parent task:")` — the nearest analog, but replacing it means designing the input flow inside a sheet, not just swapping a container. Treat as a follow-up decision when this task starts, not a mechanical integration — not done as part of this pass.
- [x] **Revised once the user supplied the real Select artboard** (`documentation/Tendril Select component.png`, § 9a–9c — see § 24.13, now unblocked) confirming what `Sheet` is actually for: `Select`'s mobile listbox presentation, composed as-is with no bespoke overlay code of its own. The artboard's own bottom-sheet spec (§9c) revealed three real gaps against what had been built with no spec to check against:
  - Added a grab handle (`--sheet-grabber-*` tokens: 36×4px, `--radius-full`, `--color-border-input`) — decorative/`aria-hidden` (Escape stays the one accessible dismiss path, since there's no close button — see the correction above), but functionally live: tap or drag down past an 80px threshold dismisses, via `pointerdown`/`pointermove`/`pointerup` on a `touch-action: none` row, matching the artboard's "grabber still dismisses" / "drag the grabber down" behavior
  - Added a scrim fade-in (`@keyframes sheet-scrim-in`, `--motion-fast`) — was appearing instantly
  - Added safe-area-aware bottom padding on the scrollable body (`calc(var(--sheet-pad-y) + env(safe-area-inset-bottom))`) so the last row doesn't sit under a home indicator, same `env()`-direct approach §22.2 already used
  - Changed `--sheet-max-height` from an invented 85vh to 70vh, now grounded in the artboard's own `--select-sheet-max-h` value (no other consumer existed yet to conflict with the change)
  - Confirmed via user decision: these stay in the generic `Sheet` (not bespoke to `Select`) so every future sheet consumer gets them for free. **Correction once § 24.13 was actually implemented:** the artboard's `--select-sheet-*`/`--select-grabber-*` tokens turned out unnecessary rather than needing their own mirrored Layer-3 declarations - since `Select`'s mobile branch composes `<Sheet>` as a real component, `Select.module.css` never draws that chrome itself, so there's no second CSS module referencing `Sheet`'s tokens for rule 6 to even apply to. See § 24.13 for the actual token set `Select` ended up with
- [x] **Correction after user review of § 24.13's mobile presentation:** `--sheet-max-width` (480px, my own invented cap - no artboard basis, unlike `--sheet-max-height` which is now spec-grounded) kept the panel from filling a container wider than 480px even though `Select` composes `Sheet` for any container up to 767px wide. Real bottom sheets go edge-to-edge by convention (unlike a centered modal, which is exactly why one gets a width cap and the other shouldn't have copied that pattern) - removed the token and the `.panel` rule referencing it entirely, rather than just raising the number
- [x] **Correction, same review:** `Sheet`'s `.body` had no persistent scroll affordance - a `--sheet-max-height: 70vh` cap has no way to guarantee a partial "peek" row the way `Select`'s own fixed-238px desktop menu can, so a long list inside a sheet gave no hint it was scrollable beyond whatever the OS's auto-hiding scrollbar happened to show. Added `--sheet-scrollbar-thumb`/`--sheet-scrollbar-radius` and a persistent styled scrollbar (`scrollbar-width`/`scrollbar-color` for Firefox, `::-webkit-scrollbar*` for Chromium/Safari) rather than an auto-hide-dependent default - see § 24.13 for the parallel fix on `Select`'s own desktop menu and the alternatives considered (a bottom fade-gradient overlay was the other option, not chosen since it needed a sticky-positioning trick that couldn't be visually verified without running Storybook)

---

### 24.11 Skeleton (`primitive-skeleton`)

**Depends on:** § 24.1 (`Button`) reviewed and approved first.

Added after § 24.3 (`Card`): `ResultsSlide.tsx`'s loading placeholder (shimmer bars inside a `Card`) is currently one-off, feature-local CSS (`ResultsSlide.module.css`'s `.skeletonLine`/`.skeletonTitle`/`.skeletonMeta` + `@keyframes shimmer`) rather than a shared primitive — formalize it so any future loading state reuses the same shimmer treatment instead of re-implementing it.

Not in `documentation/DESIGN-TOKENS-BY-COMPONENT.md` — no artboard reference for this one; derive the token block from `ResultsSlide`'s existing shimmer implementation (gradient sweep over `--color-border`, `1.4s` cycle) rather than a design doc.

- [x] Designed the token block and added it to `tokens.css` under `/* Skeleton — components/Skeleton */`: `--skeleton-height` (1rem default), `--skeleton-radius` (`--radius-sm`), `--skeleton-bg`/`--skeleton-bg-highlight` (`--color-border` / `color-mix(in srgb, var(--color-border) 50%, transparent)`, matching the gradient sweep exactly), `--skeleton-duration` (1.4s) — all lifted directly from `ResultsSlide`'s existing values, nothing new invented
- [x] Built `components/Skeleton` — a single bar (`width?`/`height?` props, both plain CSS strings passed through inline `style`, since arbitrary per-instance sizing is the component's entire job and doesn't belong in the shared module CSS). `width` defaults to 100%, `height` defaults to `--skeleton-height` via CSS rather than a JS default, so it themes automatically
- [x] Stories: Default, Narrow (45% width), CustomHeight, ComposedLines (reproduces `ResultsSlide`'s exact three-`Card` loading layout)
- [ ] Review in Storybook — **approved**
- [x] Integrated at `ResultsSlide.tsx`: replaced the two `<div className={...skeletonLine/-Title/-Meta}>` elements with `<Skeleton width="70%" />`/`<Skeleton width="45%" height="0.75rem" />`; deleted `.skeletonLine`/`.skeletonTitle`/`.skeletonMeta`/`@keyframes shimmer` from `ResultsSlide.module.css` (kept `.skeletonList`, the flex wrapper around the three `Card`s — that's layout, not the primitive's concern). Also updated `Atomic/Card`'s own `Skeleton` story to compose the new primitive instead of its static inline-styled bars — aliased the import to `SkeletonBar` in that file since the story itself is already named `Skeleton` (a Storybook export, not renameable without changing the story's URL)

---

### 24.12 Reconsider `TaskTreeItem`'s row design (`task-tree-item-redesign`)

Added during § 24.7 (`ListRow`): `TaskTreeItem.tsx`'s expandable row (leading chevron, title, trailing inline progress, no selection state) doesn't match `ListRow`'s shape (leading dot, title + stacked meta, selectable) or any other migrated primitive, so it was deliberately left out of that integration rather than force-fit. Since it's the only remaining un-migrated "row" in the task list/tree UI, decide whether it should be redesigned to align with `ListRow` (or a variant of it) or is legitimately a distinct shape (a disclosure row, not a selectable list item) that just needs its own Layer-3 tokens.

- [ ] Compare `TaskTreeItem`'s row against `ListRow` and the artboard and decide: adapt `ListRow` (e.g. generic leading/trailing slots), give `TaskTreeItem` its own small token-driven primitive, or leave it as a pre-migration component like `TaskCard`
- [ ] Whichever direction — migrate `TaskTreeItem.module.css`'s `.row`/`.indicator`/`.title`/`.progress` off direct Layer-2 references

---

### 24.13 Redesign `Select` (`select-redesign`)

Added after user review of the DROPDOWN/SELECT artboard section. `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 3.4 already anticipated this and lays out two options that were never turned into a task: (a) keep the native `<select>`, migrate only the closed-field styling onto `--select-*` tokens (cheap, no custom open-menu — the doc's own "correct choice for now"); (b) replace it with a fully custom listbox matching the artboard's open state exactly (18px radius menu, 40px rows, `--color-primary-tint` selected row, `--shadow-md`) — real cost: keyboard handling, focus trapping, positioning.

User wants a third direction beyond either of those: the **same** `Select` component opening as a dropdown on desktop and as a **bottom sheet** on mobile, composing § 24.10's `Sheet` with no additional work for the developer integrating `Select` — its external API doesn't change.

**Unblocked:** the user supplied the real design, `documentation/Tendril Select component.png` (§ 9a "Desktop — anchored combobox, ≥768px", § 9b "Mobile — bottom sheet, <768px", § 9c "Anatomy and spec"). Not yet implemented — this is design intake only; §24.10 (`Sheet`) was revised against this artboard's § 9c first (see its entry above) since that dependency needed to be current before this task starts for real.

**What the artboard specifies, for whoever picks this up:**
- Breakpoint is `min-width: 768px` — a media query in the component itself, not a token (per the artboard's own footer note: "the presentation switch itself is not a token"), with the same option list and the same selection callback behind both presentations
- Single selection, no search field, text-only rows for now — row is a 3-slot grid (leading/label/trailing) at a fixed height so an icon or second line can land later without changing it
- Desktop: menu anchored under the trigger, `--radius-lg` (22px) with 6px padding so `--radius-md` (16px) rows sit concentric — an explicit, deliberate divergence from § 3.4's original 22px-menu/12px-row pairing; rows are 40px, capped at 5.5 visible rows (238px) so a partial row hints more below, native scrollbar; selected row is `--color-primary-tint` fill/`--color-primary` text/trailing check, hover is plain `--color-bg-page` (the tint belongs to selection only, not hover)
- Mobile: composes `Sheet` (see § 24.10's revision) — rows go to 52px (above the 44px floor) on touch; row tap both selects and dismisses
- `--select-border-hover` (`--color-text-disabled`) and `--select-option-bg-hover` (`--color-bg-page`) are both new roles not in § 3.4's original block
- Caret is the app's own glyph at 10px, rotating 180° on open over `--motion-fast`
- Artboard's own open offer, not yet taken: icon/two-line row variants for § 9c, or a keyboard-interaction map for the combobox — ask for these if/when needed rather than inventing them now

- [x] Decided the responsive-switch mechanism: a real JS branch between two genuinely different JSX trees (not a CSS-only visibility toggle), since the two presentations are structurally different — an absolutely-positioned menu vs. composing `Sheet`'s own backdrop/focus/Escape machinery — not just restyled
- [x] **Correction after user review:** first pass measured `window.matchMedia('(min-width: 768px)')` — the browser *viewport*, not `Select`'s own rendered width, so a `Select` squeezed into a narrow column on an otherwise-wide screen would have kept rendering the desktop menu. The artboard's own "min-width: 768px" line reads as a viewport media query out of context, but the actual intent (confirmed by the user) is container-based. Replaced `useIsDesktopViewport()` with `useIsWideContainer(ref)` (`components/Select/useIsWideContainer.ts`) — a `ResizeObserver` on `Select`'s own wrapper element (`useLayoutEffect`, to size before first paint rather than flash mobile-then-desktop). Colocated in `Select`'s own folder rather than a shared `src/hooks/` location — no second consumer exists yet, and the repo's existing hooks (`useTheme`, `useTokenValue`) are already colocated with their one owner, not centralized. Added a `NarrowContainer` story (a 320px-wide wrapper inside the normal full-width canvas) specifically to make this verifiable in Storybook, since the previous viewport-toolbar-based approach couldn't actually exercise the "narrow container, wide screen" case at all. `Select`'s external API (`options`/`value`/`onChange`/`label`/`placeholder`/`disabled`) is unchanged, confirmed by `TaskCreationForm.tsx`'s context picker (the one real call site) needing zero code changes
- [x] **Correction after user review:** selected-row label read as `font-weight: 600` in the first pass; the artboard's anatomy section explicitly says "label in `--color-primary` at 500" — fixed to 500
- [x] **Finding, changes the plan above:** since `Select`'s mobile branch composes `<Sheet>` as a real React component rather than restyling sheet-shaped markup of its own, it never needs `--select-sheet-*`/`--select-grabber-*`/`--select-scrim` tokens at all — `Sheet`'s own `Sheet.module.css` already applies `--sheet-*` to the chrome it renders, and `Select.module.css` never touches that DOM. This isn't a rule-6 violation (there's no second CSS module referencing the first's tokens - there's no second CSS module involved at all for that chrome), so the planned token duplication was unnecessary; dropped it. `Select`'s own Layer-3 group covers only the trigger, the desktop menu, and the option rows (which the mobile branch also uses, passed as `Sheet`'s `children`)
- [x] Expand `--select-*` into the full Layer-3 block, replacing § 3.4's original block entirely — merged the artboard's abbreviated "new/changed" table with § 3.4's original full block for the properties the artboard didn't restate (`--select-bg-disabled`, `--select-fg-disabled`, `--select-label-fg`), plus new `--select-empty-*`/`--select-skeleton-*` tokens (not in either spec - needed once the empty/loading states below were built, no artboard token reference existed for them, derived from `Card`'s own title/meta text-role pattern and its `Skeleton` story's plain-bar treatment respectively, since the real animated `Skeleton` primitive is still §24.11, not yet built)
- [x] **Finding:** while adding `Select`'s Layer-3 group, discovered `layer3.test.ts`'s group-discovery regex silently skips any group whose header comment spans multiple lines - it never matches `/* Name — components/Dir` when free text and a line break follow before the closing `*/`. This wasn't just a risk for the new `Select` group: `ConfirmDialog`'s existing header (written in §24.10... actually §12) has always been multi-line, meaning `ConfirmDialog` has been silently absent from every `layer3.test.ts` assertion since it was created - the guardrail was never actually checking it. Fixed both by splitting the header into a clean single-line `/* Name — components/Dir */` followed by the explanatory prose as its own separate comment - `ConfirmDialog`'s CSS turned out already clean (no failures surfaced). Test count went 27 → 31 (2 new groups × 2 assertions) confirming both are now genuinely checked. Did not fix the regex itself (out of scope) - a handful of older groups (`NavBar`, `FAB`, `Carousel`, `Button`, `TextInput`, `Card`, `Radio`, `Switch`, `Chip`) still get a garbled *label* in their test descriptions from unrelated later inline comments bleeding into the match, but their `dir` capture (the part that actually gates the assertions) is unaffected - cosmetic only, left alone
- [x] Simplified the artboard's "three-slot grid (leading/label/trailing)" row to two slots (label + trailing checkmark) - the leading icon slot has no current content and no committed design (the artboard's own closing note offers icon/two-line variants only if asked for later), so reserving a column for it now would be exactly the "design for a hypothetical future requirement" CLAUDE.md's minimal-footprint guidance warns against. Adding a leading slot later doesn't risk reflowing anything already built, since row height is set by `--select-option-height`/`-touch`, not by which slots are populated
- [x] Kept the previous native-`<select>` behavior of `placeholder` as a real selectable row (picking it clears the value), not just a hint - the artboard doesn't show this state explicitly but the existing call site (`TaskCreationForm`'s "No context" option) depends on it
- [x] Added `loading?: boolean` and `emptyTitle?`/`emptyDescription?` props to cover the artboard's empty ("No lists yet" card, § 9a/§9b) and loading (three skeleton bars) states, shown in place of the option list in both presentations - not in the original four-prop set, but the artboard explicitly mocks both states and they weren't reachable any other way. Empty text is caller-supplied (defaults to a generic "Nothing to choose from") rather than hardcoded, since "No lists yet" is specific to one call site's domain (`TaskCreationForm`'s list/context picker) and a primitive in `src/components/` can't know that copy
- [x] Built the desktop anchored-combobox presentation: absolutely-positioned menu (`top: 100%` of the trigger's own container, `--space-1` gap), `aria-activedescendant` keyboard pattern (focus stays on the trigger the whole time; Up/Down move a highlighted index, Enter/Space selects, Escape/outside-click/Tab close) rather than moving real DOM focus onto each option - the standard ARIA combobox approach, and simpler than focus-trapping a `role="option"` list that was never meant to be individually tabbable
- [x] Built the mobile presentation composing `<Sheet open title={label}>`, passing the same row-list renderer (touch-height variant) as `Sheet`'s `children`; a row tap calls `onChange` then `onClose` together, matching "tap selects and dismisses"
- [x] Fixed `Select.stories.tsx`'s pre-existing `@storybook/react` import (should be `@storybook/react-vite`, same defect flagged elsewhere in this file for other `.stories.tsx` files) while rewriting it
- [x] Stories: Default, WithPlaceholder, Focused and Open (both via the same ref-based programmatic-click/focus wrapper `TextInput.stories.tsx` established, not a hidden prop), LongList (7 options, exercises the 5.5-row scroll cap), Empty, Loading, Disabled, NarrowContainer (see the correction above — proves the switch tracks container width, not viewport width). No dedicated `Hover` story - `:hover` can't be reliably simulated outside a real pointer, consistent with no other component in this repo attempting one. Dropped the originally-added `meta.parameters.viewport` custom sizes once the mechanism turned out container-based, not viewport-based — they'd have demonstrated the wrong thing
- [x] **Correction after user review:** the option row's selected-label weight and the trigger's own label treatment both read wrong against the artboard:
  - Selected row was `font-weight: 600`; the anatomy note explicitly says "label in `--color-primary` at 500" — fixed to 500
  - `--select-label-size`/`--select-label-fg` were `--font-size-micro` (11px)/`--color-text-body`, following the anatomy note's literal "11px/500" - but the artboard's actual rendered "List" label is bold and body-sized, not a tiny muted caption. This is the exact same tension `TextInput`'s own redesign (§ 24.2) already hit and resolved against the same artboard set: the small annotation captions use `--font-size-micro`, but a real field label doesn't. Fixed to `--font-size-label`/`--color-text-strong`, matching `--input-label-*`'s already-corrected values exactly (weight was already 500, matching `TextInput`'s label - only the size/color tokens were wrong)
- [x] **Correction after user review:** the desktop menu's long-list scroll had no indication of overflow beyond an OS-default scrollbar (easy to miss, and on the mobile Sheet path there's no "peek row" cut at all - see § 24.10's parallel fix on `Sheet` for why the sheet needed its own version of this). Added `--select-scrollbar-thumb`/`--select-scrollbar-radius` and a persistent styled scrollbar on `.menu`, same treatment as `Sheet`'s `.body` fix
- [x] **Root cause found via live Storybook inspection (user shared a URL), not guessing from screenshots:** the trigger was rendering at ~18px tall instead of 48px - a real bug, not a styling nuance. Traced via `getComputedStyle`/`document.styleSheets` in the running page: `--select-height` resolved to an empty string even on `:root` itself, while every other `--select-*` token declared after it in the same block resolved fine. Cause: the group's own explanatory comment contained the prose `no --select-sheet-*/--select-grabber-*` - the `*/` in the middle of that sentence is a literal CSS comment-close token, so it terminated the `/* ... */` comment early. Everything from that point until the parser resynchronized (landing cleanly at the next real declaration, `--select-radius`) was silently dropped by the browser - which happened to be exactly the `--select-height` line, sitting right at the boundary. Fixed by rewording the comment (`--select-sheet-*` or `--select-grabber-*`, no adjacent `-*/`) so no literal `*/` appears in prose; grepped the rest of `tokens.css` for the same `[A-Za-z0-9_-]*/` shape and found no other occurrence. This is very likely also why the "still off" trigger read wrong in the previous review round - a collapsed-height trigger would look broken regardless of what else was fixed
- [x] Review in Storybook — **approved**
- [x] **Follow-up after § 24.11 (`Skeleton`) landed:** `Select`'s `loading` state predated `Skeleton` and had its own bespoke, non-shimmering bars (`--select-skeleton-bg`/`--select-skeleton-radius`, a static `.skeletonBar` in `Select.module.css`) - exactly the duplication `Skeleton` exists to prevent. Migrated `Select`'s three loading rows onto `<Skeleton width="…" height="12px" />` and deleted the duplicate tokens/CSS; kept `.skeletonList` (pure layout, no color/radius) the same way `ResultsSlide` did

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

## 28. Task status transition audit (`transition-audit`)

Prompted by the snooze bug found and fixed in §12 (`POST /api/tasks/:id/snooze` set `lastSuggestedAt` but left `status: "in_progress"` untouched, so the in-progress block never actually cleared — silently contradicting `ARCHITECTURE.md`'s own User Flow doc, which lists snooze as a way to resolve the block). Audit every action that changes a task's status or otherwise affects the in-progress block, to catch similar gaps before they ship rather than after.

- [ ] `Start` (`PUT /api/tasks/:id` → `status: "in_progress"`, wired from `TaskDetailPage` and `RankingPage.handleStartTask`) — confirm every call site is blocked when another task is already `in_progress`, and that no path can leave two tasks `in_progress` at once
- [ ] `Snooze` (`POST /api/tasks/:id/snooze`) — verify the fix end-to-end from both `RankingPage` and `InProgressPage`: the block clears on the next `/api/rank` call, and the task is correctly suppressed for the recency window afterward rather than immediately re-suggested
- [ ] `Complete` (`PUT /api/tasks/:id` → `status: "completed"`) — verify completing the in-progress task clears the block immediately on the next `/api/rank` call; re-check once §13 (Cascading Task Completion) lands, since a cascade could interact with this
- [ ] `Delete` (`DELETE /api/tasks/:id`, both `childAction` values, with and without children) — verify deleting the currently in-progress task clears the block, and that no child is left with a `parentId` pointing at a deleted task
- [ ] Record the resulting status-transition expectations (status before → action → status after, and whether the in-progress block clears) in `ARCHITECTURE.md`'s Task status section, so future actions can be checked against a written table instead of re-discovered by testing

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

**Trigger:** production deployment is actually being planned, or the "single dev user" assumption elsewhere in the task files stops holding.

---

## 36. Naming consistency lint (`priori-name-lint`)

Prompted by §10.5 (the loading screen still said "Priori"). Add a check that catches this class of drift automatically instead of relying on it being noticed by eye.

**Updated scope:** the app's name is currently the placeholder "TempAppName" (see `CLAUDE.md`'s Naming section — "Tendril" turned out to already be in use elsewhere and is being replaced). The lint should flag both stray "Priori" and stray "Tendril" as product-name text in `apps/web`, outside their correct uses: "Priori Engine" (the backend, unaffected by the rename) and internal identifiers deliberately left alone by the TempAppName pass — the `--tendril-*` CSS custom-property prefix, the `Tendril.tsx` icon component and its import, and the `'tendril-theme'` localStorage key. §10.5 and the `LoadingScreen.tsx` wordmark/label are already fixed (now read "TempAppName"), so the check should start clean today.

- [ ] Add a check (a small Node script, or a `grep`-based check wired into an existing lint/CI step) that scans `apps/web` for the standalone words "Priori" and "Tendril" (case-insensitive, word-boundary match so "Priority"/"prioritize" aren't false positives) and allow-lists "Priori Engine" plus the specific internal identifiers listed above
- [ ] Decide whether it runs as part of `npm run typecheck`/`npm test`, a dedicated `npm run lint:naming` script, or a pre-commit hook
- [ ] Fix any occurrence the check turns up in `apps/web` (rename to "TempAppName", except the allow-listed cases)
- [ ] Once §41 (real-name integration) lands, update the check's target string from "TempAppName" to the real name

---

## 37. Alpha Readiness — Friends & Family Deploy (`alpha-readiness`)

Collects everything blocking, or worth doing before, inviting friends and family to a live Alpha. This is a dashboard cross-referencing other sections, not a separate source of truth — check a line here once its target section/item is actually done there.

**Must resolve — existing work:**
- [x] §10 Known Bugs — every item closed (§10.1 duplicate context option, §10.3 Carousel dot lag, and §10.5 "Priori" on the loading screen are all resolved, see `TASKS-DONE.md` § 10)
- [ ] §34 Auth — friends/family need individual accounts and separated data, not the single dev user
- [ ] §36 (+ §10.5) Naming consistency lint — clean before external eyes see it

**Should do — existing deferred work whose trigger just got met by "we're deploying":**
- [ ] §16's "Gate or remove `/docs` and `/openapi.yaml`" bullet — its stated trigger ("`apps/api` is deployed anywhere reachable outside localhost") is now met
- [ ] §16's "Revisit CORS" bullet (`Access-Control-Allow-Origin` hardcoded to `http://localhost:5173` in `lib/http.ts`) — same trigger
- [ ] §32 Analytics and error tracking — its trigger ("production deployment is actually being planned") is now met; at minimum decide the lightweight version so testers' failures are visible somewhere instead of only discoverable by asking them

**Nice to have, not blocking:**
- [ ] §35 Onboarding sequence — good first impression for people who've never seen the app, but the app is usable without it
- [ ] §18 App design review — worth a pass if time allows
- [ ] §31 General failed-backend-call handling — real testers will hit real failures; today only `TasksPage` has bespoke handling

**New work — see §38, §39:**
- [ ] §38 Deployment & production readiness
- [ ] §39 Alpha access control

**Feedback loop (already in progress):**
- [ ] Publish the "Priori Beta Feedback" Google Form (currently a draft) — leave its title/questions saying "Priori" for now rather than relabeling to the "TempAppName" placeholder; rename once for real once §41 lands with an actual name, instead of twice
- [ ] §40 In-app feedback link — decided: testers reach the form via a button in the app, not a manually-sent link

**Worth deciding, not yet scoped as its own task:**
- [ ] Minimal privacy/data notice for testers — informal is probably fine for friends & family, but worth deciding explicitly rather than skipping silently, since real (if informal) personal task data will be stored
- [ ] Backup/durability expectations for the production DB, now that it holds real user data instead of only seed/dev data

---

## 38. Deployment & production readiness (`alpha-deployment`)

Nothing in the repo currently deploys anywhere — confirmed by inspection: no Dockerfile, no CI/CD config, no hosting config, and no `.env` file at any level. Per `CLAUDE.md`'s "smallest footprint" guidance, this needs explicit decisions before implementation, not a default choice.

**Findings from the current codebase:**
- `apps/api/src/db/index.ts` falls back to `postgresql://localhost/priori_dev` when `DATABASE_URL` isn't set — no other env-driven config exists anywhere in the repo
- `apps/api/src/server.ts` hardcodes `PORT = 3001` and only has a `dev` script (`tsx watch`) — no compiled production start script
- `apps/web`'s services call relative paths (`/api/tasks`, etc.), which only resolve today via `vite.config.ts`'s dev-only proxy to `localhost:3001` — nothing serves API and web from the same origin in production, and nothing proxies between them
- `apps/api/src/lib/http.ts` hardcodes `Access-Control-Allow-Origin` to `http://localhost:5173` (tracked in §16, trigger now met — see §37)

**Decisions needed first:**
- [ ] Choose a hosting approach for `apps/api` (e.g. a small VM/PaaS like Render/Fly/Railway, or a serverless adapter) and for `apps/web` (static hosting — Vercel/Netlify/Cloudflare Pages — or served by the same host as the API)
- [ ] Choose a production Postgres (managed instance vs. self-hosted) — separate from the local dev DB `priori_dev`
- [ ] Decide how the web app reaches the API in production: same-origin reverse proxy (keeps the existing relative-path `fetch` calls unchanged) vs. an absolute API base URL baked in at build time (requiring every `fetch()` call site to be updated)

**Implementation, once the above is decided:**
- [ ] Add environment-driven config for whatever the chosen host needs (DB connection string, port, CORS origin) — currently only `DATABASE_URL` is env-driven
- [ ] Add a production build/start path for `apps/api` (compiled output + a `start` script, not `tsx watch`)
- [ ] Run `drizzle-kit migrate` against the production DB as part of the deploy step
- [ ] Wire the real CORS origin and gate `/docs`/`/openapi.yaml` per §16's now-triggered items
- [ ] Basic smoke test against the deployed instance before sending out invites (sign up, rank a task, complete a task, at minimum)
- [ ] Update `ARCHITECTURE.md` recording the hosting choice and the API-reachability decision

---

## 39. Alpha access control (`alpha-access-control`)

**Depends on:** §34 (Auth) — this decides how auth is gated for the alpha, not whether auth exists.

Once auth exists, decide whether the Alpha is open signup or invite-only. An unlisted-but-public signup page is easy to build but means anyone who finds the URL can create an account and see the same unfinished app; friends-and-family testing usually wants a tighter gate.

- [ ] Decide the access model: invite codes, an allowlist of email addresses, or accept open signup on an unlisted URL
- [ ] If gated: implement the chosen mechanism (e.g. an `invited_emails` table checked at signup, or a shared invite code)
- [ ] Decide what a tester sees if they're not invited (a clear "alpha access only" message, not a generic error)
- [ ] Update `ARCHITECTURE.md` recording the decision

---

## 52. AI integration (`ai-integration`)

HLD: `documentation/techDesign/ai-integration/hld.md`. **Has an HLD: its LLD must be written and approved before implementation starts.** Project-wide foundation for AI features: Claude via `@anthropic-ai/sdk` in one `apps/api/src/ai/` module, structured output only (no tools), user input treated as data never instructions, opt-in consent with a Settings toggle, a strictly enforced per-user allowance, and metadata-only usage logging. First consumer: § 53.

**Blocked by:** § 34 (Auth). The allowance and consent are per user. The pricing research below is not blocked and can start now.

- [ ] **First: research AI pricing.** Per-model token prices, what one task-drafting call costs (typical and worst-case input, `max_tokens` output, with and without prompt caching), the Console's spend limits, and what an allowance per user per period would cost at expected usage. Leaning towards a low-cost model, since task drafting is a fairly simple extraction job; the research should confirm it's enough. Write the findings into the AI integration doc
- [ ] Decide the allowance period (daily, monthly or rolling) and size, from the pricing research
- [ ] Decide the app's single model, from the pricing research and the first feature's evaluation set (starting with the low-cost candidate)
- [ ] Check the Anthropic organisation's data retention settings, and whether the consent notice should mention them
- [ ] Write the LLD, `documentation/techDesign/ai-integration/lld.md` (API signatures, data objects, DB table structures, UI components), using the decisions above, and get it approved. Implementation starts only after approval
- [ ] Add `@anthropic-ai/sdk` to `apps/api`; record the provider decision in `documentation/ARCHITECTURE.md`
- [ ] `src/ai/client.ts`, `allowance.ts`, `inputHygiene.ts`
- [ ] DB migration: `users.ai_enabled`, `users.ai_consented_at`, table `ai_usage_events`
- [ ] `routes/ai.ts`: `GET /api/ai/status`, `PATCH /api/ai/settings`; documented in `openapi.yaml`
- [ ] Real-DB tests for allowance: concurrent reservations never exceed the limit, refunds on provider error, period boundaries
- [ ] Web: `aiService.ts`, `useAiStatus`, `AllowanceIndicator`, `AiConsentNotice`, with Storybook stories
- [ ] "Use AI" toggle in Settings. Needs a Settings page (§ 23 and § 44 are deferred); build a minimal one if neither exists yet
- [ ] Set a monthly spend limit in the Anthropic Console before any deployment (§ 38)

---

## 54. User provisioning: extract `provisionDefaultContexts` (`user-provisioning-impl`)

LLD: `documentation/techDesign/user-provisioning/lld.md`. The plan was written and archived under § 7 (`TASKS-DONE.md`), but never implemented: `seed.ts` still inlines the default-context insert, and `provisionDefaultContexts` doesn't exist. Per the design's Verification section, the extraction can land on its own ahead of auth. § 34 then wires it into the signup path.

- [ ] Add `apps/api/src/db/provisioning.ts` with `DEFAULT_CONTEXTS` and `provisionDefaultContexts(db, userId)`. The design's sample insert predates the `slide_index` column: assign `slideIndex` the way `seed.ts` does today, and keep it consistent with the slide-index invariant `POST /api/contexts` enforces (§ 14)
- [ ] Make `seed.ts` a thin caller: insert the user, check the row came back, call `provisionDefaultContexts`
- [ ] Real-DB tests in `apps/api/test/db/provisioning.test.ts`: a fresh user gets all four default contexts; calling it twice doesn't duplicate rows; another user's contexts are untouched
- [ ] Manual check: `npm run db:seed` on a clean DB gives the same result as today
- [ ] Update the design's Approach snippet to include `slideIndex`
