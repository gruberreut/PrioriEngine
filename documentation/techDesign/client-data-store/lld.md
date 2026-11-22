# Client data store — LLD

Tracked in `tasks/TASKS-TECH.md` § 56. Status: approved (user), as a whole and section by section. The notes (a–n) were collected during the TanStack Query study session and refined while the design was written; the § Design sections build on them.

High-level design: [`hld.md`](hld.md).

## Notes to carry into the LLD

a. **Contexts use `staleTime: Infinity`, not `'static'`.** `invalidateQueries()` has no effect on `'static'`, and the failure path refreshes by invalidating. Since there's no snapshot rollback, that refresh is the only thing that removes a failed optimistic row; with `'static'`, a context the server never saved would stay in the cache all session.

b. **"Ranking results are never shown stale" goes against TanStack's default**, which shows stale data while refetching. Design it explicitly, e.g. a wrapper hook in `data/ranking.ts` that reports a loading state while the data is stale and a fetch is running. Two cases it has to cover (§ 30):
   - **The HLD's exception.** After § 30's optimistic edit of the visible slide, `setQueryData` followed by `invalidateQueries(["rank"])` makes the entry stale and fetching. The wrapper must keep showing the edited list in that case, not switch to loading.
   - **A slide left open.** `staleTime` passing doesn't start a fetch, so a slide on screen for more than a minute stays stale with no fetch running. No refetch is wanted while the user stays on the page. Instead, invalidate when the page regains focus after being away for a set time; tracked in § 30.

c. **Selectors live in `data/` modules,** defined at module level and exposed as named hooks (e.g. `useContextNames()`). A selector that needs a parameter is memoised with `useCallback` inside the hook. Components never pass inline `select` functions. Reason: an inline function is a new object on every render, so `select` re-runs every render.

d. **Every `queryFn` passes its `signal` through to `apiFetch`,** and `apiFetch` accepts a signal. Reason: unmounting and `cancelQueries` then actually cancel the request, and an old response is never written over an optimistic change.

e. **`initialData` only for real data for that key from the server; `placeholderData` only for stand-ins,** and not for ranking results (the HLD already rejects it there).

f. **At most one automatic retry, on network errors only, for mutations whose endpoint is idempotent** (context create, once `POST /api/contexts` accepts client ids). Never on an HTTP error response. Not for tasks until § 30 makes `POST /api/tasks` idempotent. Reason: a retry of a non-idempotent create can create the row twice.

g. **No `useSuspenseQuery` for now.** Pages use the `isPending` style the HLD describes.

h. **Cache logic lives in the `useMutation` definition in `data/`; UI reactions stay in the page.** The optimistic change, the reconcile and the invalidation are defined once, in the entity's module, where they always run. `data/` hooks call `mutate`, never `mutateAsync`, and return plain functions and values (§ Design 4). The page reacts to what the hook returns, such as `createContext`'s result closing the add-context field. Where a hook passes call-level callbacks through, they run only if the page is still mounted, and only for the latest call (note m).

i. **Optimistic changes are written to the cache with `setQueryData`,** so every page sees them. Rendering `mutation.variables` as a pending row is not used: only the component holding the mutation would see it.

j. **Every `onMutate` starts with `await queryClient.cancelQueries(...)`** for the keys it's about to change, then writes the optimistic change. Every `setQueryData` updater returns new objects and arrays and never mutates the old ones, because React and TanStack detect changes by reference.

k. **Invalidation waits until the last pending mutation of an entity settles.** Each entity's mutations share a `mutationKey`, and `onSettled` invalidates only when `queryClient.isMutating({ mutationKey }) === 1`. The mutations themselves still run in parallel, except creates in the shared scope (note l). Reason: a refetch started by an earlier mutation's invalidation can land before a later mutation is saved, and wipe its optimistic change. Contexts invalidate nothing, so this first applies to tasks (§ 30). For every entity, the reconcile in `onSuccess` is an upsert by id, not "replace if present", so a row that a refetch removed while its create was pending comes back.

