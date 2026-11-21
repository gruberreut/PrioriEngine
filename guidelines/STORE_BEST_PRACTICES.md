# Store Best Practices

Permanent reference for server data in `apps/web`. Applies to every entity the store holds, now and later (§ 30 tasks and ranking, § 42 context rename and archive, new entities). The reasoning behind these rules is in [`documentation/techDesign/client-data-store/hld.md`](../documentation/techDesign/client-data-store/hld.md).

> **Status: draft.** Written ahead of the § 56 LLD, and finalised when the LLD is approved.

The store is the TanStack Query cache, plus one `data/` module per entity that holds that entity's rules.

---

## 1. What the store holds

- **Server data only:** cached copies of data the server owns. The server is the source of truth. Anything in the cache can be thrown away and fetched again.
- **UI state stays out of it.** Carousel position, form fields, open dialogs and similar state stay in the Page/Container component that owns them (see `COMPONENT_BEST_PRACTICES.md`).

## 2. Where it lives

- **One module per entity: `src/data/<entity>.ts`.** It holds the entity's query-key factory, its query options, read hooks, mutation hooks, and its optimistic, dedupe, reconcile and invalidation rules.
- **`src/services/` is the plain `fetch` layer,** and every call goes through `apiFetch`. Only `data/` calls `services/`.
- **Nothing else holds server data.**

## 3. Refer to data by key, not by string

- **Entities refer to each other by id,** never by name or another display string. API requests and responses carry ids (`contextId`, not the context's name), and a page looks up the display name in the store. A rename then changes one row, and nothing else goes out of date.
- **Query keys come from the module's key factory** (`contextKeys.all`, `rankKeys.slide(contextId, params)`), never from array literals written at the call site. A key and every place that invalidates it can't drift apart.

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

## 6. Changing data

- **Every create, update and delete goes through a `data/` mutation hook.**
- **Cache logic goes in the `useMutation` definition; UI reactions go on the call.** The definition holds the optimistic change, the reconcile and the invalidation, and always runs. A page passes only UI reactions on `mutate(input, { onSuccess, onError })`. Components use `mutate`, never `mutateAsync`.
- **Optimistic changes are written to the cache with `setQueryData`,** so every page sees them.
- **`onMutate` starts with `await cancelQueries(...)`** for the keys it changes, so an older response can't overwrite the optimistic change.
- **Updaters are immutable:** return new objects and arrays, never change the old ones.
- **Reconcile server-assigned fields** (e.g. `slideIndex`) from the response in `onSuccess`. The server's value wins.
- **Invalidate only what the change affects.** Each mutation has an entry in the entity's invalidation table.
- **Invalidate after the last pending mutation of the entity settles.** The entity's mutations share a `mutationKey`, and `onSettled` invalidates only when `isMutating({ mutationKey }) === 1`. Mutations still run in parallel.
- **New entities get client-generated ids** (`crypto.randomUUID()`).
- **A mutation that depends on a pending create shares its `scope`** (e.g. `scope: { id: "context:<id>" }`), so it waits for the create. Unrelated mutations run in parallel.
- **No automatic retries by default.** At most one retry, on network errors only, for endpoints that are idempotent.

## 7. Validation happens in three places, from one rule

The form checks as the user types, the store checks before sending, and the server checks too, because the cache can be behind the server. The client-side check is one shared function used by both the form and the store.

## 8. API contract for creates

- Accept a client-generated id.
- Never overwrite an existing row, especially another user's.
- A retry with the same id and the same data returns the existing row (200).
- A conflict returns 409 with a machine-readable `code`.

## 9. Errors

- **Every call goes through `apiFetch`,** which turns a network error or a non-OK response into an `ApiError` (`status`, `code`, body).
- **Unexpected errors are handled centrally.** The `QueryCache`/`MutationCache` `onError` handlers open the central failure dialog, and its OK refreshes the active queries.
- **Expected errors are declared, not caught.** A query or mutation lists its expected rejections in `meta.expectedErrors`, and the central handler skips them.
  - The definition in `data/` handles the store side (e.g. removing the rejected optimistic row).
  - The page **reads** the error from the mutation's state to show it (e.g. `error?.code === "name_taken"`), or reacts in a call-level `onError`.
- **Components never catch backend errors.**
- **No snapshot rollback.** A rejected optimistic change is removed either by the targeted handling of an expected error, or by the refresh after an unexpected one.

## 10. What components may not do

- Keep a copy of store data in `useState`, or build a "plus what I created" list
- Call `fetch` or `services/` (only `data/` does)
- Use `useQueryClient` or `@tanstack/react-query` outside `data/` and the app root
- Pass inline `select` functions
- Dedupe or merge server data
- `try/catch` backend errors, or use `mutateAsync`
- Presentational components: import from `data/` at all

## 11. Adding an entity

- [ ] Key factory
- [ ] Query options and read hooks, with module-level selectors
- [ ] Mutation hooks, sharing one `mutationKey`
- [ ] A freshness rule (section 4)
- [ ] Entries in the invalidation table
- [ ] Expected errors declared in `meta.expectedErrors`
- [ ] Tests against a fresh `QueryClient`, with `fetch` stubbed
