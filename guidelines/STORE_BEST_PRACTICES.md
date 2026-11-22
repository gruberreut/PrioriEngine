# Store Best Practices

Permanent reference for server data in `apps/web`. Applies to every entity the store holds, now and later (§ 30 tasks and ranking, § 42 context rename and archive, new entities). The reasoning behind these rules is in [`documentation/techDesign/client-data-store/hld.md`](../documentation/techDesign/client-data-store/hld.md).

The concrete design these rules come from is the § 56 LLD, [`lld.md`](../documentation/techDesign/client-data-store/lld.md). `src/data/core/` is built. The entity modules and `src/domain/` are built from § 56 on (`tasks/TASKS-TECH.md`).

The store is the TanStack Query cache, plus one `data/` module per entity that holds that entity's rules.

---

## 1. What the store holds

- **Server data only:** cached copies of data the server owns. The server is the source of truth. Anything in the cache can be thrown away and fetched again.
- **UI state stays out of it.** Carousel position, form fields, open dialogs and similar state stay in the Page/Container component that owns them (see `COMPONENT_BEST_PRACTICES.md`).

## 2. Where it lives

- **One module per entity: `src/data/<entity>.ts`.** It holds the entity's query-key factory, its query options, read hooks, mutation hooks, and its optimistic, dedupe, reconcile and invalidation rules.
- **Shared wiring lives in `src/data/core/`:** the `QueryClient` factory, the shared scope ids, and `DataStoreContainer` (the provider and the failure dialog). It holds no entity logic.
- **`src/services/` is the plain `fetch` layer,** and every call goes through `apiFetch`. Only `data/` calls `services/`.
- **Nothing else holds server data.**

## 3. Refer to data by key, not by string

