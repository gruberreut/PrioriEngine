# packages/engine — CLAUDE.md

Guidance for the Priori Engine (`packages/engine`). Cross-cutting rules (naming, approval policy, task tracking, branch workflow, architecture docs) live in the root `CLAUDE.md`.

## Engine pipeline (`packages/engine/src/`)

The engine processes a JSON task tree through four sequential stages:

1. **`taskLoader.ts`** — reads JSON from disk; accepts either a bare array or `{ tasks: [...] }`; flattens the nested tree into `LoadedTask[]`, preserving each node's `parent` reference and `depth`. The array-unwrapping and flattening helpers (`asTaskArray`, `flattenTaskTree`, `isLeafTask`) live in **`treeUtils.ts`** so they can be shared with the in-memory entry point below.

2. **`normalizer.ts`** — converts `LoadedTask[]` to `NormalizedTask[]`. Uses `inheritedValue` to walk up the parent chain for any missing field, so child tasks can omit fields that exist on the parent. Filters out non-leaf tasks (anything with children), completed tasks, and tasks that fail field validation. Returns `{ tasks, exclusions }`.

3. **`ranker.ts`** — scores and sorts candidates against `RuntimeParams`. Computes six score components (priority, urgency aging, energy fit, duration fit, project flow bonus, recent suggestion penalty) weighted by `DEFAULT_WEIGHTS`. If any task has `status: "in_progress"`, ranking is blocked and that task is returned in `in_progress_block` mode instead. Context filtering (exact string match, case-insensitive) and then location filtering (tasks with `location: "anywhere"` always pass) happen before scoring. Tie-breaking is deterministic: total score → priority → priorityUpdatedAt → duration → id.

4. **`output.ts`** — formats `RankResult` as plain text. In `--explain` mode, prints per-task score breakdowns and the full exclusion list.

**`runCli.ts`** wires the four stages together. **`api.ts`** (`rankFromPayload`) is the in-memory equivalent used by `apps/api`: it takes already-parsed JSON instead of a file path and runs flatten → normalize → rank, returning `RankResult` without formatting. **`index.ts`** is the package's public export surface. **`cliParse.ts`** extracts `RuntimeParams` and the task path from `process.argv`-style args. **`cli.ts`** is the thin entry point (excluded from coverage).

## Key types (`types.ts`)

- `RawTask` — raw JSON shape (all fields optional, supports `children`)
- `LoadedTask` — `RawTask` + `parent` + `depth` (post-flatten)
- `NormalizedTask` — fully resolved, validated task ready for ranking
- `RuntimeParams` — caller-supplied context for a single ranking run
- `RankResult` — either `recommendations` or `in_progress_block`

## Testing

Tests live in `packages/engine/test/`. JSON fixtures are in `test/fixtures/` (structured scenarios) and `test/data/tasks.example.json` (realistic sample). Coverage thresholds: 100% lines/functions/statements, 95% branches — enforced by `vitest run --coverage`.
