# Client data store — HLD

Tracked in `tasks/TASKS-TECH.md` § 56. This is the high-level design (approved). The low-level design (`lld.md`, next to this file) is written and approved before implementation starts.

## Context

Today the web app has no shared client state. Each Page component fetches its own data into `useState`:

| Page | Reads | Mutates |
|---|---|---|
| `RankingPage` | `getContextItems()`, `rank()` per carousel slide | start, complete, snooze, delete. Each one ends in `refreshAfterMutation()`, which drops every slide's results and re-ranks the visible one |
| `TaskCreationPage` | `getContextItems()` | `createTask`, `createContext`. Both wait for the server before updating local state |
| `TasksPage` | `getTasks()` | delete. Optimistic, with "error, then refetch after OK" on failure (§ 29) |
| `TaskDetailPage` | `getTasks()` | — |
| `InProgressPage`, `LoadingGate` | `getTasksByStatus("in_progress")` | complete, snooze, delete |

So the same data is fetched in several places, a change made on one page is invisible to the others until they refetch, and merging lives in components: `TaskCreationForm` keeps its own `addedContexts` list and dedupes it with `mergeContexts` (§ 10.6).

Three things found while reading the code that this design has to account for:

- `createContext` failures are silent today. `TaskCreationForm.handleAddContext` has a `try/finally` with no `catch`, so a 409 (duplicate name) or a network error leaves the form as it was and logs an unhandled rejection.
- `POST /api/contexts` doesn't validate `name`. `String(body.name)` turns a missing name into the context `"undefined"`.
- `POST /api/tasks` already takes a client id, but it isn't idempotent: a retry with the same id is a primary-key violation, which returns a generic 400. It also doesn't check that `contextId`/`parentId` belong to the user. This matters when tasks move into the store (see Later moves).

## Scope

**In scope.** Server state: cached copies of data the server owns (contexts now; tasks and ranking results later), plus the user's optimistic changes to it. The server stays the source of truth. The cache is never authoritative, and anything in it can be thrown away and refetched.

**Out of scope.** Client/UI state: carousel position, ranking params, form fields, open dialogs, "added this session" lists. It stays in the Page/Container component that owns it, as today.

## Requirements

From § 56 and the work that follows it:

1. **One copy per piece of server data.** Every page that shows contexts reads the same cached list. A context created on one page is visible everywhere straight away.
2. **Optimistic mutations.** A create/update/delete is applied to the cache and sent at the same time. On success nothing visible happens beyond reconciling server-assigned fields.
3. **Merge and dedupe once,** in the data layer, not in components.
4. **Pages read; presentational components get props.** Same Page/Presentational split as today (`guidelines/COMPONENT_BEST_PRACTICES.md`).
5. **Later: tasks and ranking results.** Ranking results are a family of entries keyed by `(params, context)`. § 30 wants complete/start/delete/snooze to update them optimistically instead of reloading every slide.
6. **Invalidation.** A mutation makes other cached data stale. Completing a task makes every ranking result stale, not only the visible slide's.
7. **Failure path.** Until § 31 lands, keep today's per-page handling. After it, use one mechanism: an error message, then a refresh after the user confirms.
8. **Storybook.** Page stories can provide the data without a running API.
9. Smallest footprint that won't have to be undone later (`CLAUDE.md` § Technology and Architecture Choices).

## Options

### A. React context + `useReducer`

A `DataProvider` at the app root holds `{ contexts, tasks, … }` in a reducer. Pages read it with `useContext` and dispatch actions.

- **Re-renders.** Every consumer re-renders on every state change, because a context has no selectors. The workarounds are splitting into one context per entity or adding a selector library. Both are part of option B, done the hard way.
- **We build ourselves:** loading and error state per entity, the fetch-on-first-use logic, refetching (on mount, on focus, after invalidation), request dedup when two pages mount together, optimistic apply and reconcile, invalidation, and removing unused data. For ranking results, a keyed cache with its own eviction.
- **Dependency cost:** none.
- **Testability:** the reducer is a pure function and easy to test. The async parts (fetching, reconciling, dedup) sit around the reducer and need their own tests.
- **Storybook:** a decorator renders `DataProvider` with seeded state. Simple.
- **Data shared by pages:** works, since the provider is above the routes.
- **Will it be replaced?** Likely. It's fine for one small list, but requirements 5 and 6 would turn it into a hand-rolled query cache with poor re-render behaviour, and that would then need rewriting.