- **Entities refer to each other by id,** never by name or another display string. API requests and responses carry ids (`contextId`, not the context's name), and a page looks up the display name in the store. A rename then changes one row, and nothing else goes out of date.
- **Query keys and mutation keys come from the module's key factory** (`contextKeys.all`, `rankKeys.slide(contextId, params)`), never from array literals written at the call site. A key and every place that invalidates it can't drift apart.

## 4. Choose a freshness rule per entity, on purpose

Write down when the entity's data is stale and what the user sees then. The rules used so far:

| Rule | Example | How |
|---|---|---|
| Loaded once per session, changed only through the store | Contexts | `staleTime: Infinity`, `gcTime: Infinity` |
| Shown stale while it refetches in the background | Tasks | A short `staleTime`; TanStack's default behaviour |
| Never shown stale | Ranking results | A short fresh window; built explicitly, because TanStack shows stale data by default |

- **Use `staleTime: Infinity`, not `'static'`, for data that must still be refreshable.** `invalidateQueries()` has no effect on `'static'`, and the failure path refreshes by invalidating.
- **`initialData` only for real data for that key from the server.** `placeholderData` only for stand-ins shown while loading, and never where showing the wrong data would mislead (e.g. ranking results for other params).

## 5. Reading data

- **Only Page/Container components call `data/` hooks.** They pass plain values and `on*` callbacks to presentational components.
- **Selectors live in `data/`,** defined at module level and exposed as named hooks (e.g. `useContextNames()`). A selector that needs a parameter is memoised with `useCallback` inside the hook. Components never pass inline `select` functions: a new function on every render makes `select` run again on every render.
- **Every `queryFn` passes its `signal` to `apiFetch`,** so unmounting and `cancelQueries` actually cancel the request.
- **A loading state appears only when there's nothing to show yet,** never for a background refetch, except where the entity's freshness rule says otherwise.
- **Refetch on window focus and on reconnect only when the data is stale** (TanStack's default with a `staleTime` set). Don't set `'always'`.
- **No `useSuspenseQuery` for now.** Pages read the loading flag the `data/` hook returns and render their own loading state.
- **`data/` hooks return their own small shapes** (plain values and functions), not TanStack's result objects, so pages never depend on TanStack types.

## 6. Changing data

- **Every create, update and delete goes through a `data/` mutation hook.**
- **Cache logic goes in the `useMutation` definition; UI reactions stay in the page.** The definition holds the optimistic change, the reconcile and the invalidation, and always runs. `data/` hooks call `mutate`, never `mutateAsync`, and return plain functions and values. The page reacts to what the hook returns (e.g. a create function's result).
- **A mutation hook tracks only its latest call.** If `mutate` is called again before the previous call settles, the earlier call's call-level callbacks never fire, and the hook's `error` and status show only the latest call. The definition-level callbacks still run for every call, so the cache stays correct. Where the user needs feedback for each call, either block a new call until the current one settles (context create does this), or read each call's state through `useMutationState` in a `data/` hook.
- **Optimistic changes are written to the cache with `setQueryData`,** so every page sees them.
- **`onMutate` starts with `await cancelQueries(...)`** for the keys it changes, so an older response can't overwrite the optimistic change.
- **Updaters are immutable:** return new objects and arrays, never change the old ones.
- **Reconcile server-assigned fields** (e.g. `slideIndex`) from the response in `onSuccess`. The server's value wins. The reconcile is an upsert by id, so a row that a refetch removed while the mutation was pending comes back.
- **Invalidate only what the change affects.** Each mutation has an entry in the entity's invalidation table: what it updates optimistically and what it invalidates once it settles.
- **The invalidation table is documented next to the code it describes.** For a small entity, that's one comment table at the top of its `data/<entity>.ts` module. For a larger entity, document each part next to the part of the module it belongs to (e.g. next to each mutation hook or key group) instead of one big table at the top.
- **Invalidate after the last pending mutation of the entity settles.** The entity's mutations share a `mutationKey`, and `onSettled` invalidates only when `isMutating({ mutationKey }) === 1`. Mutations still run in parallel, except creates in a shared scope (below).
- **New entities get client-generated ids** (`crypto.randomUUID()`).
- **A mutation that references an entity still being created waits for that create** to reach the server. Creates that can depend on each other share one fixed `scope` id, defined once in `data/`, so TanStack sends them in order. (`scope` is set on the hook, not per `mutate` call.) Before sending, a dependent create resolves the id it references: if that create was merged into an existing entity (e.g. a context name already taken), the dependent uses the existing id. If the create failed for a technical reason, the dependent stops without sending. (Not built yet: until `tasks/TASKS-TECH.md` § 62, it's sent and fails too, adding nothing to the dialog already open.)
- **Never block the user while offline.** A mutation made offline is paused, not failed, and sent on reconnect. Any UI that waits for a mutation (e.g. one context create at a time) waits only while it's actually being sent (`isPending && !isPaused`).
- **Mutations don't retry by default.** A mutation whose endpoint is idempotent by client id retries at most once, on network errors only, never on an HTTP error response. A retried non-idempotent create can create the row twice. (Queries retry once; see section 9.)

## 7. Validation happens in three places, from one rule

The form checks as the user types, the store checks before sending, and the server checks too, because the cache can be behind the server. The client-side check is one shared function used by both the form and the store. It lives in `src/domain/`, the home for pure domain rules (no React, no I/O), which both `data/` and components may import.

## 8. API contract for creates

- Accept a client-generated id, and validate it (a UUID, otherwise 400). Validate required fields too (400).
- Check that every id the request references (e.g. `contextId`, `parentId`) belongs to the user.
- Never overwrite an existing row. An id that belongs to another user gets a 409 with a generic message that reveals nothing about that row.
- A new row returns 201. A retry with the same id and the same data returns the existing row with 200, and the client treats both as success. Server-assigned fields (e.g. `slideIndex`) aren't part of "the same data".
- Any other conflict returns 409 with a machine-readable `code`.

## 9. Errors

- **Two kinds of error, handled differently.** Ask: can the user fix it by changing what they entered?
  - **Yes: a user-correctable error** (e.g. a context name that's already taken, a validation error on the user's input). It's shown where the user acted, the user corrects their input, and nothing is refreshed. It's declared as expected (below).
  - **No: a technical error** (network unavailable, a failed save, a 5xx, an id conflict, any 4xx the user can't fix). Only reloading the data as it exists on the server recovers from it, so it goes to the central failure dialog, and its OK refreshes.
- **Every call goes through `apiFetch`,** which turns a network error or a non-OK response into an `ApiError` (`status`, `code`, body).
- **Technical errors are handled centrally.** The `QueryCache`/`MutationCache` `onError` handlers log each one with `console.error` and open the central failure dialog (§ 31). Many errors show one dialog. Its OK invalidates every query, so active ones refetch at once. The handlers run only after the last retry fails. Queries retry once, on network errors and 5xx only.
- **Expected (user-correctable) errors are declared, not caught.** A query or mutation lists them in `meta.expectedErrors`, and the central handler skips them.
  - The definition in `data/` handles the store side (e.g. replacing the rejected optimistic row with the existing one).
  - The page shows the error from what the `data/` hook returns (e.g. a `nameTakenMessage`).
- **Components never catch backend errors.**
- **No snapshot rollback.** A rejected optimistic change is removed either by the targeted handling of an expected error, or by the refresh after an unexpected one.
- **One exception:** `LoadingGate`'s in-progress check runs before the app renders and fails open (`documentation/ARCHITECTURE.md` § Frontend). It isn't a store read.

## 10. Storybook and tests

- **Page stories get a fresh `QueryClient` per story, seeded with fixtures,** through the shared decorator. No running API, and no story-only props (such as `initialState`) to inject data.
- **Presentational stories don't involve the store.** They pass props, as before.
- **Data-layer tests use a fresh `QueryClient` per test,** with `fetch` stubbed.

## 11. What components may not do

- Keep a copy of store data in `useState`, or build a "plus what I created" list
- Mirror request or mutation status in `useState` (read it from the query or mutation instead)
- Call `fetch` or `services/` (only `data/` does)
- Use `useQueryClient` or `@tanstack/react-query` outside `data/`, the app root, the Storybook decorator and tests
- Dedupe or merge server data
- `try/catch` backend errors, or use `mutateAsync`
- Presentational components: import from `data/` at all

`data/` read hooks don't take selector functions as arguments. Each selector is a named hook in the module (section 5).

## 12. Adding an entity

- [ ] Key factory, for query keys and the mutation key
- [ ] Query options and read hooks, with module-level selectors
- [ ] Mutation hooks, sharing one `mutationKey`
- [ ] A freshness rule (section 4)
- [ ] Entries in the invalidation table
- [ ] Expected errors declared in `meta.expectedErrors`
- [ ] Its create endpoint follows section 8
- [ ] Fixtures for seeding page stories
- [ ] Tests against a fresh `QueryClient`, with `fetch` stubbed
