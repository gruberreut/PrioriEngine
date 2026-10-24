# Delete action in the tasks list

## Context

The tasks list (`TasksPage` → `TaskTreeItem`) currently has no way to delete a
task. Delete already exists end-to-end for the in-progress block
(`DELETE /api/tasks/:id`, `taskService.deleteTask`, `ConfirmDialog` for the
"this task has children" case) — built in §12 and wired into `RankingPage`.
This adds the same capability to the plain task-browsing list.

Delete is explicitly an MVP here — more per-task actions in the tree are
expected later (adding a task to a project, reparenting). Three design
decisions came out of discussion:

1. Leaf rows switch off the `dense` `TaskCard` flavor (which blocks
   `TaskCard`'s `actions` prop) onto the normal `TaskCard`, reusing the
   actions mechanism already used by `InProgressBlock`/`TaskDetailPage`.
2. That mechanism's button (icon, optional label, colored border) is
   extracted into its own shared `ActionButton` component so project/parent
   rows (a separate, non-`TaskCard` disclosure row) can render their single
   delete action with the exact same look, rather than inventing a second
   button style.
3. The delete itself is **optimistic**: remove the task (and, for the
   has-children case, its affected descendants) from local state
   immediately, call the API in the background, and only if that call fails
   tell the user and resync from the server. This is a deliberately
   narrow, page-local version of a problem that's bigger than this task —
   three follow-up backlog items (TASKS.md §29–§31) capture the broader work
   (generalizing this pattern, applying it to `RankingPage`, and eventually
   observability) without pulling any of it into this change.

## Approach

### Extract `ActionButton` from `TaskCard`

`TaskCard.tsx`'s inline action-button rendering (`styles.actionButton` /
`.actionIcon` / `.actionLabel` in `TaskCard.module.css`) is already generic —
icon, optional label, optional color, no `Task` awareness. Pull it out to
**`apps/web/src/components/ActionButton/`** (atomic — generic primitive, no
domain knowledge):

```ts
interface ActionButtonProps {
  icon: ReactNode;
  label?: string;
  color?: string;
  showLabel?: boolean;
  onClick?: () => void;
}
```

- Owns the `stopPropagation()` call itself (so it's always safe to nest
  inside a clickable card/row without the caller having to remember it).
- Move `.actionButton`/`.actionIcon`/`.actionLabel` from `TaskCard.module.css`
  into `ActionButton.module.css`; `TaskCard.module.css` keeps `.actions`
  (the flex container is layout specific to `TaskCard`, not the button).
