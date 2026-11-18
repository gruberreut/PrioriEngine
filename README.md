# Priori

**▶ [Live component library (Storybook)](https://gruberreut.github.io/PrioriEngine/)** — every UI component, its variants and both themes, rebuilt on each merge to `main`.

## Why TempAppName exists

Most of our time and energy goes to things we *have* to do: work, the commute, chores, admin, sleep, repeat. When you finally get home and want to do something for yourself, something that uses the other parts of who you are, your skills and your ambitions, you're often too drained to decide *what*. Choosing takes the last of your energy, so you give up and end up watching TV or scrolling.

TempAppName makes that choice for you.

## How it works

1. **Offload.** Whenever an idea comes to mind, a book to read, a skill to practise, a project to start, capture it in seconds. Only a title is required.
2. **Tell it how you are.** When you have a free moment, say how much time and energy you have.
3. **Pick one.** The Priori Engine gives you a very short list of options (three by default) that fit right now. Not in the mood for any of them? Refresh for others.

You spend what energy you have on something you love, not on deciding. Even if it's only a few minutes, you know you did something for yourself today. Those minutes add up, and one day you realize you have a new skill, you finished that book on your shelf, or you made something you're proud of.

## The repository

Monorepo for the Priori task-ranking system: **`packages/engine`** (deterministic ranking + CLI), **`apps/api`** (HTTP API), and **`apps/web`** (React UI).

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
| `apps/api` | HTTP API |
| `apps/web` | Browser UI |
| `documentation/` | Design and product docs |

See [documentation/FRONTEND_BACKEND_TECHNICAL_DESIGN.md](documentation/FRONTEND_BACKEND_TECHNICAL_DESIGN.md) for boundaries between projects.
