# apps/web — CLAUDE.md

Guidance for the web frontend (`apps/web`). Cross-cutting rules (naming, approval policy, task tracking, branch workflow, architecture docs) live in the root `CLAUDE.md`.

## Lint must pass

After any change in `apps/web`, `npm run lint -w @priori/web` (eslint with `--max-warnings 0`, plus stylelint) must exit 0 before the work is complete. Warnings fail it too. Fix the cause rather than disabling a rule; if a rule genuinely doesn't fit, raise it with the user first.

A `git commit` hook (`.claude/hooks/check-web-lint.sh`) enforces this: it blocks the commit when `apps/web` has changes and lint fails. Lint doesn't type-check, so also run `npm run build -w @priori/web` (`tsc -b`) after changes that move or rename exports.

## Web frontend layout (`apps/web/src/`)

```
components/   — generic UI primitives with no domain knowledge (Select, Checkbox, Icon, Breadcrumbs)
entity/       — domain-aware components that represent a core entity and are shared across features (TaskCard)
features/     — feature-specific components that live inside one feature and are not shared
types/        — shared TypeScript interfaces (Task, etc.)
services/     — API clients (rankingService, taskService)
styles/       — tokens.css (design tokens), token tests, and the token docs pages (DesignTokens.mdx, ColorStory.mdx, ComponentTokens)
assets/       — SVG icons and static files
```

**Entity components** (`src/entity/`) are components that represent a domain entity (e.g. a Task) and are naturally reused across multiple features. They are domain-aware but not feature-specific. When a component shows signs of becoming an entity component — it is being imported from a second feature, or a future task explicitly plans to use it outside its origin feature — flag this and propose moving it to `src/entity/` before the second use is implemented.

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
- **Layer 2 — semantic roles** (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--control-height-*`, `--focus-ring*`, `--motion-*`): what a value *means*. Mode-aware — the light block, the `[data-theme='dark']` block and the `prefers-color-scheme` block must stay in parity (enforced by `src/styles/tokens.parity.test.ts`).
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

**Resolving a supplied design mock against existing tokens.** When implementing a design file (a screenshot or exported mock), prefer matching this codebase's already-established token usage over inferring a new one-off value from the mock — especially for color, where subtle shade differences between elements in a screenshot are easy to misread and mocks are not guaranteed to be internally consistent with each other or with what's already built. Don't assume a mock's apparent color choice is deliberate just because it's in the file; check it against how the same kind of element (a caption, a muted label, an accent) is already styled elsewhere in the app first, and flag the discrepancy rather than quietly picking a new value.