l. **Dependent creates share one fixed `scope` (decided, user).** Every create that can reference another entity, or be referenced by one (context create and task create now), uses the same scope id, defined once in `data/`. TanStack then sends them one after another, so a task's request never reaches the server before its context exists. This settles the HLD's open question (`scope` vs awaiting the pending create).
   - **Why a fixed scope.** `scope` is a `useMutation` option, fixed per hook instance, and `mutate(variables, options)` accepts only `onSuccess`, `onError` and `onSettled`. So a per-call scope such as `"context:<contextId>"` isn't possible with `useMutation`. The fixed scope needs no extra code and works with persisted mutations (§ 15). Since context creates already run one at a time (note m) and the UI is optimistic, sending creates in order costs the user nothing visible.
   - **A dependent whose parent failed.** A queued create is still sent after the one before it fails. So a task create's `mutationFn` first resolves its context id (`resolveContextId`, note m), which redirects it to the existing context after `name_taken`. If the context is gone for any other reason (a technical failure, which already opened the dialog), it stops without sending.
   - **Rejected:** awaiting the pending create through a map of promises in `data/contexts.ts` (code we'd maintain, and it doesn't survive § 15's persistence), and a `MutationObserver` per call (it bypasses `useMutation`'s state, and its callbacks can fire after the page unmounts).
   - **Revisit** if sending creates in order becomes a real problem.

m. **Two kinds of error (decided, user).** A user-correctable error (the user can fix it by changing their input, e.g. `name_taken`) is shown where the user acted and refreshes nothing. A technical error (network unavailable, a failed save, a 5xx, `id_conflict`) goes to the central dialog and a refresh. Only user-correctable errors are declared in `meta.expectedErrors`.

   **A mutation hook tracks only its latest call.** Call-level callbacks and the hook's `error` show only the last `mutate`. For context create this is solved in the UX: the form doesn't allow a second create while the current one is being sent (decided, user), so the `name_taken` message belongs to the current call. The create is still optimistic (decided, user): the new context is in the cached list, and can be selected, as soon as Add is pressed.

   **Offline, nothing blocks (decided, user).** With TanStack's default `networkMode: "online"`, a mutation made while the browser is offline is paused, not failed, and sent on reconnect. Add is blocked only while a create is actually being sent (`isPending && !isPaused`), not while it's paused. So offline the user can keep adding contexts and creating tasks in them, and every change waits in the cache. The form reads online state through the mutation's `isPaused`, or `onlineManager` from `@tanstack/react-query`. Paused mutations live only in memory and are lost on a reload; keeping them is § 15's.

   **`name_taken` merges into the existing context (decided, user).** Same name means the same context. The mutation's `onError` in `data/contexts.ts`:
   1. removes the optimistic row and adds the existing context from the 409 body, if it isn't cached already;
   2. records `optimisticId → existingId` in a session-lived map in `data/contexts.ts`, read through `resolveContextId(id)`.

   The task create's `mutationFn` sends `resolveContextId(contextId)`, so a task queued behind the rejected context goes to the existing one (this replaces the "stop without sending" check in note l for this case). A page holding a selected context id (the task form) resolves it the same way, so the form shows the existing context selected. If the form is still showing that create, it also shows an inline "already exists, using it" message. If not (e.g. it was created offline and rejected after reconnect), the merge happens without a message. This is the one place an id is rewritten, and it's limited to creates still queued in the shared scope. Rejected: renaming the new context (`garden-2`, "copy of garden"), which creates a context the user didn't ask for. Later mutations that need per-call feedback while several run at once read it through `useMutationState` in a `data/` hook.

   **Expected errors are handled in three layers.** The central `MutationCache.onError` skips any error whose `code` is listed in the mutation's `meta.expectedErrors`, and opens the failure dialog for everything else. The mutation's definition in `data/` handles the store side of an expected error (for `name_taken`: remove the optimistic row, add the existing context from the 409 body). The page shows it from what the `data/` hook returns (e.g. `useCreateContext().nameTakenMessage`, § Design 4). No component catches errors.

n. **A "Saving…" indicator, if wanted,** reads `useIsMutating` or `useMutationState` in the page. It's never kept in local state.

## Design

### 1. `apiFetch` and `ApiError` (approved, user)

Every `services/` function calls the API through one helper, so every failure reaches the store in the same shape.

```ts
// src/services/apiFetch.ts
export class ApiError extends Error {
  readonly kind: "network" | "http";  // network: no response at all
  readonly status: number | null;     // null when kind is "network"
  readonly code: string | undefined;  // body.code, e.g. "name_taken"
  readonly body: unknown;             // parsed JSON body, if any
}

export async function apiFetch<T>(
  path: string,
  options?: { method?: string; body?: unknown; signal?: AbortSignal },
): Promise<T>;
```

