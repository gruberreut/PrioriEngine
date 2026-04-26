# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Approval Policy

Per `AGENTS.md`: do not execute implementation steps or make code changes unless the user explicitly approves. Default to planning/discussion only until approval is given.

## Commands

All commands are run from the repository root unless noted.

```bash
npm install                        # install all workspace dependencies

npm run build                      # compile packages/engine → dist/
npm run typecheck                  # type-check without emitting

npm test                           # run all engine tests (vitest run)
npm run test:coverage              # run tests with v8 coverage report

# Run a single test file
npx vitest run packages/engine/test/ranker.test.ts

# Run the ranking CLI (defaults to test/data/tasks.example.json)
npm run rank -- --context garden --available-time 20 --energy medium --explain

# CLI flags
--tasks <path>                     # JSON task file (default: test/data/tasks.example.json)
--context <name>                   # filter by context label
--available-time <minutes>         # available time in minutes (default: 30)
--energy low|medium|high           # current energy level (default: medium)
--limit <n>                        # number of results (default: 3)
--explain                          # print per-task score breakdown + exclusions
--now <iso-date>                   # pin current time (for reproducible runs)
--last-completed-project <id>      # enable project flow bonus
```

## Architecture

### Monorepo layout

```
packages/engine/   — ranking engine, CLI, all tests  (the only active package)
apps/              — api and web UI (planned, empty)
documentation/     — design and product docs
```

### Engine pipeline (`packages/engine/src/`)

The engine processes a JSON task tree through four sequential stages:

1. **`taskLoader.ts`** — reads JSON from disk; accepts either a bare array or `{ tasks: [...] }`; flattens the nested tree into `LoadedTask[]`, preserving each node's `parent` reference and `depth`.

2. **`normalizer.ts`** — converts `LoadedTask[]` to `NormalizedTask[]`. Uses `inheritedValue` to walk up the parent chain for any missing field, so child tasks can omit fields that exist on the parent. Filters out non-leaf tasks (anything with children), completed tasks, and tasks that fail field validation. Returns `{ tasks, exclusions }`.

3. **`ranker.ts`** — scores and sorts candidates against `RuntimeParams`. Computes six score components (priority, urgency aging, energy fit, duration fit, project flow bonus, recent suggestion penalty) weighted by `DEFAULT_WEIGHTS`. If any task has `status: "in_progress"`, ranking is blocked and that task is returned in `in_progress_block` mode instead. Context filtering (exact string match, case-insensitive) happens before scoring. Tie-breaking is deterministic: total score → priority → priorityUpdatedAt → duration → id.

4. **`output.ts`** — formats `RankResult` as plain text. In `--explain` mode, prints per-task score breakdowns and the full exclusion list.

**`runCli.ts`** wires the four stages together. **`cliParse.ts`** extracts `RuntimeParams` and the task path from `process.argv`-style args. **`cli.ts`** is the thin entry point (excluded from coverage).

### Key types (`types.ts`)

- `RawTask` — raw JSON shape (all fields optional, supports `children`)
- `LoadedTask` — `RawTask` + `parent` + `depth` (post-flatten)
- `NormalizedTask` — fully resolved, validated task ready for ranking
- `RuntimeParams` — caller-supplied context for a single ranking run
- `RankResult` — either `recommendations` or `in_progress_block`

### Testing

Tests live in `packages/engine/test/`. JSON fixtures are in `test/fixtures/` (structured scenarios) and `test/data/tasks.example.json` (realistic sample). Coverage thresholds: 100% lines/functions/statements, 95% branches — enforced by `vitest run --coverage`.
