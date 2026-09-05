# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Naming

The app's name is **unsettled** — "Tendril" turned out to already be in use by another app/company and is being replaced. Until a new name is chosen, use **TempAppName** as a placeholder everywhere the app's name would otherwise appear — UI copy, docs, commit messages, general discussion. Don't reintroduce "Tendril" as the product name in new work. See `TASKS.md` § 41 for the task tracking the eventual real-name rollout (including internal identifiers like the `--tendril-*` token prefix, deliberately left alone for now — see that task for why).

The backend ranking engine (`packages/engine`) is called **Priori Engine** — this name is unaffected and correct to use when specifically discussing the Priori Engine's ranking system itself.

## Approval Policy

Per `AGENTS.md`: do not execute implementation steps or make code changes unless the user explicitly approves. Default to planning/discussion only until approval is given.

## Task Tracking

`TASKS.md` tracks active and upcoming work. When every item in a top-level numbered section (`## N. ...`) is checked off with no open sub-items left anywhere in it, move that section's full content out of `TASKS.md` into `TASKS-DONE.md` (same repo root), appended in numeric order. Leave a single-line stub in `TASKS.md` in its place — `## N. Title — completed, see TASKS-DONE.md` — so section numbers and existing `§N` cross-references still resolve without opening the archive. Do not archive a section that has any unchecked item anywhere in it, even if most of it is done — a partially-complete section stays in `TASKS.md` in full, including its already-completed subsections.

**Exception: the Known Bugs section (`## 10. Known Bugs`).** Its header stays in `TASKS.md` even when its list is fully resolved — do not collapse it to a stub. It's the standing place new bugs get filed, so it needs to exist and be findable even at zero open items. Individual fixed bugs still move to `TASKS-DONE.md` as normal; only the section title itself is exempt from archiving.

## Architecture Documentation

Architectural decisions must be recorded in `documentation/ARCHITECTURE.md`. Update this file in the same commit as the decision — not after the fact. Each entry should capture: what was decided, why (the forces that drove it), and what alternatives were rejected. If a prior decision is superseded, mark it as such rather than deleting it.

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
npm install <pkg> [-w <workspace>] # add a new package — updates both package.json and package-lock.json; use npm ci for everything else

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

### Web frontend layout (`apps/web/src/`)

```
components/   — generic UI primitives with no domain knowledge (Select, Checkbox, Icon, Breadcrumbs)
entity/       — domain-aware components that represent a core entity and are shared across features (TaskCard)
features/     — feature-specific components that live inside one feature and are not shared
types/        — shared TypeScript interfaces (Task, etc.)
services/     — API clients (rankingService, taskService)
assets/       — SVG icons and static files
```

**Entity components** (`src/entity/`) are components that represent a domain entity (e.g. a Task) and are naturally reused across multiple features. They are domain-aware but not feature-specific. When a component shows signs of becoming an entity component — it is being imported from a second feature, or a future task explicitly plans to use it outside its origin feature — flag this and propose moving it to `src/entity/` before the second use is implemented.

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

## API Server Structure (`apps/api`)

Route handlers live in `apps/api/src/routes/`, one file per entity (e.g. `tasks.ts`, `contexts.ts`, `rank.ts`). Shared HTTP utilities (`json`, `readBody`, `setCorsHeaders`) live in `apps/api/src/lib/http.ts`.

Each route file exports a single factory function — `create<Entity>Handler(db, ...deps)` — that returns a `(req, res, pathname, method) => Promise<boolean>` handler. The handler returns `true` if it matched and responded, `false` to pass through. `server.ts` is responsible only for startup (DB init, env vars) and iterating the handler list; it never contains route logic itself.

## Database Access Pattern

When a DB table needs to be read or written from more than one file, extract the query into a shared function in `apps/api/src/db/queries.ts`. Route handlers and other modules import from there rather than inlining the same Drizzle query in multiple places.

Example: `queryTasks(db, userId)` is defined once in `queries.ts` and used by both `routes/tasks.ts` and `routes/rank.ts`.

## API Testing Strategy

Test files live in `apps/api/test/`, mirroring the `src/` structure.