### B. Module store read with `useSyncExternalStore`

A plain TypeScript module holds the state and a subscriber set. Pages read through `useStore(selector)`, which is built on `useSyncExternalStore`.

- **Re-renders:** good. A component re-renders only when the value its selector returns changes. Selectors that build new objects or arrays need memoising, or they re-render every time. That's a known trap, and only care prevents it.
- **We build ourselves:** everything listed for A, minus the re-render problem. That covers status flags, dedup of in-flight requests, stale tracking, refetch triggers, keyed entries for ranking, eviction, optimistic apply, reconcile, invalidation by prefix, and cancelling a fetch that would overwrite a pending optimistic change. That's most of what C ships, written and tested by us.
- **Dependency cost:** none.
- **Testability:** good. It's plain modules, testable without React.
- **Storybook:** a module singleton leaks between stories. It needs a `reset()`/`seed()` per story, or the store instance has to come from a context provider, at which point it's half of C's `QueryClientProvider` design.
- **Data shared by pages:** works.
- **Will it be replaced?** It wouldn't have to be thrown away, but it grows into its own query library. Each requirement in § 30, § 31 and § 42 adds machinery. That's the tech debt the architecture rule warns against: not a rewrite, but a growing in-house library.

### C. TanStack Query (`@tanstack/react-query` v5)

A `QueryClient` is a cache of server data keyed by arrays (`["contexts"]`, `["rank", params, contextId]`). Pages read it with `useQuery`, and change it with `useMutation` and `queryClient.setQueryData`.

