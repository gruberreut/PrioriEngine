# Feature tasks

Features: the goal is a behaviour users see. Read this file only when `TASKS-BUGS.md` and `TASKS-TECH.md` have no open, unblocked items, or when asked (see `CLAUDE.md` § Task Tracking). Before starting a section here, check `TASKS-BUGS.md` and `TASKS-TECH.md` for open items in the same area and do those first, or ask.

**Priority order:** §50 (priority signal quality) first. §35 (Onboarding sequence) is relatively high priority: take it up once its dependency, §34 (Auth), is done, ahead of lower-numbered sections that are still open. Otherwise, work through the sections in order.

Section numbers are shared with `TASKS-BUGS.md`, `TASKS-TECH.md` and `TASKS-DONE.md`, and never reused. A number missing here is in one of those files.

---

## 50. Priority signal quality (`priority-signal`) — high priority

Filed out of order, right after § 48, because it's high priority; the section number doesn't reflect that. Came up while designing AI task input (`documentation/techDesign/ai-task-input/hld.md`).

The ranking is only as good as its inputs, and priority is its main lever. If new tasks always get a middle default, users have little reason to set priority, and ranking ends up driven mostly by energy and duration fit. This touches the core of the product. Making things worse, the ranker doesn't use due dates at all: its urgency term is days since `priorityUpdatedAt`, so a task due tomorrow scores the same as one with no deadline.

Interim in the AI task input design: the AI infers priority from cues in the text and relative to the user's existing tasks, records where the value came from, and the review screen shows priority as a one-tap control. This section decides the long-term approach.

- [ ] Record each task's priority source (`stated | inferred | default`) so tasks with no real priority signal can be found
- [ ] Add due-date proximity to the ranking score, and decide how it combines with priority and urgency aging
- [ ] Decide how the AI infers priority: explicit cues (urgent, ASAP, someday), deadlines, consequences, people waiting, and placement relative to the user's existing tasks
- [ ] Explore comparative prioritisation ("is X more important than Y?") as a quick triage for tasks still on a default priority, and when to prompt for it
- [ ] Decide the default priority and duration used when nothing is stated or inferred, as one source of truth for the form, AI drafts and the engine fallback (today: form 3 / 20 min, engine 5 / 30 min, `resolveTask.ts` 30 min)
- [ ] Coordinate with § 49 (parent and child priorities)
- [ ] Record the decisions in `documentation/ARCHITECTURE.md`

---

## 13. Cascading Task Completion (`cascading-completion`)

**Depends on:** section 10.1 (`groupTasksByParent` primitive), section 12 (Complete action wired up).

When completing a task makes it the last non-completed direct child of its parent, the parent should automatically be marked `completed` too — and the check repeats up the ancestor chain, so finishing the last subproject under a project completes the project as well. The user finds out via accomplishment feedback after the fact, not a confirmation prompt beforehand. This applies uniformly regardless of the parent's priority — a priority-10/recurring parent is not exempt, even though "ongoing" tasks are expected to keep gaining children over time.

### Backend

- [x] `PUT /api/tasks/:id` — when a status update results in `status: "completed"`, after committing, walk up the `parentId` chain using `groupTasksByParent`: at each level, check whether all direct children of that parent now have `status: "completed"`; if so, mark that parent `completed` too and continue to its parent; stop at the first parent with an incomplete child, or when there's no parent
- [x] Run the cascade in the same DB transaction as the original status update, so a crash mid-cascade can't leave the tree half-completed
- [x] Response shape: `{ task: <updated>, autoCompletedAncestors: Task[] }` — empty array when nothing cascaded
- [x] Update `openapi.yaml` for the new response shape
- [x] Update `ARCHITECTURE.md` recording this as a decision: automatic cascade (no per-level confirmation), applies uniformly regardless of priority/recurrence
- [x] Real-DB integration tests: completing the last leaf under a parent completes the parent; completing the last remaining subproject under a project cascades two levels; completing a task with incomplete siblings does not cascade; completing the last child of a priority-10/recurring parent still auto-completes it

### Frontend

- [x] `taskService.ts` — `updateTask`'s return type gains `autoCompletedAncestors`
- [ ] Surface accomplishment feedback when `autoCompletedAncestors` is non-empty (e.g. "You also finished 'Home Renovation'!"), in addition to the existing per-task completion feedback — exact placement (toast vs. banner vs. dedicated screen) ties into `ARCHITECTURE.md`'s planned "brief celebration" step, which isn't built yet and needs its own design pass before this can be wired up

---

## 15. Offline sync (`offline-sync`) — placeholder

