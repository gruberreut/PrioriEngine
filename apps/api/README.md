# @priori/api

Node.js HTTP API server for Priori.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://localhost/priori_dev` | PostgreSQL connection string |
| `PRIORI_TASKS_PATH` | `packages/engine/test/data/tasks.example.json` | Path to the task JSON file used by the ranking endpoints |

## Database setup

Run the local setup script once to install PostgreSQL and create the dev database:

```bash
./scripts/setup-db-local.sh
```

Then install dependencies, generate and apply the initial migration, and seed:

```bash
npm ci
npm run db:generate -w @priori/api
npm run db:migrate -w @priori/api
npm run db:seed -w @priori/api
```

## Development

```bash
npm run dev:api   # starts the API server with tsx watch on port 3001
```