**High-value areas use real DB integration tests** (connects to `priori_test`, runs migrations, seeds data per test). Use this approach when the logic is tightly coupled to DB queries, involves non-trivial mutations, or where a silent regression would be costly. Current high-value areas: `routes/tasks.ts` (including the split operation), `routes/rank.ts` (the DB→engine pipeline), and `routes/contexts.ts` (moved to real-DB tests once `POST /api/contexts` gained the `slide_index`-assignment invariant — see § 14 of `TASKS.md`).

**Lower-value areas use a mocked DB** to keep setup overhead low. Use this when the logic is simple CRUD with no complex invariants. No current example — revisit this section's wording once one exists again.

Shared DB test helpers (seed functions, `clearAll`, migration runner) live in `apps/api/test/helpers/db.ts` and are used only by the real-DB test files.

When adding a new route or query, apply the same judgment: if the logic has meaningful invariants or the failure mode is hard to detect, use a real DB test.

## API Documentation

Every HTTP endpoint must be documented in `apps/api/openapi.yaml` before implementation is considered complete. The entry must include: method + path, a description, the full request/response schemas (field name, type, required/optional, default), and a request/response example.

Current standard: **OpenAPI** (`apps/api/openapi.yaml`), served interactively as Swagger UI at `GET /docs` (raw spec at `GET /openapi.yaml`). `apps/api/API.md` is superseded — it now just points here.

Keep the spec in sync — update it in the same commit as any endpoint change.

## Storybook

Every component must have a corresponding Storybook story file. This applies to all components — especially basic, atomic ones in `src/components/`. A component is not considered complete without stories.

### Story hierarchy

Story titles must follow this convention to keep the Storybook sidebar organized:

- **`Atomic/<ComponentName>`** — generic UI primitives in `src/components/` (e.g. Select, Checkbox, Carousel)
- **`Entity/<ComponentName>`** — domain-aware shared components in `src/entity/` (e.g. Entity/TaskCard)
- **`Features/<Feature>/<ComponentName>`** — feature-specific components in `src/features/` (e.g. Features/Ranking/ParamsForm, Features/Tasks/DurationPicker)

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

## Design tokens

All visual values live in `apps/web/src/styles/tokens.css`, in three layers:

- **Layer 1 — palette** (`--tendril-*`): raw hexes. Hexes appear nowhere else in the codebase.
- **Layer 2 — semantic roles** (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--control-height-*`, `--focus-ring*`, `--motion-*`): what a value *means*. Mode-aware — the light block, the `[data-theme='dark']` block and the `prefers-color-scheme` block must stay in parity (enforced by `test/tokenParity.test.ts`).
- **Layer 3 — component tokens** (`--<component>-*`): per-component knobs, one labelled group per component, in the same file.

**Rule: a `*.module.css` file references Layer 3 only.** Never `var(--color-*)` directly from a component. This is what allows one component's design to be adjusted without touching any other.

When building or restyling a component:

1. Add a Layer-3 group to `tokens.css` headed `/* <Component> — components/<Component> */`.
2. Give it one token per visual property the component paints: background, border, text color, radius, height, padding, shadow, own font size. Roughly 6–12 tokens. Internal `--space-*` gaps, font families and `--motion-*` values may be read from Layer 2 directly.
3. Every Layer-3 entry defaults to a Layer-2 role — `--fab-bg: var(--color-primary)`. A literal value means the component deliberately diverges, and it carries a comment saying why.
4. Do not add a dark-mode override for a Layer-3 token. Layer 3 sits outside the light/dark split; it inherits mode-awareness through the Layer-2 role it points at. If a component needs a value that differs by mode and no role provides it, add the role to Layer 2 (all three blocks) instead.
5. If a literal appears in two Layer-3 groups, promote it to a Layer-2 role and point both at it.
6. Never reference another component's Layer-3 token. Give the second component its own, even if it defaults to the same role.
7. Style `:focus-visible` explicitly — the browser default is never acceptable. Anything tappable is ≥44px, or is inside a group that is.
8. Add a `<ComponentTokens prefix="--<component>-" />` block to the component's Storybook docs page so the token list stays self-documenting.

Component-level design work follows `documentation/DESIGN-TOKENS-BY-COMPONENT.md`, which carries the per-component target values and migration order.
