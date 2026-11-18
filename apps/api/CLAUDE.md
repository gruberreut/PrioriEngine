# apps/api — CLAUDE.md

Guidance for the API server (`apps/api`). Cross-cutting rules (naming, approval policy, task tracking, branch workflow, architecture docs) live in the root `CLAUDE.md`.

## API Server Structure (`apps/api`)

Route handlers live in `apps/api/src/routes/`, one file per entity (e.g. `tasks.ts`, `contexts.ts`, `rank.ts`). Shared HTTP utilities (`json`, `readBody`, `setCorsHeaders`) live in `apps/api/src/lib/http.ts`.

Each route file exports a single factory function — `create<Entity>Handler(db, ...deps)` — that returns a `(req, res, pathname, method) => Promise<boolean>` handler. The handler returns `true` if it matched and responded, `false` to pass through. `server.ts` is responsible only for startup (DB init, env vars) and iterating the handler list; it never contains route logic itself.

## Database Access Pattern

When a DB table needs to be read or written from more than one file, extract the query into a shared function in `apps/api/src/db/queries.ts`. Route handlers and other modules import from there rather than inlining the same Drizzle query in multiple places.

Example: `queryTasks(db, userId)` is defined once in `queries.ts` and used by both `routes/tasks.ts` and `routes/rank.ts`.

## API Testing Strategy

Test files live in `apps/api/test/`, mirroring the `src/` structure.

**High-value areas use real DB integration tests** (connects to `priori_test`, runs migrations, seeds data per test). Use this approach when the logic is tightly coupled to DB queries, involves non-trivial mutations, or where a silent regression would be costly. Current high-value areas: `routes/tasks.ts` (including the split operation), `routes/rank.ts` (the DB→engine pipeline), and `routes/contexts.ts` (moved to real-DB tests once `POST /api/contexts` gained the `slide_index`-assignment invariant — see § 14 of `tasks/TASKS-DONE.md`).

**Lower-value areas use a mocked DB** to keep setup overhead low. Use this when the logic is simple CRUD with no complex invariants. No current example — revisit this section's wording once one exists again.

Shared DB test helpers (seed functions, `clearAll`, migration runner) live in `apps/api/test/helpers/db.ts` and are used only by the real-DB test files.

When adding a new route or query, apply the same judgment: if the logic has meaningful invariants or the failure mode is hard to detect, use a real DB test.

## API Documentation

Every HTTP endpoint must be documented in `apps/api/openapi.yaml` before implementation is considered complete. The entry must include: method + path, a description, the full request/response schemas (field name, type, required/optional, default), and a request/response example.

Current standard: **OpenAPI** (`apps/api/openapi.yaml`), served interactively as Swagger UI at `GET /docs` (raw spec at `GET /openapi.yaml`). `apps/api/API.md` is superseded — it now just points here.

Keep the spec in sync — update it in the same commit as any endpoint change.