- `body` is serialised as JSON, and `Content-Type: application/json` is set only when there is a body.
- If `fetch` rejects, `apiFetch` throws `ApiError` with `kind: "network"`. The mutation retry rule (note f) checks exactly this.
- An `AbortError` (from `signal`) is rethrown unchanged, so TanStack treats it as a cancellation, not a failure.
- A non-OK response throws `ApiError` with `kind: "http"`, the status, and `code` taken from the parsed body when there is one.
- On success it returns the parsed JSON, or `undefined` for a 204. 200 and 201 are both success.
- API error bodies stay `{ error: string, code?: string, ...extra }`. For example, `name_taken` adds `context: ContextItem`.
- Every `services/` function is rewritten on `apiFetch` and accepts an optional `signal`. Names and return types stay the same, so pages that haven't moved into the store keep working.

### 2. `QueryClient` and the central error handler (approved, user)

```ts
// src/data/core/queryClient.ts
export function createQueryClient(options: { onTechnicalError: () => void }): QueryClient; // DataStoreContainer, stories and tests call this
export function retryOnceOnNetworkError(failureCount: number, error: ApiError): boolean;
```

- `DataStoreContainer` (§ 3) creates the client and provides it above `<BrowserRouter>`.
- **Query defaults.** Retry once, on network errors and 5xx only. Retrying a 400 or 404 gets the same answer. Refetch on focus and on reconnect stays TanStack's default, which refetches only stale data.
- **No global `staleTime` or `gcTime`.** Each entity's query options set them explicitly (guide §4), so freshness is always chosen on purpose.
- **Mutation defaults.** No retry. A mutation with an idempotent endpoint (context create) sets `retry: retryOnceOnNetworkError` itself. This also fits § 15: a network failure of an idempotent call is exactly what can be queued and sent again once the network is back.
- **Central handler.** The client has a `QueryCache` and a `MutationCache` whose `onError` checks the error's `code` against the query's or mutation's `meta.expectedErrors`. A listed code is a user-correctable error, which the owning code handles, so the handler does nothing. Anything else is a technical error: the handler logs it (§ 3) and calls `onTechnicalError`.
- **Only after retries.** TanStack calls the cache `onError` only once the last attempt has failed, so a failure that a retry recovers from never reaches the handler or the dialog.
- **Types.** TanStack's `Register` interface is extended so errors are typed as `ApiError` and `meta` as `{ expectedErrors?: string[] }`, with no casts at the call sites.

### 3. `data/` layout and the failure dialog (approved, user)

This is also the design for `tasks/TASKS-TECH.md` § 31 (the central failure dialog), which has no LLD of its own (decided, user).

```
src/data/
  core/
    queryClient.ts          createQueryClient, retryOnceOnNetworkError, Register types (§ 2)
    scopes.ts               the shared create scope id (note l)
    DataStoreContainer.tsx  the client, its provider, and the failure dialog
  contexts.ts               entity module: keys, hooks, rules, invalidation table
  tasks.ts                  (§ 30)
  ranking.ts                (§ 30)
```

Entity modules sit at the top of `data/`. The shared wiring is in `data/core/`, which holds no entity logic.

```tsx
// src/data/core/DataStoreContainer.tsx, rendered in main.tsx above <BrowserRouter>
export function DataStoreContainer({ children }: { children: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const [queryClient] = useState(() =>
    createQueryClient({ onTechnicalError: () => setFailed(true) }),
  );
  // renders <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  // and <ConfirmDialog open={failed} … onSelect={refresh} onCancel={refresh} />
}
// refresh: setFailed(false), then queryClient.invalidateQueries()
```

- **A callback, not a global.** The failure state belongs to the `DataStoreContainer` that created the client, so every story and test gets its own client and nothing leaks between them.
- **Many errors, one dialog.** `setFailed(true)` while the dialog is open changes nothing, so a context create failing, its queued task create, and a refetch all show one dialog. After OK, a new failure opens it again.
- **Waiting mutations are kept.** A pending or paused mutation is a change the user made, possibly offline, and removing it would discard it silently. A pending create comes back after the refresh through its upsert reconcile (note k). A dependent of the failed create stops on its own (note l). TanStack can't cancel a mutation whose request is in flight anyway.
- **Logged to the console.** The central handler calls `console.error` for every technical error, including those arriving while the dialog is open. Each entry has the `ApiError` (`kind`, `status`, `code`, `body`) and the query key, or the mutation key and variables. § 32 can later send the same information to error tracking.
- **OK and dismiss both refresh** with `invalidateQueries()` and no filter. Active queries refetch now. Inactive ones are marked stale and refetch when next read, since they may be wrong too. Contexts are included, which is why they use `staleTime: Infinity` (note a).
- **Copy.** Title "Something went wrong", description "Your last change couldn't be saved. The page will refresh.", and one "OK" button. Load failures use the same text.
- **Tests:** a failure that the retry recovers from opens no dialog; a first attempt and a retry that both fail open it once; several failures open one dialog; OK invalidates every query; and an expected error opens nothing.