- **Re-renders:** good, with no work from us. `select` narrows what a component subscribes to. Tracked properties mean a component re-renders only for the result fields it reads (`data`, `isPending`, …). Structural sharing keeps unchanged parts of a refetched result reference-equal, so a refetch that changes nothing re-renders nothing.
- **Provided:** loading and error state, refetch on mount, focus and reconnect, request dedup, stale-while-revalidate, removing unused entries (`gcTime`), invalidation by key prefix (active queries refetch, inactive ones are marked stale), `cancelQueries` (so a background refetch can't overwrite an optimistic change), and mutation `scope` to run dependent mutations in order.
- **We build ourselves:** query keys and the per-entity mutation logic (optimistic apply, dedupe, reconcile, which keys to invalidate). That's the domain-specific part, which no option can provide for us.
- **Dependency cost:** one runtime package (plus `@tanstack/query-core`), roughly 13 kB min+gzip. It's MIT-licensed, widely used, and supports React 19. Devtools are optional and not added now.
- **Testability:** good. Each test gets a fresh `QueryClient`. Data-layer logic can be tested against a client directly with `fetch` stubbed, without rendering React.
- **Storybook:** each story gets a fresh, seeded `QueryClient`, with no mock server needed.
- **Data shared by pages:** works by key. Two pages using `["contexts"]` share one entry and one request.
- **Will it be replaced?** Not for anything currently planned. See the revisit trigger below for § 15.

### D. React Router v7 data APIs

Route `loader`s fetch, `action`s mutate, the router revalidates loaders after every action, and `useFetcher` handles mutations without navigating. We already depend on `react-router-dom`.

- **Prerequisite:** the app uses declarative `<BrowserRouter>`. Data APIs need data mode (`createBrowserRouter` + `RouterProvider`). That means restructuring `App.tsx` and probably turning `LoadingGate` into a root loader. It's a migration of its own.
- **Re-renders:** `useLoaderData` returns the whole loader result, with no selectors. Revalidation after an action re-runs every matched loader by default (tunable with `shouldRevalidate`).
- **We build ourselves:** a cache. Loaders run again on every navigation, so going Ranking → Tasks → Ranking refetches contexts each time. Avoiding that means caching inside loaders, which is option B again. Optimistic UI comes from reading `fetcher.formData` in the component that submitted it. It's per component, not a shared store, so it fails requirement 3: a context being created exists only in the form that's creating it. Dedupe and reconcile would sit in components, which is exactly what § 56 wants to remove.
- **Ranking fits poorly.** Slides load when the user swipes to them, not on navigation. Each slide would need its own fetcher with its own lifecycle, which is about what `RankingPage` hand-rolls today.
- **Dependency cost:** none, but the router migration costs effort.
- **Testability and Storybook:** `createRoutesStub` per story or test, with stub loaders and actions. Workable, but heavier than seeding a cache.
- **Data shared by pages:** only through a parent route's loader, which ties the data's lifetime to the route tree.
- **Will it be replaced?** It isn't a store, so we'd add one next to it anyway. Data APIs can still be useful later for route-level prefetching. They work alongside C (a loader can call `queryClient.ensureQueryData`) rather than replacing it.

### Summary

| | A. Context + reducer | B. Module store | C. TanStack Query | D. RR data APIs |
|---|---|---|---|---|
| Re-renders only for what's read | No | Yes, if selectors are memoised | Yes | No |
| Loading and error state | Build | Build | Provided | Provided per route |
| Refetch and stale-while-revalidate | Build | Build | Provided | On navigation only |
| Request dedup | Build | Build | Provided | Per navigation |
| Optimistic + reconcile | Build | Build | Primitives provided, logic ours | Per component, from form data |
| Invalidation | Build | Build | By key prefix | Re-run all loaders |
| Keyed entries + eviction (ranking) | Build | Build | Provided | No |
| New dependency | None | None | ~13 kB | None (router migration) |
| Storybook | Seeded provider | Reset/seed per story | Seeded client per story | Route stubs |
| Fits § 30 / § 31 / § 42 without a rewrite | No | Yes, by growing an in-house library | Yes | No |

## Recommendation: C, TanStack Query

**Decided (user): C.** Before the LLD, the user will hold a study session on TanStack Query: its principles and abilities, how it's structured, and what makes it the industry standard.

The architecture rule prefers no new dependency unless there's a reason. The reason here is that requirements 5 and 6 are the core of a query cache: keyed entries, stale tracking, invalidation by prefix, dedup, eviction, and not letting a refetch overwrite an optimistic change. With A or B we'd write all of that, test it, and keep it maintained, and § 30 and § 42 would each add more. One well-scoped package is a smaller footprint than an in-house library that keeps growing.

**The alternative, stated so you can weigh it:** if contexts were the only data the store would ever hold, B would be enough and C would be over-built. The deciding question is whether you agree that ranking results and tasks really will move in (§ 30). If not, choose B.

**How C is used here,** so the dependency stays contained:

- One `QueryClient`, created in `main.tsx`, provided above the router.
- A data layer in `apps/web/src/data/`, one module per entity (`contexts.ts`, later `tasks.ts` and `ranking.ts`). Each exports its query keys, a hook to read (`useContexts()`), and hooks to mutate (`useCreateContext()`). The dedupe, optimistic, reconcile and invalidation rules for that entity live there and nowhere else. This module is what § 56 calls "the store".
- `services/` stays the plain `fetch` layer. Only `data/` calls it.
- Pages call `data/` hooks and pass plain values and callbacks to presentational components. Presentational components never import from `data/` or `@tanstack/react-query`.

**Generic or contexts-only.** The cache itself is generic, because it's TanStack's. The rules are per entity: we write `data/contexts.ts` now and add a module per entity when it moves in. There's no generic "entity store" abstraction on top. Each entity's optimistic rules differ too much: contexts have `slideIndex`, tasks have trees, and ranking results are derived data.

**Revisit trigger.** § 15 (offline sync). If the client gets a local database (Dexie/IndexedDB) that pending writes are queued in and drained from, the local database becomes the client-side source and the cache's role changes. At that point, decide between TanStack on top of Dexie (with persisted, paused mutations) and Dexie's live queries replacing it. A smaller trigger: if `data/` ends up working around TanStack's model rather than using it (for example, hand-syncing two caches), stop and reconsider. Failed or offline mutations would also move to an outbox as part of § 15: actions queued in order, retried, and idempotent by client id.

## Data in the store

| Data | When | Key | Notes |
|---|---|---|---|
| Contexts | Now | `["contexts"]` | Whole list, ordered as `GET /api/contexts` orders it (by `slideIndex`) |
| Tasks | Later, with § 30 | `["tasks"]` (and `["tasks", { status }]` for `getTasksByStatus`) | `TasksPage`, `TaskDetailPage`, `InProgressPage`, `LoadingGate` |
| Ranking results | Later, with § 30 | `["rank", contextId ?? "all", params]` | One entry per slide and params combination |

**Ranking filters by context id.** Today `rank()` sends the context *name* and `/api/rank` filters by it. Once § 42 allows renaming, a name would point at the wrong data, both in the request and in the cache key. `/api/rank` changes to take `contextId` and filter by it, and the cache key uses `contextId` too. Tracked in § 30, since that's where ranking results move into the store.

## Loading and refetching

- A page reads with a `data/` hook. The first reader triggers the fetch, and readers that mount at the same time share the same request.
- **Contexts: loaded once per session, never stale (decided, user).** The first reader fetches the list, and it's never refetched after that: not on focus, not on reconnect, not after a mutation. Every change the user makes (create, rename, archive) updates the cached list in place, and the server's response reconciles the changed row, with no reload. The only full refetch is the refresh after an unexpected failure (Failure path). The accepted trade-off is that a context added from another device appears only in the next session.
- **Tasks: stale-while-revalidate (decided, user).** If cached data exists, show it immediately, even when stale, and refetch in the background. A loading state is shown only when there's no cached data for that key.
- **Except on the ranking page, where tasks must be fresh (decided, user).** Today every task the ranking page shows comes from ranking results (including the in-progress block), which follow the rule below. If the ranking page ever reads task data directly, that read follows the ranking rule too: no stale data shown.
- **Ranking results: never shown stale (decided, user).** A ranking answers "what should I do now", so an old answer misleads in a way an old context list doesn't. A result is shown from the cache only while it's fresh (1 minute, so swiping back and forth between slides doesn't flash loading). Once it's older than that, or a mutation has invalidated it, the slide shows its loading state and fetches. The old list isn't shown meanwhile. The one exception is § 30's optimistic edit of the visible slide after the user acts on a task: that list already reflects the user's action, so it stays on screen while the slide refetches.
- **Ranking params change:** that's a new key with no data, so the slide shows its loading state, as today. Showing the previous params' results while loading (`placeholderData`) is rejected, because results for "30 min, low energy" shown under a "10 min, high energy" header would be wrong, not just old.
- Refetch on window focus and on reconnect, but only when the data is stale.
- `retry`: 1 for queries. Mutations retry at most once, on network errors only (never on an HTTP error response), and only when their endpoint is idempotent by client id: context create now (see `POST /api/contexts` changes below), task create once § 30 makes `POST /api/tasks` idempotent. Other mutations don't retry, because a retried non-idempotent create can create the row twice (decided, user).

## Cache behaviour

| Data | Stale after | Removed from cache after last reader unmounts | Why |
|---|---|---|---|
| Contexts | Never (`staleTime: Infinity`), no refetch on focus or reconnect | Never (`gcTime: Infinity`) | Loaded once per session. Every change goes through the store and updates it in place |
| Tasks | 1 min | 5 min (default) | Changes often, from several pages |
| Ranking results | 1 min, and never shown once stale (see Loading and refetching) | 5 min (default) | Depends on time as well as data (due dates, snooze expiry), and on changes from other devices. Many keys, so they should expire |

**While a mutation is pending** for an entity, its queries are not refetched in the background. The mutation cancels in-flight fetches for those keys when it starts (`cancelQueries`), and invalidation runs only after the last pending mutation for that entity settles. Otherwise a refetch that started before the POST landed would remove the optimistic row.

**Which mutations invalidate what.** Invalidating an active query refetches it in the background. Invalidating an inactive one only marks it stale, so it refetches the next time it's read. That's what makes "every ranking result is stale" cheap: only the visible slide refetches.

| Mutation | Updated optimistically | Invalidated after it settles |
|---|---|---|
| Create context | `["contexts"]` (append) | Nothing. The server response replaces the optimistic row. A new context has no tasks, so no ranking result changes |
| Rename context (§ 42) | `["contexts"]` (rename in place) | Nothing. Ranked tasks carry the context's id, and the page looks the name up in the contexts store (§ 30), so nothing else holds the name |
| Archive context (§ 42) | `["contexts"]` (remove) | Nothing. § 42 only allows archiving a context with no pending or in-progress tasks, so no ranking result contains its tasks |
| Create task | `["tasks"]` | `["tasks"]`, `["rank"]` |
| Start / complete / snooze / delete / split task | `["tasks"]`; the visible rank entry, per § 30's rules | `["tasks"]`, `["rank"]` |

Rule of thumb for the LLD: every task mutation invalidates `["tasks"]` and `["rank"]`. A context mutation updates `["contexts"]` in place and invalidates nothing.

**This relies on other data referring to contexts by id.** Today ranked tasks carry context *names* (`task.contexts`, which `TaskCard` shows), so a rename would leave old names in cached results. § 30's `/api/rank` item changes ranked tasks to carry context ids, and the page resolves names from the contexts store before passing them to `TaskCard` as props.

## Optimistic creates and ids

### Temporary ids vs client-generated permanent ids

**Temporary ids, swapped for the server's id on success.** Every reference to the temporary id has to be rewritten when the real one arrives: the cached row, any task that picked the new context, the form's selected `contextId`, React keys (a changed key remounts the row and loses focus), and a URL if the user navigated to the item. If the user acts on the item before the server responds, for example by creating a task in a context that's still being saved, there are two choices. Either block the action, which is not optimistic, or queue it and rewrite its payload when the swap happens. That's a dependency-tracking system in itself.

**Client-generated permanent ids (`crypto.randomUUID()`).** The id is final from the start, so nothing is rewritten. A task created in a pending context references the context's real id. The one remaining problem is ordering on the server: the task's POST must not arrive before the context's POST commits, or the `context_id` foreign key fails. That's handled by order, not by rewriting: a mutation that references a pending create waits for it to settle. TanStack's mutation `scope` (mutations in the same scope run one after another) or awaiting the pending create's promise are both options, and the LLD picks one. If the context create fails, the dependent task create fails with it, through the same failure path.

**Decided (user): client-generated permanent ids.** Tasks already work this way (`tasks.id` has no DB default), so contexts become consistent with them. § 15 already plans client UUIDs for offline sync. And the "act on it before the server responds" case works without blocking or rewriting.

### `POST /api/contexts` changes

- **Accept an optional `id`.** If it's absent, the server generates one, as today (the database default stays). Keeping it optional means the change doesn't break existing callers.
- **Validate `id`:** it must be a UUID, otherwise 400.
- **Validate `name`:** it must be provided and be a non-empty string after trimming, otherwise 400. This fixes the `"undefined"` gap above. The trimmed name is what's stored.
- **Validate that the name is unique for the user:** the `(user_id, name)` constraint already enforces this. It's answered with 409 `code: "name_taken"` (below), not the bare 409 it returns today.
- **Create-only.** Never update an existing row. Today `onConflictDoNothing()` covers both unique constraints (the primary key and `(user_id, name)`), so after an insert that returns no row, the handler has to work out which one hit:
  - **A row with this id exists for another user:** 409, with a generic message that reveals nothing about that row. Never overwrite it and never return it.
  - **A row with this id exists for this user, with the same name:** an idempotent retry. Return the existing row with **200** (vs 201 for a new row). The client treats both as success.
  - **A row with this id exists for this user, with a different name:** 409, `code: "id_conflict"`.
  - **No row with this id:** the name is taken. 409, `code: "name_taken"`, and the body includes the user's existing context with that name (it's the same user's own row, so nothing leaks). This lets the store add it without refetching the list.
- `slideIndex` isn't part of "same data", because it's server-assigned.
- 409 bodies carry a machine-readable `code` so the client can tell a duplicate name (handled in the form) from an id conflict (unexpected, so the failure path).
- Real-DB tests for each case, with `openapi.yaml` updated in the same commit (already in § 56's item list).

An existing risk this change doesn't introduce but makes slightly more reachable: `slideIndex` is computed as `MAX + 1` inside the transaction without a lock, so two concurrent creates for the same user (two devices) could get the same index. It's acceptable at single-user scale (§ 14 accepts shared hues after wrapping for the same reason). This is recorded rather than fixed here.

### `slideIndex`: predicted, then reconciled

- The store predicts `(max slideIndex in the cached list + 1) % 8`. That's the server's formula applied to what the client can see, and it's what the optimistic row is drawn with.
- On success, the server's row replaces the optimistic one, and the server's `slideIndex` wins (§ 14 invariant: the server assigns it).
- The prediction is wrong when the client's list isn't the whole picture: a context created from another device since the last fetch, or, once § 42 lands, an archived context holding the highest index (`GET` excludes archived rows, but the server's `MAX` includes them). The visible effect is the new context's colour changing once, when the response arrives. That's acceptable for now. If it becomes noticeable after § 42, `GET /api/contexts` can return the next index alongside the list. That's a small, additive change, so it's deferred rather than designed now.
- The cached list stays sorted the way the server sorts it (by `slideIndex`), and is re-sorted after reconcile.

### Duplicate names

- **One rule, used in three places.** A pure function (e.g. `isContextNameTaken(name, contexts)`: trim, then compare exactly, as the database's unique constraint does) is shared by the form, the store and, in spirit, the server. Keeping it in one function means the form's feedback and the store's check can't drift apart. It lives outside `data/` so the presentational form can use it. The LLD picks the place.
- **As the user types.** `TaskCreationForm` already receives `contexts` as a prop. While the user types a new context name, it checks the name against that list and shows an inline "already exists" message, with Add disabled. An empty name also keeps Add disabled, as it does today. Whether the message offers to select the existing context is a UX choice for the LLD.
- **Before sending.** The store runs the same check, so a duplicate never reaches the server even if a caller skips the form's check. If it's a duplicate, nothing is sent and the mutation returns a "duplicate" result.
- The as-you-type check is only as current as the cached list. A name created from another device since the last fetch passes it, which is why the server's answer is still handled (next point).
- The server's 409 `name_taken` is still handled. It means another device created the name since our last fetch. It's an expected answer, not a failure: remove that one optimistic row, add the existing context from the 409 body to the cached list (no refetch, per the loaded-once rule), and show the same inline message.
- **Merged into the existing context (decided, user, in the LLD).** Same name means the same context, so a task create waiting on the rejected context is sent with the existing context's id instead of failing. This also covers a context created offline that's rejected after reconnect, when the form is gone. Details in `lld.md` § 6. Rejected: renaming the new context (`garden-2`, "copy of garden"), which creates a context the user didn't ask for.

## Failure path

The two ways to undo an optimistic change that the server rejected:

**Show an error, refresh after the user confirms** (§ 31's decided UX). The refresh refetches the page's data from the server. With the store, "refresh" means invalidating and refetching the affected queries, not `window.location.reload()`, so form fields and other UI state survive.
- Always ends in a state the server agrees with, whatever else changed in the meantime.
- One mechanism for every mutation.
- Costs an extra tap and a round trip. A change that actually succeeded alongside the failed one is kept (it's on the server); one that failed is gone.

**Roll back** (restore the snapshot taken before the optimistic change).
- No interruption.
- Wrong when anything else changed after the snapshot. Restoring it undoes those later changes too, such as a second optimistic create or a background refetch. Dependent creates (a task in the rolled-back context) need their own rollback.
- Needs an inverse for every mutation, and each one is a place for bugs.

**Decided (user):**
- **Unexpected failures** (network error, 5xx, 400, `id_conflict`): a `ConfirmDialog` with one button ("OK"). Selecting it, or dismissing the dialog, refreshes. This is the pattern `TasksPage` already uses for a failed delete ("Something went wrong … The list will refresh."). **The dialog is central, and built now (decided, user).** It's § 31's mechanism. A single `ConfirmDialog` is mounted once at the app root, and the data layer opens it whenever a mutation fails unexpectedly. Its OK refetches the active queries, which is what "refresh the current page" means once data is in the store, so pages don't register refetch functions. Pages don't render their own failure dialogs. § 31 is built before § 56 moves contexts into the store, and `TasksPage`'s own failed-delete dialog then moves onto it. § 31's LLD can be part of this HLD's LLD or its own; the LLD decides.
- **Expected, specific rejections** (`name_taken`), meaning errors the user can fix by changing their input. Technical errors the user can't fix go to the dialog above: a targeted removal of that one optimistic row, adding the existing context from the 409 body to the cached list (no refetch), and an inline message where the user acted. This is not a snapshot rollback. It removes exactly the row the server rejected, so it's safe however many other changes are pending.
- **Snapshot rollback is not used**, for the reasons above.

This closes the silent-failure gap in `TaskCreationForm` as part of the migration.

### Central error handling (decided, user)

Every error from a backend call reaches one place and is handled the same way. Pages and components don't catch backend errors.

- **One way to call the API.** Every `services/` function goes through one `apiFetch` helper. It turns a network error or a non-OK response into an `ApiError` (`status`, the body's `code` if any, and the body). No service throws its own ad-hoc `Error("Failed to …")` as they do today.
- **One handler.** The `QueryClient` is created with a `QueryCache` and a `MutationCache` whose `onError` callbacks are that one place, for reads and writes alike. The handler opens the central failure dialog (§ 31), and its OK refreshes.
- **Expected rejections are declared, not caught.** A query or mutation that has a specific, expected rejection declares it on its definition in `data/` (e.g. `meta: { expectedErrors: ["name_taken"] }`). The central handler leaves those to the mutation's own logic (the targeted removal and inline message above) and handles everything else. That keeps one rule: if it isn't declared as expected, it goes to the dialog.
- **Load failures use the same path.** A failed first load opens the same dialog, and OK refetches. Pages stop rendering their own "Could not load…" messages. Queries retry once before an error reaches the handler. Mutations retry only as described in Loading and refetching (at most once, network errors only, idempotent endpoints only).
- **One exception, unchanged:** `LoadingGate`'s in-progress check runs before the app renders and deliberately fails open (`documentation/ARCHITECTURE.md` § Frontend). It isn't a store read, so it stays as it is.
- For the LLD: whether a failed *background* refetch of tasks already on screen opens the dialog too, or stays silent until the next refetch. The default here is the dialog, for consistency.

## Storybook

Page stories need a way to provide store data once pages read from the store instead of fetching it themselves. Each story gets a fresh `QueryClient` seeded with fixtures, with no running API. This replaces the story-only `initialState` props on `TasksPage`, `TaskDetailPage` and `InProgressPage`. Presentational stories don't change. The details (the decorator, how loading, error and mutation states are faked) are in the LLD.

## Later moves (§ 30, § 31, § 42)

- **§ 30:** tasks and ranking results move to `data/tasks.ts` and `data/ranking.ts`. `refreshAfterMutation()` goes away. An action updates the visible rank entry optimistically (removing a completed, deleted or started task) and invalidates `["rank"]`, so other slides refetch when the user next views them. Snooze can do the same, or just invalidate. § 30 decides. Two API changes come first, and both are tracked in § 30. `POST /api/tasks` gets the same treatment contexts get here: validation, an idempotent retry (same id + same data returns the row with 200, different data is a 409) and ownership checks on `contextId` and `parentId`. `/api/rank` filters by `contextId` instead of the context name.
- **§ 31:** its "each page owns its own fetch" premise changes. A refresh becomes "invalidate the active queries", so pages don't need to register refetch functions. § 56's last item updates § 31's wording.
- **§ 42:** rename and archive become mutations in `data/contexts.ts`. Like create, they update the cached list in place, and the server's response reconciles the row with no refetch (see the invalidation table).

## Data-management rules and `guidelines/STORE_BEST_PRACTICES.md` (outline)

**Decided (user):** besides the rules, this feature produces `guidelines/STORE_BEST_PRACTICES.md`. It states the principles behind this plan in general terms, not tied to contexts, so later work on the store (tasks and ranking in § 30, rename and archive in § 42, new entities) applies the same ones. It sits next to `guidelines/COMPONENT_BEST_PRACTICES.md`. `apps/web/CLAUDE.md` gets a short section that states the hard rules and points to it, the way `AGENTS.md` points to the component guide. The decision itself goes in `documentation/ARCHITECTURE.md` § Frontend. All three are written after this HLD is approved. Outline:

1. **What the store holds.** Server data only: cached copies of what the server owns. The server is the source of truth, and anything in the cache can be thrown away and refetched. UI state stays in the Page/Container component that owns it.
2. **Where it lives.** One module per entity in `src/data/<entity>.ts`. It holds the entity's query keys, read hooks, mutation hooks, and its optimistic, dedupe, reconcile and invalidation rules. Nothing else holds server data.
3. **Refer to data by key, not by string.**
   - Entities refer to each other by id, never by name or another display string. API requests and responses carry ids (`contextId`, not the context's name), and a page resolves the display name from the store. That way a rename changes one row and nothing else goes out of date.
   - Query keys come from each module's key factory (`contextKeys.all`, `rankKeys.slide(contextId, params)`), never from array or string literals written at the call site, so a key and every place that invalidates it can't drift apart.
4. **Choose a freshness rule per entity, on purpose.** Write down when the data is stale and what's shown then. The three rules used so far: loaded once per session and changed only through the store (contexts), shown stale while refetching (tasks), and never shown stale (ranking results).
5. **How pages read.** Only Page/Container components call `data/` hooks. They pass plain values and `on*` callbacks to presentational components. A loading state appears only when there's nothing to show yet, never for a background refetch.
6. **How mutations work.** Every create, update and delete goes through a `data/` mutation hook. It applies the change optimistically, dedupes, sends the request, reconciles server-assigned fields from the response, and invalidates only what the change affects. Each mutation has an entry in the entity's invalidation table. New entities get client-generated ids (`crypto.randomUUID()`). A mutation that references an entity still being created waits for that create.
7. **Validation happens in three places, from one rule.** The form checks as the user types, the store checks before sending, and the server checks too, because the cache can be behind the server. The client-side rule is one shared function.
8. **API contract for creates.** Accept a client id. Never overwrite an existing row. A retry with the same id and the same data returns the existing row, and a conflict returns 409 with a machine-readable `code`.
9. **Errors are handled centrally.** All calls go through `apiFetch`. Every error reaches the one `QueryCache`/`MutationCache` handler, which opens the central dialog. A call with a specific, expected rejection declares it on its definition and handles only that one. No snapshot rollback.
10. **What components may not do:**
    - keep a copy of store data in `useState`, or derive a "plus what I created" list (the `addedContexts` pattern)
    - call `fetch` or `services/` (only `data/` does)
    - use `useQueryClient` or `@tanstack/react-query` outside `data/` (and the app root)
    - dedupe or merge server data
    - catch backend errors themselves
    - presentational components: import from `data/` at all
11. **Adding an entity.** A checklist: keys, a read hook, mutation hooks, a freshness rule, invalidation-table entries, expected errors, and tests against a fresh `QueryClient` with `fetch` stubbed.

## Decisions

1. **Store: C (TanStack Query).** B stays the alternative if ranking results and tasks won't move in.
2. **Ids: client-generated permanent ids** for contexts, with the `POST /api/contexts` contract above (optional `id`, name validation, 200 for an idempotent retry, 409 with `code`).
3. **Stale times and cache removal** are as in the table. Contexts are loaded once per session, never go stale, and every change to them updates the store in place. Tasks are shown stale and refetched in the background. Ranking results, and any task data on the ranking page, are never shown stale (1 min fresh window).
4. **Central error handling.** Every backend error goes through `apiFetch` and one `QueryCache`/`MutationCache` handler. Only rejections declared as expected are handled elsewhere.
5. **Failure path:** a one-button `ConfirmDialog` then refresh for unexpected failures, a targeted removal for `name_taken`, no snapshot rollback.
6. **The failure dialog is § 31's central mechanism,** mounted at the app root, built before § 56's store migration.

## Out of this HLD (for the LLD)

- Exact hook signatures, the `data/` module layout, and the query-key factory.
- How dependent mutations are ordered (`scope` vs awaiting the pending create).
- Whether to add `@testing-library/react` for hook tests, or test the data layer only against `QueryClient`.
- The Storybook decorator, and how stories fake loading, error and mutation states.
- Whether the form selects the existing context on a duplicate name.
