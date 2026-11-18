# User provisioning flow

Tracked in `tasks/TASKS-TECH.md` § 54 (implementation). The plan itself was archived under `tasks/TASKS-DONE.md` § 7.

## Context

Today there is exactly one user: `apps/api/src/db/seed.ts` inserts a single
dev user (`dev@priori.local`) plus four hardcoded default contexts
(`Learning`, `Creativity`, `Projects`, `Physical`), run manually via
`npm run db:seed`. `server.ts` looks that user up at startup and threads the
resulting `devUserId` into every route handler
(`documentation/ARCHITECTURE.md` § Authentication). There is no auth, no
sign-up flow, and no `POST /api/users` endpoint.

tasks/TASKS-DONE.md §7 flagged that once real user accounts exist, the server needs to
automatically provision the same default contexts for every *new* user —
today's seed script only covers the one dev user and isn't a mechanism, just
a one-off script. This doc is that plan, written ahead of auth so the
provisioning shape is decided before it has to be threaded through whichever
auth approach gets picked. **No auth library or flow is chosen yet** — this
plan defines an integration point auth work will call into, not the auth
flow itself.

## Decisions

### Default list stays hardcoded, but shared

No evidence exists today that the default-context list needs to change
without a deploy — there's no admin UI, no per-user customization request,
and only one caller (`seed.ts`) has ever needed it. Per `CLAUDE.md`'s
smallest-footprint guidance, a config table is out of scope until something
actually needs to edit this list at runtime. Instead: extract the constant
so it has exactly one definition instead of becoming duplicated between
`seed.ts` and the new provisioning function (see Approach).

### Trigger point: immediately after the `users` row is first inserted

Rejected the other two options named in tasks/TASKS-DONE.md §7:

- **A DB trigger** — would move business logic out of the app layer this
  codebase otherwise keeps it in (`queries.ts`'s shared-query pattern,
  `ARCHITECTURE.md` § Shared query pattern); harder to unit test than a
  plain function, and inconsistent with how every other cross-table write
  in this codebase is done in application code.
- **A standalone `POST /api/users` endpoint** — with no auth yet, this
  would be an unauthenticated endpoint that creates arbitrary users and
  provisions their contexts, callable by anyone who finds it. Building it
  now means either leaving that hole open or building throwaway
  auth-shaped protection ahead of the real auth decision — exactly the
  kind of premature infrastructure `CLAUDE.md` says to avoid.

Whatever auth mechanism is eventually chosen (email/password, OAuth, magic
link, etc.), it will have exactly one place where a first-time signer causes
a new row to be inserted into `users`. Provisioning runs synchronously,
in the same request, immediately after that insert succeeds — no webhook,
no background job, no second endpoint. This mirrors `seed.ts`'s own
existing shape (insert user → if it was actually new → seed its contexts)
almost exactly, so the future auth handler's code will read the same way
`seed.ts` already does.

### Idempotency: gate on "was the insert actually new," not on conflict-swallowing alone

`seed.ts` already gets this right and the new function keeps the same
shape: check whether the `INSERT INTO users` returned a row (a real insert)
versus nothing (conflict on the unique `email`, i.e. the user already
existed). Only call the provisioning step when it returned a row. This is
the primary guard — it makes provisioning a true one-shot per user, not
something that silently no-ops if run twice.

`onConflictDoNothing()` on the batch context insert (already used by
`seed.ts`) stays as defense-in-depth for the one remaining edge case that
guard doesn't cover — two concurrent first-time-signup requests for the
same brand-new user racing each other. It is not the mechanism idempotency
relies on; relying on it alone would mean re-running provisioning against
an *existing* user always silently no-ops, which has a real consequence
below.

### Deleted default contexts are not re-created

Contexts have no `isDefault` flag, and none is being added for this. There
is currently no `DELETE /api/contexts/:id` endpoint at all, so this
question is moot in practice today — but the answer that should hold once
one exists: provisioning is a one-time bootstrap at account creation, not
an enforced invariant. A default context, once created, is ordinary user
data indistinguishable from one the user created by hand — deleting it is
permanent, exactly like deleting any other context. Adding an `isDefault`
flag purely to support "recreate on next login" would be speculative
complexity for a need nothing has actually raised.

(Note the interaction with the idempotency guard above: since provisioning
only fires once per user — gated on the `users` insert being genuinely new
— a deleted default context is never at risk of reappearing on a later
login. It could only reappear in the exceedingly unlikely concurrent
double-signup race the `onConflictDoNothing()` defense-in-depth covers, and
only if the delete happened in the sliver of time between the two racing
inserts. Not worth engineering around further.)

### Dev seeding stays separate from the production path

`seed.ts` keeps seeding exactly one dev user, run manually. It becomes a
thin caller of the shared provisioning function instead of duplicating the
insert logic (see Approach) — this is the one concrete refactor this plan
calls for now. The production path (real auth calling the same function)
doesn't exist yet and isn't built here; this doc just makes sure both
paths will share one implementation instead of two copies drifting apart.

## Approach

Extract a single function, callable from both today's dev seed script and
whatever auth handler is built later:

```ts
// apps/api/src/db/provisioning.ts
export const DEFAULT_CONTEXTS = ["Learning", "Creativity", "Projects", "Physical"];

export async function provisionDefaultContexts(db: Db, userId: string) {
  await db
    .insert(contexts)
    .values(DEFAULT_CONTEXTS.map((name) => ({ userId, name })))
    .onConflictDoNothing();
}
```

`seed.ts` changes from inlining the context insert to:

```ts
const [user] = await db.insert(users).values({ email: DEV_USER_EMAIL }).onConflictDoNothing().returning();
if (!user) { /* already exists, skip */ return; }
await provisionDefaultContexts(db, user.id);
```

The future auth handler — whatever inserts a new row into `users` for a
first-time signer — follows the identical shape: insert, check the row came
back, call `provisionDefaultContexts(db, newUser.id)` before returning the
session/response to the client. That call site doesn't exist yet and isn't
being added now; this plan is what it wires into once it does.

Nothing here changes `schema.ts` — no `isDefault` column, no config table,
no new endpoint.

## Explicitly deferred

- The actual auth implementation (library/provider choice, session
  handling, `users` insert call site) — out of scope for this plan and not
  chosen yet.
- `DELETE /api/contexts/:id` — doesn't exist; the "not re-created" decision
  above just needs to be honored whenever it's built.
- Any config-table/admin-editable default list — no current need; revisit
  if that need actually shows up.
- Multi-tenant or org-level default contexts (shared across users) — not a
  requirement today; the schema is already per-user (`contexts.userId`) and
  nothing here changes that.

## Verification

No behavior changes yet — this is a plan, not an implementation. The
`provisionDefaultContexts` extraction (Approach) is a small enough, self-
contained refactor that it can land on its own ahead of auth, with:

- `apps/api/test/db/provisioning.test.ts` (real-DB, per `CLAUDE.md`'s API
  testing strategy — this touches non-trivial DB writes with an
  idempotency invariant worth covering directly): a fresh user gets all
  four default contexts; calling it twice for the same `userId` doesn't
  duplicate rows (`onConflictDoNothing` path); an unrelated existing
  user's contexts are untouched.
- `npm run db:seed` against a clean DB still produces the same result as
  today (manual check, matches existing script behavior).

The auth-triggered call site gets its own tests when that work actually
starts, exercising "first-time signup provisions defaults" and "repeat
login does not re-provision or duplicate" end-to-end through whatever the
real signup/login endpoint turns out to be.
