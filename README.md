# Priori

Monorepo for the Priori task-ranking system: **`packages/engine`** (deterministic ranking + CLI), future **`apps/api`** (HTTP API), and **`apps/web`** (React UI).

## Engine (`packages/engine`)

The engine evaluates leaf tasks from a nested JSON task tree and ranks them using weighted scoring based on:

- priority
- urgency aging (`priorityUpdatedAt`)
- context matching
- energy fit
- duration fit
- project flow bonus
- recent suggestion penalty

It is designed for local experimentation and explainable output. It returns top-N tasks (default `3`) and can print score breakdowns with `--explain`.

### Run locally

From the repository root:

```bash
npm install
```

Run ranking (defaults to `packages/engine/test/data/tasks.example.json`):

```bash
npm run rank -- --context garden --available-time 20 --energy medium --explain
```

Useful flags:

- `--tasks <path>`: input JSON file path
- `--limit <n>`: number of tasks to return (default `3`)
- `--now <iso-date>`: fixed runtime timestamp for reproducible tests
- `--last-completed-project <id>`: enables project flow bonus

### Test

```bash
npm test
```

Coverage (instrumented engine sources under `packages/engine/src/`, excluding type-only `types.ts` and the thin entry `cli.ts`):

```bash
npm run test:coverage
```

## Layout

| Path | Role |
|------|------|
| `packages/engine` | Ranking engine, CLI, engine tests |
| `apps/api` | HTTP API (planned) |
| `apps/web` | Browser UI (planned) |
| `documentation/` | Design and product docs |

See [documentation/FRONTEND_BACKEND_TECHNICAL_DESIGN.md](documentation/FRONTEND_BACKEND_TECHNICAL_DESIGN.md) for boundaries between projects.