### 4. `data/contexts.ts` (approved, user)

```ts
// src/data/contexts.ts
export const contextKeys = {
  all: ["contexts"] as const,              // the list query
  create: ["contexts", "create"] as const, // the mutation key
};

export function useContexts(): { contexts: ContextItem[]; isLoading: boolean };

export function useCreateContext(): {
  createContext(name: string): CreateContextResult;
  isSending: boolean;           // isPending && !isPaused: Add is disabled only while true
  nameTakenMessage: string | null;
  reset(): void;                // clears the message, e.g. when the user types
};
type CreateContextResult =
  | { status: "created"; context: ContextItem }     // the optimistic row, final id
  | { status: "duplicate"; existing: ContextItem }; // caught before sending

export function resolveContextId(id: string): string; // the merge map (note m)
```

- **Hooks return their own small shapes,** not TanStack's result objects, so pages never depend on TanStack types.
- **Query:** `getContextItems(signal)`, `staleTime: Infinity`, `gcTime: Infinity`, sorted by `slideIndex`.
- **`createContext(name)`:**
  1. Trims the name. If the cached list already has it, it returns `duplicate` with the existing context and sends nothing. The page selects that context and shows the message. This is how the store's pre-send check reaches the page: a return value, with no `mutateAsync`.
  2. Otherwise it generates `crypto.randomUUID()`, calls `mutate({ id, name })` and returns `created` with the optimistic row.
- **Mutation:** `mutationKey: contextKeys.create`, the shared create scope (note l), `retry: retryOnceOnNetworkError`, and `meta: { expectedErrors: ["name_taken"] }`.
  - `onMutate`: `cancelQueries(contextKeys.all)`, then it appends `{ id, name, slideIndex: predicted }` and re-sorts. The prediction is the server's formula: `((max ?? -1) + 1) % 8`.
  - `onSuccess`: upsert the server's row by id (the server's `slideIndex` wins), then re-sort.
  - `onError` with `name_taken`: merge into the existing context (note m). On a technical error it does nothing; the dialog's refresh removes the row.
- **Invalidation table** (a comment at the top of the module): "create: appends to `contextKeys.all`, invalidates nothing".
- **No create before the list has loaded.** Otherwise `cancelQueries` would cancel the first fetch, and the list would hold only the new context.
- **Pages and form:**
  - `TaskCreationPage` and `RankingPage` call `useContexts()` instead of `getContextItems()` in an effect.
  - `TaskCreationForm` loses `addedContexts`, `mergeContexts` and `contextLoading`.
  - Its `onCreateContext` prop becomes synchronous, `(name) => CreateContextResult`, and it gains `nameTakenMessage` and `addDisabled` props.

### 5. Shared domain rules: `src/domain/` (approved, user)

`isContextNameTaken(name: string, contexts: ContextItem[]): ContextItem | undefined` lives in `src/domain/contexts.ts`. It trims the name and compares it exactly, as the `(user_id, name)` unique constraint does, and returns the matching context so the caller can select it.

- `src/domain/` holds pure domain rules: no React, no I/O. Both `data/` and components may import from it, so the presentational `TaskCreationForm` and `data/contexts.ts` share one rule.
- The duplicate check is per user on both sides. The cached list holds only the user's own contexts, and the server's constraint is on `(user_id, name)`.
- Rejected: next to the form in `features/tasks/` (then `data/` would import from a feature folder), and `src/types/` (it holds type declarations only).

### 6. `POST /api/contexts` (approved, user)

**Request:** `{ id?: string (uuid), name: string }`

1. **Validate, 400 on failure.** The body is valid JSON, `id` is absent or a UUID, and `name` is a string that's non-empty after trimming. The form already blocks an empty name, so a 400 here is a technical error and carries no `code`.
2. **Insert** in the existing transaction: `slideIndex` from the same `MAX + 1` formula, the given `id` if there is one, and the trimmed `name`. `onConflictDoNothing().returning()` as today. A new row returns **201** with the row.
3. **No row returned**, still inside the transaction:
   - A row with this `id` **for this user, with the same name**: an idempotent retry. Return it with **200**. `slideIndex` isn't compared.
   - A row with this `id` **for another user, or for this user with a different name**: **409** `{ error: "Conflict", code: "id_conflict" }`. It's the same response in both cases, so it reveals nothing about another user's row.
   - No row with this `id`, or no `id` sent: look up this user's context with that name and return **409** `{ error: "Context name already taken", code: "name_taken", context }`.
