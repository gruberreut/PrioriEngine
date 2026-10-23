# Testing Page — Component Structure

Component design for the local Priori engine explorer (`apps/web`).
Every component listed here gets its own Storybook story.

---

## Component Tree

```
Select                             (base dropdown primitive; all design/styling applied here)

RankingPage                        (page — composes everything, owns fetch state)
├── ParamsForm                     (controlled form; emits params on submit; renders submit button internally)
│   ├── ContextSelect              (wraps Select; options: "All" + context labels from API)
│   ├── AvailableTimeSelect        (wraps Select; options: 10 / 15 / 30 / 60 min)
│   ├── EnergySelect               (wraps Select; options: low / medium / high)
│   └── ExplainToggle              (switch: off by default)
└── ResultsPanel                   (renders one of three states)
    ├── TaskCard                   (one per ranked result)
    │   └── ScoreBreakdown         (collapsed unless explain=true)
    ├── InProgressBlock            (shown when mode === "in_progress_block")
    └── EmptyState                 (shown when top=[] and not in_progress_block)
```

---

## Components

### `RankingPage`

Page-level shell. Owns all async state: loading, error, and the latest `RankResult`.

**Responsibilities:**
- Calls `GET /api/contexts` on mount to populate `ContextSelect`
- Calls `POST /api/rank` on form submit; passes `params` from `ParamsForm`
- Passes result down to `ResultsPanel`

**No Storybook story** — it requires live API calls. Test via integration.

---

### `ParamsForm`

Controlled form. Renders the four input controls and a submit button (not a separate component).

| Prop | Type | Notes |
|------|------|-------|
| `contexts` | `string[]` | List for the context dropdown; comes from API |
| `loading` | `boolean` | Disables the submit button and shows a loading indicator while fetching |
| `onSubmit` | `(params: RankParams) => void` | Fires with current form values |

**`RankParams` shape** (passed to `POST /api/rank`):
```ts
{
  context?: string;        // undefined = no filter ("All")
  availableTime: number;   // minutes
  energyLevel: EnergyLevel;
  explain: boolean;
}
```

**Stories:**
- Default (contexts loaded, idle)
- Loading state (button spinning)
- No contexts available (empty list)

---

### `Select`

Base dropdown primitive. This is where all dropdown styling and design tokens are applied. Domain-specific select components wrap this — they never style a `<select>` directly.

| Prop | Type | Notes |
|------|------|-------|
| `options` | `{ label: string; value: string }[]` | |
| `value` | `string` | |
| `onChange` | `(value: string) => void` | |
| `label` | `string` | Accessible label rendered above or beside the control |
| `disabled` | `boolean` | Optional |

**Stories:**
- Default (several options, one selected)
- Disabled
- Single option
- Long option labels (overflow handling)

---

### `ContextSelect`

Dropdown for context filter. Wraps `Select`.

| Prop | Type | Notes |
|------|------|-------|
| `contexts` | `string[]` | Labels to show after "All" |
| `value` | `string \| undefined` | `undefined` = "All" selected |
| `onChange` | `(value: string \| undefined) => void` | |

**Stories:**
- With contexts (`garden`, `learning`, `home`, `bureaucracy`, `computer`)
- Empty list (only "All" option)

---

### `AvailableTimeSelect`

Dropdown for session duration. Wraps `Select`. Options are fixed: 10, 15, 30, 60.

| Prop | Type |
|------|------|
| `value` | `10 \| 15 \| 30 \| 60` |
| `onChange` | `(value: number) => void` |

**Stories:**
- Each option selected

---

### `EnergySelect`

Dropdown for energy level. Wraps `Select`.

| Prop | Type |
|------|------|
| `value` | `"low" \| "medium" \| "high"` |
| `onChange` | `(value: EnergyLevel) => void` |

**Stories:**
- Low / medium / high selected

---

### `ExplainToggle`

Toggle switch that controls score breakdown visibility.

| Prop | Type |
|------|------|
| `value` | `boolean` |
| `onChange` | `(value: boolean) => void` |

**Stories:**
- Off (default)
- On

---

### `ResultsPanel`

Renders exactly one of three states based on the `RankResult` received.

| Prop | Type |
|------|------|
| `result` | `RankResult \| null` |
| `explain` | `boolean` |

State logic:
- `result === null` → render nothing (initial state before first rank call)
- `result.mode === "in_progress_block"` → render `InProgressBlock`
- `result.top.length === 0` → render `EmptyState`
- otherwise → render a `TaskCard` for each item in `result.top`

**Stories:**
- Null (no result yet)
- Three task cards, explain off
- Three task cards, explain on (with score breakdowns visible)
- In-progress block
- Empty state

---

### `TaskCard`

Displays a single ranked task. Conditionally shows `ScoreBreakdown`.

| Prop | Type |
|------|------|
| `rank` | `number` | Display position (1, 2, 3) |
| `task` | `RankedTask` | From engine `RankResult.top` |
| `explain` | `boolean` | |

**Stories:**
- Rank 1, explain off
- Rank 1, explain on (breakdown visible)
- Long title (overflow handling)

---

### `ScoreBreakdown`

Score detail panel shown inside a `TaskCard` when `explain` is on.

| Prop | Type |
|------|------|
| `breakdown` | `ScoreBreakdown` | From `RankedTask.breakdown` |

Displays: total score + each component (priority, urgency, energy, duration, flow, suggestion).

**Stories:**
- All components contributing positively
- With penalties (suggestion penalty, duration penalty)
- Zero flow bonus

---

### `InProgressBlock`

Shown when the engine returns `mode: "in_progress_block"`. Mirrors the CLI output.

| Prop | Type |
|------|------|
| `task` | `NormalizedTask` | `RankResult.inProgressTask` |

Displays task title and the action prompt ("done / snooze / edit / dismiss"). Actions are display-only in this precursor UI.

**Stories:**
- Default (task name, action list)

---

### `EmptyState`

Shown when ranking returns zero results.

| Prop | Type |
|------|------|
| `context` | `string \| undefined` | Used to tailor the message |

Displays: "No eligible tasks found." and a suggestion (change context or add tasks).

**Stories:**
- With context set ("No tasks match 'garden'")
- Without context ("No eligible tasks found")

---

## Storybook Setup Notes

- Install alongside `apps/web`: `@storybook/react-vite`
- Fixture data is defined inline in each `*.stories.tsx` file; there is no shared fixture module
- The web app uses its own types (`apps/web/src/types/task.ts`) and does not import from `packages/engine`; no coupling to the engine from the web app
- Naming and story structure conventions: see [COMPONENT_BEST_PRACTICES.md](../guidelines/COMPONENT_BEST_PRACTICES.md)
