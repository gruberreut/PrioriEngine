# Client data store — LLD

Tracked in `tasks/TASKS-TECH.md` § 56. Status: draft. Notes collected during the TanStack Query study session; the full LLD is written after the session and then approved.

High-level design: [`hld.md`](hld.md).

## Notes to carry into the LLD

a. **Contexts use `staleTime: Infinity`, not `'static'`.** `invalidateQueries()` has no effect on `'static'`, and the failure path refreshes by invalidating. Since there's no snapshot rollback, that refresh is the only thing that removes a failed optimistic row; with `'static'`, a context the server never saved would stay in the cache all session.

b. **"Ranking results are never shown stale" goes against TanStack's default**, which shows stale data while refetching. Design it explicitly, e.g. a wrapper hook in `data/ranking.ts` that reports a loading state while the data is stale and a fetch is running.

c. **Selectors live in `data/` modules,** defined at module level and exposed as named hooks (e.g. `useContextNames()`). A selector that needs a parameter is memoised with `useCallback` inside the hook. Components never pass inline `select` functions. Reason: an inline function is a new object on every render, so `select` re-runs every render.

d. **Every `queryFn` passes its `signal` through to `apiFetch`,** and `apiFetch` accepts a signal. Reason: unmounting and `cancelQueries` then actually cancel the request, and an old response is never written over an optimistic change.

e. **`initialData` only for real data for that key from the server; `placeholderData` only for stand-ins,** and not for ranking results (the HLD already rejects it there).

f. **At most one automatic retry, on network errors only, for mutations whose endpoint is idempotent** (context create, once `POST /api/contexts` accepts client ids). Never on 4xx; on 5xx only if the endpoint is known to be safe. Not for tasks until § 30 makes `POST /api/tasks` idempotent. Reason: a retry of a non-idempotent create can create the row twice.

g. **No `useSuspenseQuery` for now.** Pages use the `isPending` style the HLD describes.

h. **Cache logic lives in the `useMutation` definition in `data/`; UI reactions go on the call.** The optimistic change, the reconcile and the invalidation are defined once, in the entity's module, where they always run. A page passes only UI reactions on `mutate(input, { onSuccess, onError })`, such as closing the add-context field; those run only if the page is still mounted. Components use `mutate`, never `mutateAsync`.

i. **Optimistic changes are written to the cache with `setQueryData`,** so every page sees them. Rendering `mutation.variables` as a pending row is not used: only the component holding the mutation would see it.

j. **Every `onMutate` starts with `await queryClient.cancelQueries(...)`** for the keys it's about to change, then writes the optimistic change. Every `setQueryData` updater returns new objects and arrays and never mutates the old ones, because React and TanStack detect changes by reference.

k. **Invalidation waits until the last pending mutation of an entity settles.** Each entity's mutations share a `mutationKey`, and `onSettled` invalidates only when `queryClient.isMutating({ mutationKey }) === 1`. The mutations themselves still run in parallel. Reason: a refetch started by an earlier mutation's invalidation can land before a later mutation is saved, and wipe its optimistic change.

l. **Dependent creates are ordered with `scope`.** A create that references an entity still being saved shares that entity's scope id, e.g. `scope: { id: "context:<contextId>" }` on both the context create and a task create inside it, so the task's request waits until the context exists on the server. Unrelated mutations have different scope ids and run in parallel. This settles the HLD's open question (`scope` vs awaiting the pending create).

m. **Expected errors are handled in three layers.** The central `MutationCache.onError` skips any error whose `code` is listed in the mutation's `meta.expectedErrors`, and opens the failure dialog for everything else. The mutation's definition in `data/` handles the store side of an expected error (for `name_taken`: remove the optimistic row, add the existing context from the 409 body). The page shows it by reading the mutation's state (e.g. `createContext.error?.code === "name_taken"`), or reacts in a call-level `onError`. No component catches errors.

n. **A "Saving…" indicator, if wanted,** reads `useIsMutating` or `useMutationState` in the page. It's never kept in local state.