4. **Any other failure** returns **500** `{ error: "Database error" }`, replacing today's catch-all 400.

**`openapi.yaml`:**
- The request gains an optional `id` (`format: uuid`), and `name` gets `minLength: 1`.
- The responses are 200 (idempotent retry), 201, 400, 409 and 500.
- `Error` gains an optional `code`.
- A new `ContextConflict` schema: `error`, `code` (`name_taken` | `id_conflict`), and `context` (a `Context`, for `name_taken` only).

**Real-DB tests:**
- create with an id, and without one;
- a retry returns 200 with the same row, and no second row is created;
- the same id with a different name gives `id_conflict`;
- another user's id gives `id_conflict`, with nothing from that row in the body (the test inserts the other user directly);
- a taken name gives `name_taken` with the existing row;
- the name is stored trimmed;
- a missing, empty, whitespace-only or non-string name gives 400;
- a non-UUID id gives 400;
- invalid JSON gives 400.

An archived context's name is a known gap, tracked in § 58 (low priority).

### 7. Task create in § 56, and page and form wiring (approved, user)

**Task creation moves into the store in § 56,** in its minimal form, because notes l and m only work if it's a store mutation: it must share the context create's scope and resolve its context id before sending. Without that, a task in a context that's still pending could reach the server first and fail on the foreign key.

```ts
// src/data/tasks.ts (§ 56: create only; § 30 adds the tasks cache and the other mutations)
export const taskKeys = { create: ["tasks", "create"] as const };

export function useCreateTask(): {
  createTask(input: Omit<CreateTaskPayload, "id">): Task; // returns the task as sent, with its client id
  isSending: boolean;                                     // isPending && !isPaused
};
```

- **Scope and context id.** The mutation uses the shared create scope (note l). Its `mutationFn` sends `resolveContextId(contextId)` (note m), and stops without sending if the context is gone after a technical failure. A subtask whose parent is still being created waits behind it in the same scope.
- **No retry.** `POST /api/tasks` isn't idempotent until § 30.
- **No tasks cache yet.** `TasksPage`, `TaskDetailPage`, `InProgressPage` and `LoadingGate` keep fetching as today until § 30. That's a tracked gap: a task created here appears on those pages when they next fetch.
- **Errors.** A failed save is a technical error and goes to the central dialog. `TaskCreationPage`'s own "Failed to save task" message is removed.

**`TaskCreationPage`:**
- It reads `useContexts()`, `useCreateContext()` and `useCreateTask()`.
- On submit it calls `createTask(...)` and adds the returned task to its "Added this session" list straight away. The id is final, so the task can be set as a parent at once, and the list doesn't depend on a success callback (so the "latest call only" caveat in note m doesn't apply).
- The form is reset, as today.

**`TaskCreationForm`:**
- **Props:**
  - `contexts`;
  - `onCreateContext: (name) => CreateContextResult`;
  - `nameTakenMessage`;
  - `addDisabled` (no list loaded yet, or a create being sent);
  - `submitDisabled` (a task create being sent; never while paused offline);
  - `onNewContextNameChange`, which lets the page call `reset()` to clear a server message.
- **As the user types a new name:** `isContextNameTaken(name, contexts)` from `src/domain/`. A taken name shows the inline "already exists" message and disables Add. An empty name keeps Add disabled.
- **On Add:**
  - `created`: the form selects the new context's id and closes the field.
  - `duplicate`: it selects the existing context and shows the message.
  - After a merge (note m), the selected id resolves to the existing context through `resolveContextId`, so the form shows the existing one selected.
- **Removed:** `addedContexts`, `mergeContexts.ts` (and its test), and `contextLoading`. The stories pass created contexts back through `useArgs`.

**`RankingPage`:** reads `useContexts()` to build its slides, instead of `getContextItems()` in an effect. Ranking results themselves stay as they are until § 30.

### 8. Storybook decorator for page stories (approved, user; built in § 30)

Only stories of Page/Container components that read the store use it. Presentational stories keep passing plain props. It provides seeded data and stubbed endpoints, so the page works in Storybook with no API running, and specific states can be shown on purpose.