Deferred. Will cover: Dexie.js in `apps/web`; local IndexedDB schema mirroring the server schema; client-side UUID generation so the same id is used locally and in Postgres; a sync loop that drains `syncStatus: "pending"` writes to the API on the `online` event. Failed or offline mutations from the client data store (§ 56) move to an outbox here: actions queued in order, retried, and idempotent by client id. Until then, the store (`documentation/techDesign/client-data-store/lld.md` § 4 and § 6) pauses mutations made offline and sends them on reconnect, but they live only in memory and are lost on a reload, and so is the map of contexts merged after `name_taken`. Ranking results are computed on the server and never shown stale, so the ranking page doesn't work offline. This section decides how ranking works offline. § 60 (online and offline state) comes first: it shows the user the state and settles the store's behaviour by connectivity.

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
- [x] Design the gate as an ordered sequence of async steps; each step can pass through, redirect, or block until resolved. **Sequential-by-default is a deliberate choice, not an oversight** (discussed in conversation): the known steps (auth → authz → in-progress check) each depend on the previous one's outcome, so nothing here is actually safe to parallelize today. If a future step turns out to be genuinely independent, treat that as its own enhancement to the runner rather than assuming strict sequencing still holds — flagged with a matching comment in `LoadingGate.tsx` so it isn't forgotten. Implemented as `GateStep = () => Promise<"continue" | { redirect: string }>`, an ordered `GATE_STEPS` array, and `runGateSteps` looping until a step redirects; superseded an earlier "defer this, not worth the complexity yet" note in `ARCHITECTURE.md` once the actual shape turned out to be three small functions and a loop
- [x] Add a placeholder authentication step (no-op today; ties into section 7's deferred "User provisioning" design work), just to give the sequence the right shape for when auth exists
- [x] Add a placeholder authorization step (no-op today), same reasoning
- [x] Show a loading state while steps are in flight
- [x] Update `ARCHITECTURE.md` documenting the gate as the app's bootstrap sequence
- [ ] Replace `LoadingScreen`'s placeholder visual design (enlarged `Tendril` icon + wordmark on a plain background) with a considered design once the app's visual language for this screen is decided

---

## 23. Theme settings screen (`theme-settings-screen`) — deferred, low priority

Since § 22.4, theme has no manual UI: `auto` picks light/dark by time of day (`timeOfDayTheme()` in `useTheme.ts`), and the only override is `window.switchTheme('light' | 'dark' | 'auto')` from the browser console. Build a real settings screen so a user can set this without the console.

- [ ] Add a `/settings` route and page
- [ ] `ThemeToggle` no longer exists — deleted in § 24.8 once it was confirmed to have zero real callers (it had briefly become just an unused wrapper around `SplitGroup`). Build the control fresh here instead of reviving it, and decide first: the tinted-track-with-inset-pill construction in `documentation/DESIGN-TOKENS-BY-COMPONENT.md` § 3.3 (never actually built — that's what a theme toggle was originally spec'd to look like, distinct from `SplitGroup`'s joined-seam shape) vs. just using `SplitGroup` directly for simplicity. Either way, wire it to `useTheme`'s `setTheme`
- [ ] Add a way to reach `/settings` from the app — `NavBar` has no slot for it currently; decide whether it gets one or the entry point is elsewhere
- [ ] Reconsider `timeOfDayTheme()`'s fixed 6am–6pm split at the same time — e.g. treat `Auto` as "time-of-day split" only when the user hasn't explicitly picked Light/Dark, or consider deriving real sunrise/sunset if that's ever worth the complexity
- [ ] Nice to have: pick light/dark from the phone's own indication of being in light or darkness instead of (or alongside) the wall-clock split. Options to weigh: the OS appearance setting via `prefers-color-scheme` (widely supported; phones can switch it automatically), or the ambient light sensor directly (`AmbientLightSensor` web API: limited browser support, so treat it as progressive enhancement only)

**Trigger:** whenever a settings screen is needed for anything else, or the `window.switchTheme()` console workaround becomes annoying enough to fix.

---

## 26. Completed tasks in the tasks list (`completed-tasks-list`)

**Current state (confirmed by reading the code):** `queryTasks(db, userId, options)` (`apps/api/src/db/queries.ts`) only filters by status when a caller passes `options.status` — `GET /api/tasks` with no `?status=` query param returns tasks of every status, completed included. Both `TasksPage.tsx` and `TaskDetailPage.tsx` call `getTasks()` with no status argument, so completed tasks are already present in the tree today. `TaskTreeItem.tsx` uses each descendant's `status === "completed"` only to compute a parent's aggregate `completedMinutes / totalMinutes` progress line — a completed row itself has no visual marking (no strikethrough, badge, dimming) distinguishing it from a pending one.

Decide the intended UX for completed tasks inside a project tree — per-user request, this shouldn't default to silently hiding them, since the user may want to view completed tasks in the context of their project (e.g. reviewing what's been done on a project so far).

**Growth concern:** because `GET /api/tasks` returns every status with no pagination, the response grows unbounded as a user accumulates completed tasks over time — every `TasksPage`/`TaskDetailPage` load re-fetches the user's entire completed history whether or not it's shown. This pushes toward filtering completed tasks out **server-side by default** (not a client-side filter over an ever-growing unfiltered payload) and fetching them on demand — e.g. scoped to one project/parent, possibly paginated — only when the user actually asks to see them, rather than loading them eagerly with everything else.

- [ ] Decide default visibility. Candidate approach: default `GET /api/tasks` load includes a completed *leaf* task only when it belongs to an *active* project (i.e. has an ancestor project that is not itself fully completed) — so recently-finished work still shows in context under a project the user is actively working — but excludes (a) completed tasks with no parent (standalone, not part of any project) and (b) entire projects that are fully completed (root + all descendants `completed`, per §13's cascade). This bounds default load growth to "active project" completions rather than the full historical set, while still answering the user's "view completed in project context" ask for the common case.
- [ ] If the above is adopted, decide the query shape needed to express it server-side: e.g. `queryTasks` needs to know, per row, whether its root ancestor project is fully completed (likely via `groupTasksByParent`, walking each candidate row's ancestor chain, or precomputing a `projectCompleted` flag) — this is nontrivial to do efficiently in one query and needs its own design pass, not just a `WHERE status != 'completed'`
- [ ] Decide how the user reaches the excluded set (standalone completed tasks + fully-completed projects) — two options raised, not mutually exclusive: (a) a checkbox/toggle in `TasksPage` that re-fetches with completed+archived projects included; (b) a dedicated Archive page/route for browsing completed tasks and completed projects separately from the active list. Pick one for v1 or decide both are worth building and sequence them
- [ ] Whichever fetch-on-demand shape is chosen (toggle vs. archive page), decide the query shape: `?status=completed&parentId=` for a scoped per-project fetch, a dedicated endpoint, or pagination (`limit`/`cursor`) if a single project can itself accumulate many completed tasks over time
- [x] Add a visual indicator for `status: "completed"` on individual task rows in `TaskTreeItem` (and any other place a completed leaf task can appear in a list, e.g. `TaskCard`) — e.g. strikethrough title, muted color, checkmark badge — using existing design tokens, not new literals. Resolved: recessed background (`--color-bg-disabled`) + dimmed text (`--color-text-disabled`) + a `CheckCircle` badge (reusing the icon already used for the Complete action) on both `TaskCard` (leaf rows) and `TaskTreeItem`'s own parent/project row markup; actions are hidden on a completed task for now (delete included) per explicit user direction, pending a possible future "reopen" action
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

## 33. Localization support (`i18n-localization`)

Add support for major European languages plus Hebrew. Hebrew is RTL, which touches layout (not just string translation) — this connects directly to the **Carousel swipe direction** item under Open Issues below, which already flags that swipe direction may need to follow locale direction; resolve that item as part of this section rather than separately.

No i18n library, translation source, or language list is chosen yet — per `CLAUDE.md`'s "smallest footprint" guidance, decide these before implementation starts rather than defaulting to a large framework.

### Decisions needed first

- [ ] Choose an i18n library for `apps/web` (e.g. `react-i18next`, `react-intl`, or a minimal custom key-lookup hook) — weigh against actual current needs (no plurals/date-formatting complexity yet beyond what's already hand-rolled) vs. not foreclosing richer formatting later
- [ ] Confirm the language list: major European languages — candidates are English (default), Spanish, French, German, Italian, Portuguese — plus Hebrew. Confirm the exact set and priority order with the user before translating strings
- [ ] Decide where translation strings live (JSON per locale under e.g. `apps/web/src/locales/`) and the key structure (flat vs. namespaced per feature)
- [ ] Decide the source of translations — machine-translated first pass vs. professionally translated, and who reviews Hebrew specifically since it's the one non-Latin-script, RTL entry

### RTL (Hebrew)

- [ ] Decide the RTL mechanism: `dir="rtl"` on `<html>`/root driven by active locale, plus CSS logical properties (`margin-inline-start` etc.) instead of physical `left`/`right` in component CSS going forward
- [ ] Audit existing components/pages for hardcoded physical-direction CSS (`left`/`right`, `margin-left`/`margin-right`, transforms) that would break under RTL — the design-token layers (`tokens.css`) and any migrated TempAppName primitives (§22/§24) are the first place to check since they're the newest, most consistently-built code
- [ ] Resolve the Carousel swipe-direction Open Issue as part of this: decide whether swipe direction flips with `dir` or stays fixed, and implement accordingly
- [ ] Verify date/number formatting (`priority_updated_at`, `due_date`, durations) renders correctly for Hebrew locale via the chosen i18n library rather than hand-rolled formatting

### Implementation

- [ ] Extract all user-facing strings currently hardcoded in `apps/web/src` components/pages into the chosen translation-key structure
- [ ] Add a locale-switching mechanism — decide whether this reuses the settings-screen placeholder from §23 (deferred) or needs its own entry point sooner
- [ ] Persist the user's chosen locale (localStorage for now, consistent with how theme preference is handled today; revisit if user accounts/§7's provisioning work lands first)
- [ ] Add Storybook coverage confirming at least one migrated component renders correctly in both LTR and RTL (per `CLAUDE.md`'s Storybook requirements, this isn't a new component but is a new cross-cutting rendering mode worth checking visually)
- [ ] Update `ARCHITECTURE.md` recording the i18n library choice, the RTL mechanism, and the rejected alternatives

---

## 34. Authentication (`auth-implementation`)

**Depends on:** the deferred "User provisioning" design (§7, archived — `documentation/techDesign/user-provisioning/lld.md`), written ahead of auth specifically so the provisioning shape would already be settled once this starts.

No auth approach (self-rolled sessions vs. a third-party provider, e.g. Auth0/Clerk/Supabase Auth) has been chosen yet. Per `CLAUDE.md`'s "smallest footprint" guidance, this is a real trade-off to raise explicitly rather than default into: a third-party provider is far less code but adds an external dependency and cost; self-rolled keeps the footprint small but is more to build and secure correctly.

- [ ] Decide the auth approach (provider vs. self-rolled) — raise the trade-off with the user before starting
- [ ] Implement sign-up / sign-in / session handling per the chosen approach
- [ ] Wire `provisionDefaultContexts` (§7, implemented in § 54) into the new-user path so every real signup gets its default contexts, same as `seed.ts`'s dev-user path
- [ ] Replace the loading gate's placeholder auth step (§19) with the real check
- [ ] Update `ARCHITECTURE.md` recording the auth approach chosen and why

---

## 35. Onboarding sequence (`onboarding-sequence`) — high priority

**Depends on:** §34 (Auth) — onboarding is the first thing a newly-authenticated user sees, so it needs a real signup/session to hook into.

A first-run sequence that explains what TempAppName is for and walks a new user through its initial setup/first actions. Not scoped yet — this task starts with UX definition, then a tech design pass, before any implementation begins.

### 1. Define the user experience

- [ ] Decide what the onboarding sequence needs to communicate (app purpose, how ranking/context/energy/time inputs work) and in what order
- [ ] Decide the screen-by-screen flow and content — how many steps, what each shows, and how a user exits/skips
- [ ] Decide whether onboarding also drives first real setup (e.g. creating initial contexts/tasks) or is purely explanatory, deferring setup to normal app use
- [ ] Get the flow reviewed/approved before tech design starts

### 2. Tech design

- [ ] Decide where onboarding hooks into the app — a step in the loading gate (§19) vs. a dedicated route reached right after signup
- [ ] Decide how "has completed onboarding" is tracked and persisted (a user-record flag vs. local storage) so it only shows once per user
- [ ] Decide the component/page structure for the approved flow
- [ ] Update `ARCHITECTURE.md` recording the approach

---

## 40. In-app feedback link (`feedback-link`)

**Depends on:** §37's feedback-loop item — the form needs to be published before this points anywhere real (it can stay titled "Priori" until §41 picks a real name — see §37).

Decided: testers reach the "Priori Beta Feedback" Google Form through a button inside the app, not a manually-sent link (see §37).

`NavBar.tsx` currently renders exactly two items (`Rank`, `Tasks`) from a `destinations` array, each an internal `NavLink`, centered with no other slot (the theme-toggle slot was removed in §22.4 — `justify-content: center`, nothing pushed to either side). A feedback link is an external, new-tab action, not a route — it doesn't fit the `destinations` array's internal-navigation shape as-is.

- [ ] Decide placement: a third, differently-styled entry in the `NavBar` (opens externally instead of routing) vs. a small separate icon button elsewhere vs. deferring to a future Settings screen (§23, not built, so not viable now)
- [ ] Decide the trigger's look — icon-only vs. icon+label — using the existing `Icon`/`Button` primitives (§24.1) rather than new one-off markup
- [ ] Opens the form URL in a new tab (`target="_blank" rel="noopener noreferrer"`); decide whether the URL is hardcoded in the component or pulled from env config (relevant once §38's environment-config work exists, in case the form URL differs per environment/cohort)
- [ ] Point it at the published form URL (post §37's "publish" item), not the current draft edit link
- [ ] Add Storybook coverage for the new entry point per `CLAUDE.md`'s Storybook requirement
- [ ] Review in Storybook — **approved**

---

## 41. Integrate the app's real name (`real-name-integration`)

"Tendril" turned out to already be in use by another app/company; a real replacement name hasn't been chosen yet. In the meantime, every user-facing mention of the app's name was swept to the placeholder **"TempAppName"** (`CLAUDE.md`'s Naming section, `LoadingScreen.tsx`, `Button.mdx`, `ARCHITECTURE.md`, `DESIGN-TOKENS-BY-COMPONENT.md`, and the relevant prose in the task files). This task is the follow-up once a real name lands — both applying it, and finishing the parts the placeholder pass deliberately deferred.

**Deliberately left untouched by the TempAppName pass** — the placeholder swap was user-facing text only, not internal identifiers, since renaming those twice (once to a placeholder, again to the real name) is wasted effort. This task does that rename for real, once, when there's a real name to land on:
- The `--tendril-*` CSS custom-property prefix — Layer 1 of the token system, 129 occurrences in `tokens.css` alone (`CLAUDE.md`'s Design tokens section, `documentation/DESIGN-TOKENS-BY-COMPONENT.md`)
- The `Tendril.tsx` icon component and its import (`LoadingScreen.tsx`, `NavBar.tsx`, `Button.stories.tsx`)
- The `'tendril-theme'` `localStorage` key (`useTheme.ts` and the duplicate inline copy in `index.html`'s anti-flash script) — changing the key resets any tester's already-stored theme preference unless handled (e.g. read the old key as a fallback once, or accept the reset for an alpha-stage audience)
- The two Tendril-named docs and the artboard image left alone (filenames, not just content) since renaming a file without a chosen name felt premature: `documentation/Tendril - color story migration plan.md` (~72 internal references, also skipped in the placeholder pass for the same reason), `documentation/Tendril components design.png`

**Also once a name is chosen:**
- [ ] Update `CLAUDE.md`'s Naming section from "unsettled, use TempAppName" to the real name, and state it as settled
- [ ] Sweep every "TempAppName" occurrence (the files listed above) to the real name
- [ ] Rename the internal identifiers listed above, handling the `localStorage` key migration decision
- [ ] Rename the two docs and the artboard image (`git mv`) and update the ~15 cross-references to their filenames in the task files, `TASKS-DONE.md` and `DESIGN-TOKENS-BY-COMPONENT.md`
- [ ] Update §36's naming-lint target string from "TempAppName" to the real name
- [ ] Rename the "Priori Beta Feedback" Google Form's title and question text (§37) — first real rename for the form, since it was deliberately left saying "Priori" through the TempAppName pass
- [ ] Decide whether repo-identity naming (`package.json`'s `"name": "priori"`, `README.md`) should also change, as a separate call from the in-app product name
- [ ] Storybook re-review isn't expected to be needed for the text/identifier rename itself, but confirm nothing visually regresses (e.g. the `Tendril.tsx` icon file, if renamed, still resolves everywhere it's imported)

---

## 42. Context lifecycle: rename and archive (`context-lifecycle`)

**Current state (confirmed by reading the code):** `apps/api/src/routes/contexts.ts` only implements `GET`/`POST /api/contexts` — there is no rename or delete endpoint, and no frontend surface to manage an existing context at all. The only client-side context-creation path is the inline "new context" flow inside `TaskCreationForm`.

**Decided rules (per conversation):**
- A context can be renamed at any time, regardless of what tasks it has — renaming only changes `contexts.name`, which doesn't affect any task's `context_id` reference, so there's no integrity concern.
- A context can only be **removed** when it has no `pending`/`in_progress` tasks attached (leaf or parent — any row with that `context_id`). If it has any non-completed task, the user can rename it but not remove it.
- "Removed" is a soft archive, not a SQL `DELETE`: the context row stays, gaining an `archived` flag. This keeps completed tasks' `context_id` valid (they stay attached to their real context for history/review) and avoids needing `ON DELETE SET NULL`/cascade behavior. An archived context is excluded from `GET /api/contexts`'s default response, so it drops out of the ranking carousel's context slides and the "new task" context picker.
- A context with zero tasks of any kind is trivially eligible for archive under the same "no pending/in_progress" rule — no separate empty-vs-completed-only case needed.

Not scoped yet beyond the rules above — this task starts with UX definition, then a tech design pass, before any implementation begins (same shape as §35).

### 1. Define the user experience

- [ ] Decide where context management (rename, archive) lives in the UI — a new dedicated screen listing all contexts, a panel inside `TasksPage`, or somewhere else
- [ ] Decide the rename flow (inline edit vs. a form/dialog) and the archive flow (one tap vs. a confirmation step, and what the confirmation says when it's disabled/explains why archiving is blocked)
- [ ] Decide how a blocked archive attempt is communicated (a context with pending/in_progress tasks) — disabled action with an explanation, vs. an attempt-then-error
- [ ] Decide whether an archived context is recoverable (unarchive) or one-way for now — deferred, not decided
- [ ] Creating a context with an archived context's name is handled in § 58 (low priority, after this section)
- [ ] Get the flow reviewed/approved before tech design starts

### 2. Tech design

- [ ] Decide the component/page structure for the approved flow
- [ ] Confirm whether §14's `slide_index` needs any interaction with archiving — current answer is no, since §14 already assigns indices from a never-reused monotonic counter, so an archived context's index simply stays retired, same as a hard-deleted one would
- [ ] Update `ARCHITECTURE.md` recording the archive-not-delete decision and why (completed tasks keep a valid `context_id`)

### 3. Implementation

- [ ] Add an `archived` (boolean, default `false`) column to the `contexts` table; generate a migration
- [ ] `PUT /api/contexts/:id` — rename: update `name`, no restriction based on task status
- [ ] `DELETE /api/contexts/:id` (or a dedicated `/archive` action — pick one consistent with how `routes/tasks.ts` models similar lifecycle actions) — checks for any `pending`/`in_progress` task with that `context_id`; 409 if found, otherwise sets `archived = true` (never a real row delete)
- [ ] `GET /api/contexts` excludes `archived` contexts by default
- [ ] Update `openapi.yaml` for the new/changed endpoints
- [ ] Real-DB integration tests: rename succeeds regardless of task status; archive succeeds when all tasks are completed or there are none; archive is rejected (409) when a pending/in_progress task exists; an archived context's completed tasks keep their `context_id` and still resolve correctly; `GET /api/contexts` omits archived contexts
- [ ] Frontend: build the UI surface decided above, wire it to the new endpoints. Rename and archive go through the § 56 client store as mutations that update the cached contexts in place, with no refetch, like create (`documentation/techDesign/client-data-store/hld.md`)
- [ ] Update `contextService.ts` with `renameContext`/`archiveContext` (or equivalent) client functions

---

## 43. Default font: Rubik (`font-rubik`)

Switch the app's default typeface (`--font-sans` in `tokens.css`, currently `system-ui, 'Segoe UI', Roboto, sans-serif`) to Rubik. Rubik must render correctly for the same language set §33 already commits to — major European languages plus Hebrew — so glyph coverage (Latin Extended + Hebrew) is a hard requirement, not just a look-and-feel swap.

**Relationship to §33:** this is the font/typeface decision; §33 (Localization support) is the separate string-translation/i18n-library/RTL-layout effort. Rubik natively supports Hebrew (it's a Google Font published in both Latin and Hebrew variants), which makes it a reasonable pick ahead of §33's RTL work landing, but this task can proceed independently of §33's timeline.

- [ ] Confirm Rubik's Hebrew variant covers the actual glyph/niqqud needs (base Hebrew letters at minimum; confirm whether niqqud/vowel points are needed anywhere in the product before assuming they're out of scope)
- [ ] Decide how the font is served — self-hosted `.woff2` files (no external request, works offline, consistent with this app's local-first direction) vs. Google Fonts CDN link. Per `CLAUDE.md`'s "smallest footprint" guidance, weigh this explicitly rather than defaulting to the CDN
- [ ] Add the chosen font files/`@font-face` declarations (if self-hosted) or `<link>`/`@import` (if CDN), covering both Latin and Hebrew subsets
- [ ] Update `--font-sans` in `tokens.css` to `'Rubik', system-ui, 'Segoe UI', Roboto, sans-serif` (keep the existing stack as fallback)
- [ ] Decide whether `--font-heading` also moves to Rubik or stays on its own stack — currently identical to `--font-sans`'s old value, so this is a real choice, not automatic
- [ ] Verify rendering across the existing component set in Storybook, in both LTR text and a sanity check with Hebrew sample text (a temporary story or manual check — real Hebrew strings don't exist yet since §33 hasn't shipped translations)
- [ ] Confirm no layout regressions from Rubik's metrics differing from the system-ui stack (line-height, `TaskCard` title truncation, button label widths at `sm` size)
- [ ] Update `ARCHITECTURE.md` recording the font choice and why (Hebrew + European-language glyph support, self-hosted vs. CDN decision)

---

## 44. Locale settings in the Settings page (`locale-settings-page`) — deferred, low priority

Once a Settings page exists (§23) and localization is implemented (§33), give the user a way to pick their language/locale from the UI instead of a console workaround or a hardcoded default. This is the settings-page-integration half of §33's "Add a locale-switching mechanism" bullet, tracked as its own low-priority entry so it isn't lost inside that section.

**Depends on:** §23 (Settings page must exist first) and §33 (localization/i18n library and language list must be implemented first).

- [ ] Add a locale picker control to the Settings page, listing the language set §33 confirms (European languages + Hebrew)
- [ ] Wire the picker to the i18n library's locale-switching mechanism chosen in §33
- [ ] Persist the chosen locale the same way §33 decides (localStorage today, consistent with theme preference; revisit if §7's user provisioning/accounts land first)
- [ ] Confirm switching locale in Settings correctly flips RTL layout when Hebrew is selected (per §33's RTL mechanism)

**Trigger:** §23 and §33 both need to have landed first — this is future work, not scheduled yet.

---

## 47. `TaskCard` design review (`taskcard-design-review`)

`TaskCard` predates both the design-token migration and the `Card` primitive (§24) — it still reads `--color-*`/`--radius-*` Layer-2 roles directly rather than through its own Layer-3 group, and whether it should eventually move onto `Card` or stay a separate, pre-migration component was left as an open question when `Card` was built. Also folds in two display issues already filed under Open Issues, since a design review is exactly where they'd get resolved:
- The context badge is redundant when a card is already shown on a context-specific carousel slide (e.g. "Learning") — it should only appear on the "All" slide.
- Energy is shown as plain text ("medium energy") in the meta line, unlike every other energy display in the app, which uses `EnergyIcon`.

- [ ] Decide: migrate `TaskCard` onto the `Card` primitive, or keep it separate and give it its own Layer-3 token group
- [ ] Resolve the context-badge-on-context-slide redundancy
- [ ] Replace the "medium energy" text with `EnergyIcon`
- [ ] Review in Storybook — approved

---

## 49. Parent and child task priorities (`parent-child-priority`)

Came up while designing AI task input (`documentation/techDesign/ai-task-input/hld.md`). Subtasks within a project or subproject can differ in urgency, so priority is **not** inherited from the parent the way context, location, energy and due date will be: every task keeps its own priority. What's not yet specified is how a parent's priority and its children's priorities relate.

Current state: the engine ranks only leaf tasks (parents are excluded as `non_leaf`), but `normalizer.ts` still inherits `priority` from ancestors when a task has none, and `POST /api/tasks/:id/split` copies the original's priority onto the new parent and sibling.

- [ ] Specify what a parent's priority means when only leaves are ranked: e.g. no effect, a tie-breaker, or a weight/cap applied to its children's scores
- [ ] Specify the default priority for a new subtask when the user doesn't state one (the global default, or the parent's priority as a starting value that's then stored on the child and not inherited)
- [ ] Decide whether a child may outrank its parent, and whether changing a parent's priority should offer to adjust its children
- [ ] Update the engine (`normalizer.ts` priority inheritance) and the split endpoint to match
- [ ] Record the decision in `documentation/ARCHITECTURE.md`

---

## 51. Recurring tasks (`recurring-tasks`)

Came up while designing AI task input (`documentation/techDesign/ai-task-input/hld.md`). Until this lands, AI input creates a recurring request ("water plants every Sunday") as a one-off task, and the review card notes that repeats aren't supported yet.

Current state: the engine reads `recurrence` (`RawTask`, `NormalizedTask`) and requires it for priority 10 (`normalizer.ts`), but nothing stores it: there's no `recurrence` column in `tasks`, and neither the API nor the manual form accepts it. § 13 also treats priority 10 as "ongoing" (a parent that keeps gaining children), which isn't the same as a task that repeats on a schedule.

- [ ] Decide what recurrence means: a task that repeats on a schedule, an ongoing parent (the § 13 sense), or both as separate concepts, and whether priority 10 should keep requiring it
- [ ] Choose a storage format (e.g. an RRULE subset vs a small custom shape) and what happens on completion (next occurrence created, or the same task reset with a new due date)
- [ ] Add the `recurrence` column and accept it in the task API and `openapi.yaml`
- [ ] Add recurrence to the manual task form
- [ ] Have AI task input parse recurrence instead of flagging it
- [ ] Record the decisions in `documentation/ARCHITECTURE.md`

---

## 55. Subtasks can inherit energy and location (`inherit-energy-location`)

Placed before § 53 because § 53 depends on it; the section number doesn't reflect that. Came up while designing AI task input (`documentation/techDesign/ai-task-input/hld.md`), but it's a change to the task model that the manual form needs too.

A project can contain tasks with different energy levels and locations, so each subtask can have its own value. When a subtask's value is left empty, it inherits the nearest ancestor's. Today that isn't possible: `tasks.energy_required` and `tasks.location` are `NOT NULL`, and the manual form always sets both, so every subtask stores its own value and changing a parent never reaches its children. (Context and due date can already be empty, but don't inherit when ranked; that's bug § 10.8.)

Scope: energy and location only. Duration and priority stay per task and are never inherited (priority: § 49). There's no field-editing endpoint yet (`PUT /api/tasks/:id` only changes status), so editing an existing task to "same as parent" is out of scope until one exists.

**Blocked by:** § 10.8. The ranking must treat an empty value as missing, or inherited values never reach the engine.

- [ ] DB migration: `tasks.energy_required` and `tasks.location` nullable; drop the `'anywhere'` column default. Existing rows keep their values (no back-fill to `null`)
- [ ] `POST /api/tasks`: subtasks may send `null` for energy and location to inherit; a top-level task always gets a concrete value (defaults from the API when omitted). Real-DB tests; update `openapi.yaml`
- [ ] Ranking: extend the § 10.8 test so a subtask with empty energy and location is ranked with its parent's values
- [ ] Web: `types/task.ts` makes `energyRequired` and `location` nullable; `resolveTask.ts` resolves every inheritable field (energy, location, context, due date) from ancestors; every display (`TaskCard`, `TaskTreeItem`, `TaskCreationPage`'s created-task rows, `RankingPage`) shows the resolved value
- [ ] Decide how the manual form offers inheritance for a subtask (e.g. a "Same as parent" option on the energy and location pickers, selected by default when a parent is chosen), and implement it
- [ ] Decide whether `POST /api/tasks/:id/split` should leave the new child's energy and location to inherit instead of copying them
- [ ] Record the inheritance decision (context, location, energy and due date inherited when empty; priority and duration never) in `documentation/ARCHITECTURE.md`

---

## 53. AI task input (`ai-task-input`)

HLD: `documentation/techDesign/ai-task-input/hld.md`. **Has an HLD: its LLD must be written and approved before implementation starts.** Describe tasks in free text on `/tasks/new`, review an editable draft tree (questions inline, fixed restructure actions), and confirm to create everything in one transaction.

**Blocked by:** § 34 (Auth), § 52 (AI integration), § 55 (energy and location inheritance), and the results design for draft presentation. Related: § 49, § 50 (interim priority handling ships here), § 51 (recurrence is flagged, not parsed).

- [ ] Results design for draft presentation (extend `TaskCard` or compose it in a review page), coordinated with § 47
- [ ] Write the LLD, `documentation/techDesign/ai-task-input/lld.md` (API signatures, data objects, DB table structures, UI components), using the results design, and get it approved. Implementation starts only after approval
- [ ] DB migration: add `tasks.priority_source`
- [ ] `POST /api/tasks` accepts `prioritySource`; `POST /api/tasks/batch` (one transaction, new contexts, parent-first, `tempId` resolution, `null` for inherited fields as in § 55); real-DB tests; `openapi.yaml`
- [ ] Shared query for open parent tasks with ancestor paths
- [ ] Shared default priority and duration constant used by the manual form and drafting (values from § 50)
- [ ] `src/ai/taskDrafting.ts` and `src/ai/draftResolution.ts`; `POST /api/ai/task-drafts`, `PATCH /api/ai/task-drafts/:eventId/outcome`; `openapi.yaml`
- [ ] Evaluation set (see the HLD's Testing section), including injection cases
- [ ] Web: `AiTaskInput`, `DraftReview`, `DraftActionBar`, `draftTree.ts`; `TaskCreationPage` gating states; Storybook stories

---

## 60. Online and offline state (`connectivity-state`)

The client data store (§ 56) relies on TanStack's online detection: with `networkMode: "online"`, requests made while the browser is offline are paused and sent on reconnect (`documentation/techDesign/client-data-store/lld.md` § 4). But the user isn't told when the app goes offline or comes back, and some store behaviour depends on connectivity and is still a default, not a decision. A step toward § 15 (offline sync).

- [ ] Detect the change of state. `onlineManager` from `@tanstack/react-query` reports what the browser reports. Decide whether "online but the server is unreachable" (repeated network errors) also counts as offline
- [ ] Show the user an indication of the current state and of the change (offline, back online, changes waiting to be sent)
- [ ] Decide the store and services behaviour by state, including:
  - a failed background refetch of data already on screen (until this lands, it opens the failure dialog like any technical error, LLD § 12); avoid a dialog loop when the server is down, where each refresh fails again
  - mutations that fail with a network error after their retry: dialog and refresh, or pause and resend like an offline mutation
  - reads with nothing cached while offline (they stay in loading)

---

## 61. Maintenance mode (`maintenance-mode`)

Related to § 60 (online and offline state), but separate. While the server is in maintenance, the app behaves much as it does offline. The difference is that the state is started on purpose (by whoever runs the server) rather than imposed by the network. Builds on § 60's indication and its by-state store behaviour.

- [ ] Decide how maintenance is started and how the client learns about it (e.g. a status the API returns, such as 503 with a `code`, or a status endpoint), and whether it's announced ahead of time
- [ ] Decide what the user sees, and whether changes made during maintenance are queued and sent afterwards, as offline changes are (§ 60, § 15)
- [ ] Make sure maintenance responses aren't treated as technical errors that open the failure dialog (`documentation/techDesign/client-data-store/lld.md` § 3)

---

## 58. New context with an archived context's name (`archived-context-name`) — low priority

Depends on § 42 (archiving). The `(user_id, name)` unique constraint on `contexts` includes archived rows, but the client's duplicate check (`isContextNameTaken`, `documentation/techDesign/client-data-store/lld.md` § 7) only sees non-archived contexts, because `GET /api/contexts` excludes archived ones. So creating a context with an archived context's name passes the client check, gets `name_taken` from the server, and is merged into the archived context (LLD § 6), which the user can't see.

- [ ] Decide the behaviour: allow the name again (the unique constraint excludes archived rows), unarchive the matching context, or tell the user the name belongs to an archived context
- [ ] Implement it in the API (real-DB tests, `openapi.yaml`) and in `data/contexts.ts`

---

## Open Issues

Issues that came up during implementation but were deferred to keep scope focused.

- **Split sibling title** — `POST /api/tasks/:id/split` creates the blank sibling with `title: ""`. Decide whether the API should accept an optional `siblingTitle` in the request body, or whether the client is always expected to prompt for it after navigation.
- **Carousel swipe direction** — currently parameterized (swipe-right reveals results). Finalize after UX testing whether this should be fixed or follow locale direction.
- **Ranking sort order** — returned tasks are not sorted in a user-intuitive order — sort results from low to high based on energy level and available time so the easiest/quickest tasks surface first. (The other half of this item, over-budget tasks still being returned, is now bug § 10.9 in `TASKS-BUGS.md`.)
