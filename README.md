# Priori Engine

Priori Engine is a deterministic task-ranking engine that recommends the most relevant tasks for the current moment.

It evaluates leaf tasks from a nested JSON task tree and ranks them using weighted scoring based on:
- priority
- urgency aging (`priorityUpdatedAt`)
- context matching
- energy fit
- duration fit
- project flow bonus
- recent suggestion penalty

The engine is designed for local experimentation and explainable output. It returns top-N tasks (default `3`) and can print score breakdowns with `--explain`.

## Run locally

Install dependencies:

```bash
npm install
```

Run ranking (defaults to `test/data/tasks.example.json`):

```bash
npm run rank -- --context garden --available-time 20 --energy medium --explain
```

Useful flags:
- `--tasks <path>`: input JSON file path
- `--limit <n>`: number of tasks to return (default `3`)
- `--now <iso-date>`: fixed runtime timestamp for reproducible tests
- `--last-completed-project <id>`: enables project flow bonus

## Test

```bash
npm test
```

Coverage (instrumented engine sources under `src/`, excluding type-only `src/types.ts` and the thin entry `src/cli.ts`):

```bash
npm run test:coverage
```