```tsx
// .storybook/withDataStore.tsx, added per page story file
parameters: {
  dataStore: {
    seed: [[contextKeys.all, contextFixtures]],      // setQueryData before the first render
    api: {                                           // stubs fetch for this story only
      "POST /api/contexts": (body) => ({ status: 409, body: { code: "name_taken", context } }),
    },
  },
}
```

- **A fresh client per story:** `createQueryClient({ onTechnicalError: action("technical error") })`. A technical error appears in the actions panel instead of opening the dialog, which has its own story.
- **`seed`** fills the cache, so reads render with no request. Seeded data is fresh, so nothing refetches.
- **`api`** answers the story's mutations, and any reads it doesn't seed. It's restored when the story unmounts, so nothing leaks into the next story.
  - A request with no matching handler never resolves, which shows a loading or "sending" state.
  - A handler can return an error status to show a user-correctable error, such as `name_taken`.
- **No new dependency.** MSW was rejected: a full mock server for what a small fetch stub covers.
- **When it's built.** No story needs it in § 56: `TaskCreationPage` and `RankingPage` have no stories. It's built with the first page story that reads the store, in § 30. It replaces the story-only `initialState` props on `TasksPage`, `TaskDetailPage` and `InProgressPage`.

### 9. Tests (approved, user)

- **React-rendering tests are added** (`@testing-library/react`, `@testing-library/user-event`, jsdom), set up in their own PR first: `tasks/TASKS-TECH.md` § 59.
- **Data layer.** Each `data/` module's query and mutation logic is tested through a fresh `QueryClient` with `fetch` stubbed:
  - the optimistic append and the upsert reconcile;
  - the `slideIndex` prediction;
  - the `name_taken` merge and `resolveContextId`;
  - scope ordering;
  - retry only on network errors;
  - the central handler calling `onTechnicalError` only after retries are exhausted, and never for an expected error.
- **Hooks.** `renderHook` with a fresh client for `useContexts`, `useCreateContext` (including `isSending` false while paused offline) and `useCreateTask`.
- **`DataStoreContainer`.** Render tests for § 3's list: a failure the retry recovers from opens no dialog; a failed first attempt and retry open it once; several failures open one dialog; OK invalidates every query; an expected error opens nothing.
- **`TaskCreationForm`.** The as-you-type duplicate message, Add disabled while sending but not while paused, and the `created` and `duplicate` results.
- **API.** The real-DB tests in § 6.
- Rejected: testing the data layer only through a `QueryClient`, with no React. No new dependency, but it leaves the hooks and the dialog's behaviour untested.

### 10. Failed background refetches (interim, user)

A failed background refetch of data already on screen is a technical error, as the HLD's default says: logged, then the failure dialog and a refresh. This doesn't affect § 56, since contexts never refetch in the background. It matters from § 30, when tasks refetch in the background.

How the store and services behave by connectivity is decided in `tasks/TASKS-FEATURES.md` § 60 (online and offline state), together with an indication of the state for the user. That includes this case and the dialog loop it can cause when the server is down.

## Rollout

The LLD designs the store for every entity, with contexts as the first one moved in. Each entity then moves in on its own, and is wired into its pages and components when it does:

0. **React test setup (§ 59),** its own PR.
1. **Infrastructure, with no entity yet.** `apiFetch` and `ApiError`, with every `services/` function moved onto them. The `QueryClient` with its default options and its `QueryCache`/`MutationCache` handlers, provided by `DataStoreContainer` in `main.tsx`. The root failure dialog (§ 31). (The Storybook decorator waits for § 30, § Design 8.)
2. **Contexts (§ 56).** `POST /api/contexts` changes first, then `data/contexts.ts`, and the minimal `useCreateTask` in `data/tasks.ts` (§ Design 7). `RankingPage` and `TaskCreationPage` read from the store, and `TaskCreationForm` loses `addedContexts` and `mergeContexts`.
3. **Tasks (§ 30).** After `POST /api/tasks` is made idempotent. `data/tasks.ts` gains the tasks cache and the other task mutations, read by `TasksPage`, `TaskDetailPage` and `InProgressPage`. Task create then also updates that cache optimistically and retries once on network errors. `TasksPage`'s failed-delete dialog moves onto the root dialog (§ 31).
4. **Ranking results (§ 30).** After `/api/rank` takes `contextId`. `data/ranking.ts` with the "never shown stale" hook (note b), and `refreshAfterMutation()` removed.
5. **Context rename and archive (§ 42).** New mutations in `data/contexts.ts`.
