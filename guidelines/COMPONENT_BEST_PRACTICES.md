# Component Best Practices

Permanent reference. Applies to all React components in this project, regardless of feature.

---

## Two Component Types

Before writing any component, decide which type it is. Never mix them.

| | Presentational | Page / Container |
|---|---|---|
| **Suffix** | none | `Page` or `Container` |
| **Inputs** | props only | props + may own state |
| **Outputs** | `on*` event callbacks | event callbacks or direct handler calls |
| **State** | only for internal display tracking (open/closed, hover) — and only when truly necessary | owns business/async state: fetch results, loading flags, errors |
| **Data fetching** | never | yes — via hooks or directly |
| **Storybook story** | yes | no — test via integration |

**Default to presentational.** Promote to Container only when a component genuinely needs to own state that has no meaning to its parent. Promote to Page when it owns a full route's state.

---

## Data Flow

**Props in, events out** is the default contract for all presentational components.

- Presentational components never reach outside themselves for data.
- State is the exception, not the default. A component that needs `useState` for anything beyond visual display (e.g. open/closed, hover) is accumulating logic that belongs in a Container.
- Business state — API responses, loading, errors, user session data — always lives in a `Page` or `Container`.

---

## Naming

### Presentational
No suffix. Name describes what it renders.

| Artifact | Convention |
|----------|-----------|
| Component file | `PascalCase.tsx` |
| Props interface | `{ComponentName}Props` |
| Story file | `PascalCase.stories.tsx` |
| Component folder (if multi-file) | `PascalCase/index.ts` |

### Page
One per route. Owns the full page's async and business state.

| Artifact | Convention |
|----------|-----------|
| Component file | `{Name}Page.tsx` |
| No Storybook story | — |

### Container
Mid-level. Owns state or fetch logic but is not a full page. Use sparingly — most components should be presentational.

| Artifact | Convention |
|----------|-----------|
| Component file | `{Name}Container.tsx` |
| No Storybook story | — |

---

## Props

- Props interface named `{ComponentName}Props`, defined above the component — never inline.
- Callbacks named `on{Event}`: `onSubmit`, `onChange`, `onSelect`.
- Boolean props: use affirmative adjectives or `is`/`has` prefix — `loading`, `explain`, `isDisabled`.
- Pass data, not IDs. A component receives what it needs to render, not a key to look it up.
- More than ~5 props is a signal to consider splitting the component.

---

## Storybook

- Every presentational component has a story file.
- Story title path: `"Components/{ComponentName}"`.
- Individual stories use PascalCase named exports: `export const WithError = ...`.
- Stories use shared fixture data — never inline invented values.
- Stories cover all meaningful prop states, including edge cases (empty lists, long strings, error states).

---

## Additions

Add new practices here as they are established during implementation.