- `TaskCard.tsx`'s actions map becomes: `actions.map((action) =>
  <ActionButton key={action.id} icon={action.icon} label={action.label}
  color={action.color} showLabel={showActionLabels}
  onClick={() => onAction?.(action.id)} />)`.
- New `ActionButton.stories.tsx` (`Atomic/ActionButton`): `Default`,
  `WithLabel`, `Colored`, `LongLabel`; `onClick` wired via `argTypes`.
- Reviewed in Storybook before its two call sites (below) are considered
  done, per the project's one-component-at-a-time convention.

### Drop `TaskCard`'s `dense` flavor (unused elsewhere)

`flavor="dense"` is used only by `TaskTreeItem` today; moving that call site
off dense makes it fully dead code:
- **`TaskCard.tsx`**: drop `"dense"` from the `flavor` union (leaves
  `"flat" | "outlined"`); remove `isDense` and its three usages (title/meta
  class switch; `!isDense && explain && breakdown` → `explain && breakdown`;
  `!isDense && actions...` → `actions && actions.length > 0`).
- **`TaskCard.module.css`**: remove `.dense`, `.denseTitle`, `.denseMeta`.
- **`TaskCard.stories.tsx`**: remove the `Dense` story; drop the
  `flavor="dense"` line from `Flavors`.

### Shared helper: move `getDescendants` into `resolveTask.ts`

`TaskTreeItem.tsx` has a local, unexported `getDescendants(taskId,
allTasks)` (walks the flat `Task[]` by `parentId`, used for the progress
line). `TasksPage`'s optimistic reparent/delete-with-children logic needs
the same walk, so move it to `apps/web/src/features/tasks/resolveTask.ts`
(already the shared home for tree helpers — `getAncestors`, `resolveTask`)
and export it; `TaskTreeItem.tsx` imports it from there instead of defining
its own copy. Add a case to `resolveTask.test.ts`.

### `TaskTreeItem.tsx` — leaf rows

- Render `<TaskCard flavor="outlined" .../>` instead of `flavor="dense"`.
- Add a module-level `LEAF_ACTIONS: TaskAction[]` with just the delete entry
  (`Icon` + existing `Trash` asset, matching the existing
  `inProgressActions`/`sampleActions` convention), passed as `actions`, with
  `onAction` calling `onDelete?.(task)` when `actionId === "delete"`. No
  `showActionLabels` (icon-only).
- Add `onDelete?: (task: Task) => void` prop. Rows render larger/taller
  (full `TaskCard` padding/font) than the old compact dense row — accepted
  trade-off.

### `TaskTreeItem.tsx` — project/parent rows

- Add a single `<ActionButton icon={<Icon asset={Trash} label="Delete"
  size={20} />} color="#fee2e2" onClick={() => onDelete?.(task)} />` inside
  the existing `.row` div, after `.progress`. No new CSS needed in
  `TaskTreeItem.module.css` — `ActionButton` supplies its own styling and
  stops the click from also toggling expand/collapse.
- Pass `onDelete` through the recursive `children.map(...)` call.

### `TasksPage.tsx` — optimistic delete

- Add `pendingDeleteId: string | null` (children-choice dialog, as before)
  and `deleteFailed: boolean` (failure notice) state.
- `refetch()`: the existing mount-effect body (`getTasks().then(...)`),
  extracted so it can also run after a failed delete.
- `removeLocally(ids: string[])`: filters those ids out of `state.tasks`.
- `reparentLocally(parentId: string)`: maps `state.tasks`, clearing
  `parentId` on direct children of `parentId` (mirrors the backend's
  `"reparent"` behavior).
- `handleDelete(task)`:
  - `task.hasChildren` → `setPendingDeleteId(task.id)` (unchanged — still
    asks before doing anything).
  - otherwise → `removeLocally([task.id])` immediately, then
    `deleteTask(task.id).catch(() => setDeleteFailed(true))`.
- `handleDeleteChildrenChoice(childAction)`: resolve/clear
  `pendingDeleteId`, then:
  - `"delete"` → `removeLocally([taskId, ...getDescendants(taskId,
    tasks).map(t => t.id)])`.
  - `"reparent"` → `reparentLocally(taskId)` then `removeLocally([taskId])`.
  - Either way, then `deleteTask(taskId, childAction).catch(() =>
    setDeleteFailed(true))`.
- On failure: a `ConfirmDialog` (`open={deleteFailed}`, "Something went
  wrong" / explains the task couldn't be deleted and the list will refresh,
  single "OK" option) whose `onSelect`/`onCancel` both clear `deleteFailed`
  and call `refetch()`. This is deliberately the same bespoke,
  per-page pattern already used for other action errors elsewhere (e.g.
  `TaskDetailPage`'s `actionError`) — **not** a new general mechanism; that
  general mechanism is scoped out as its own backlog item (§30) precisely so
  it isn't designed under time pressure inside this change.
- Pass `onDelete={handleDelete}` to each root `TaskTreeItem`.

No changes to API routes/services (reuses `DELETE /api/tasks/:id` and
`taskService.deleteTask` from §12); no `ARCHITECTURE.md` entry (no new
architectural decision for this page-local pattern).

### New TASKS.md backlog items

Added as §29–§31 (see `TASKS.md`):

**§29 `RankingPage` optimistic updates (`ranking-optimistic-updates`)** —
today `RankingPage.handleInProgressAction`/`handleStartTask`/
`handleDeleteChildrenChoice` all call `refreshAfterMutation()`, which resets
every slide to `idle` and re-runs `/api/rank` for the active slide, instead
of updating local state the way `TasksPage`'s delete now does. Task: review
whether complete/snooze/delete/start should move to the same optimistic
pattern. Notes it isn't a 1:1 copy of `TasksPage`'s flat-list case (snooze
changes ranking order, which arguably still needs a re-rank), and that it
should follow §30 rather than invent its own failure-handling story.

**§30 General failed-backend-call handling (`backend-error-handling`)** —
prompted directly by this task's bespoke "something went wrong, click OK to
refresh" flow in `TasksPage`. Task: design one general mechanism for
notifying the user when a backend call fails (whether following an
optimistic update or any other unexpected failure) and refreshing the
current page's data afterward, instead of every page/action building its
own. Open questions to record: where the mechanism lives (shared hook/
wrapper vs. shared notice component + utility), modal-acknowledgment vs.
toast UX, and how a page registers its own "refresh" function generically.
Includes migrating `TasksPage`'s handling onto it once built, and revisiting
§29 against it.

**§31 Analytics and error tracking setup (`analytics-setup`) — deferred, low
priority** — not needed with a single dev user and no deployment yet.
Task: once production deployment is actually being considered, pick an
approach (hosted product analytics, self-hosted event log, or piggybacking
on a backend error-tracking service) to track usage events and errors; wire
§30's mechanism to also emit an error event through it once both exist.

### Storybook

- `ActionButton.stories.tsx` (new, `Atomic/ActionButton`) — see above.
- `TaskCard.stories.tsx`: remove `Dense` story and the dense line in
  `Flavors`; actions-related stories (`WithActions`, `InProgress`, etc.)
  behave identically since `ActionButton` is a drop-in visual match.
- `TaskTreeItem.stories.tsx`: add `argTypes: { onDelete: { action:
  "onDelete" } }`. Leaf rows now render as outlined cards with a visible
  delete action; parent rows show the same `ActionButton` delete affordance.
- `TasksPage.stories.tsx`: no prop changes (delete is wired internally).
  `Populated` will show delete buttons throughout the tree; clicking delete
  removes the row immediately (optimistic), then the background
  `deleteTask` fetch fails (no backend in Storybook) and pops the
  "Something went wrong" dialog, whose OK then calls the real `getTasks()`
  (also failing, landing on the existing `error` state) — an expected,
  harmless dead end in Storybook, consistent with how `TaskDetailPage`'s own
  real-fetch actions already behave there.
- All files reviewed in local Storybook before considering this done.

## Verification

- `npx tsc -b --noEmit` in `apps/web` clean.
- `npx vitest run` in `apps/web` still green; add a `resolveTask.test.ts`
  case for the moved `getDescendants`.
- `npx eslint . && npx stylelint "src/**/*.module.css"` clean on touched
  files.
- Manual check in local Storybook: `Atomic/ActionButton` (new),
  `Entity/TaskCard` (no more `Dense` story, actions still look identical),
  `Features/Tasks/TaskTreeItem` (leaf rows are outlined cards with delete,
  parent rows show the same delete button, click fires `onDelete`),
  `Features/Tasks/TasksPage` → `Populated` (delete removes a row instantly;
  the has-children path still prompts first).
- User will review in Storybook per the project's approval convention
  before this is considered complete.
