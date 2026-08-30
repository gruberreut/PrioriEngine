# @priori/api

Node.js HTTP API server for Priori.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://localhost/priori_dev` | PostgreSQL connection string |
| `TEST_DATABASE_URL` | `postgresql://localhost/priori_test` | PostgreSQL connection string used by the real-DB integration tests (`apps/api/test/helpers/db.ts`) |
| `PRIORI_TASKS_PATH` | `packages/engine/test/data/tasks.example.json` | Path to the task JSON file used by the ranking endpoints |

## Database setup

Run the local setup script once to install PostgreSQL and create both the dev and test databases:

```bash
./scripts/setup-db-local.sh
```

Then install dependencies, generate and apply the initial migration, and seed the dev database:

```bash
npm ci
npm run db:generate -w @priori/api
npm run db:migrate -w @priori/api
npm run db:seed -w @priori/api
```

The test database (`priori_test`) doesn't need a manual migrate/seed step — `apps/api/test/helpers/db.ts` runs migrations against it automatically and each test seeds its own data.

## Development

```bash
npm run dev:api   # starts the API server with tsx watch on port 3001
```
