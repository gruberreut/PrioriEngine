# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Approval Policy

Per `AGENTS.md`: do not execute implementation steps or make code changes unless the user explicitly approves. Default to planning/discussion only until approval is given.

## Technology and Architecture Choices

Prefer the minimal solution that satisfies current requirements and can be incrementally enhanced to support the planned features in this project. Avoid introducing abstractions, dependencies, or infrastructure that aren't needed yet.

When evaluating a technology or architecture decision:
- Choose the option with the smallest footprint that doesn't foreclose future needs
- Avoid choices that create tech debt (e.g. patterns that will need to be undone, not just extended, as the project grows)
- If there is genuine uncertainty about whether a simpler choice will hold up against future requirements, raise it explicitly before proceeding — describe the trade-off, identify the specific future features that create the tension, and ask the developer to weigh in before committing to an approach

## Commands

All commands are run from the repository root unless noted.

```bash
npm ci                             # install all workspace dependencies (use this, not npm install)

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

## API Documentation

Every HTTP endpoint must be documented in `apps/api/API.md` before implementation is considered complete. The entry must include: method + path, a description, the full request body schema (field name, type, required/optional, default), the response shape for each mode, and a working `curl` example.

Current standard: **markdown** (`apps/api/API.md`).

Recommend upgrading to **OpenAPI** when any of the following conditions are met:
- The API has more than one consumer (e.g. mobile app, third-party integration, or external team)
- There are more than 5 endpoints
- Request or response validation is needed at the server boundary

Until then, keep the markdown doc in sync — update it in the same commit as any endpoint change.

## Storybook

Before a story is considered complete, every callback prop on the component (`onClick`, `onSelect`, `onAction`, `onChange`, etc.) must be wired to the Storybook actions panel via `argTypes` in the story's `meta`:

```ts
argTypes: {
  onAction: { action: "onAction" },
  onSelect: { action: "onSelect" },
}
```

Do not leave any callback prop unwired.

### Story structure

Every story file must declare a `defaultArgs` object near the top of the file. It mirrors the component's prop defaults exactly — required props use a representative sample fixture; optional props with no component-level default are omitted. The first story (`Default`) always uses `defaultArgs` directly, ensuring every control in the controls tab shows a meaningful value.

All other stories spread `defaultArgs` and override only the prop(s) they demonstrate:

```ts
const defaultArgs = {
  task,
  explain: false,
  flavor: "outlined" as const,
  selected: false,
};

export const Default: StoryObj<typeof TaskCard> = {
  args: defaultArgs,
};

export const Selected: StoryObj<typeof TaskCard> = {
  args: { ...defaultArgs, selected: true },
};
```

This keeps stories resilient to new props: adding a prop with a default only requires updating `defaultArgs`, not every individual story.

Story ordering: group by subject (appearance → state → content variants → edge cases), then by ascending complexity within each group.

### Controls interactivity

In every story, changing a value in the controls panel must be reflected in the component's display. For controlled components that require local state in a render function, use `useArgs` from `storybook/preview-api` instead of `useState` — this keeps the controls panel and the component display in sync bidirectionally:

```ts
import { useArgs } from "storybook/preview-api";

const render: Story["render"] = (args) => {
  const [{ checked }, updateArgs] = useArgs<{ checked: boolean }>();
  return (
    <Checkbox
      {...args}
      checked={checked}
      onChange={(val) => { updateArgs({ checked: val }); args.onChange?.(val); }}
    />
  );
};
```

Never use `useState` to shadow a prop that is also a Storybook control — the control will appear to change but the component won't update.
