# Applying the Tendril color story to `apps/web`

A step-by-step plan to move the app onto the artboard-01 palette, with every value expressed as a CSS variable, light/dark switchable at runtime, and a Storybook page that reads its values from the live CSS rather than repeating them.

---

## 0. What is there today

| File | Role | Problem for this migration |
| --- | --- | --- |
| `src/styles/tokens.css` | 33 `--color-*`, 4 `--space-*`, 5 `--font-size-*`, 2 `--radius-*`. Light values only, single `:root` block. | No dark values. Cool grey (Tailwind slate) + indigo primary. Raw hexes sit directly on semantic names, so re-theming means rewriting every line. |
| `src/index.css` | A **second, unrelated** variable set (`--text`, `--text-h`, `--bg`, `--border`, `--code-bg`, `--accent`, `--accent-bg`, `--accent-border`, `--social-bg`, `--shadow`, plus `--sans`/`--heading`/`--mono`) with its own `@media (prefers-color-scheme: dark)` override block. | Two sources of truth for the same roles — six of the ten color variables are exact duplicates of a `tokens.css` role. Dark mode already exists here but only here, and it is media-query-only — not switchable. |
| `src/components/FAB/FAB.module.css` | `#4338CA`, `#3730A3` hard-coded hover/active; `rgba(0,0,0,.2)` shadows. | Breaks under any theme change. |
| `src/components/Carousel/Carousel.module.css` | `var(--color-border, #e5e7eb)` style fallbacks. | Fallbacks silently mask a missing token and pin cool greys. |
| `src/styles/DesignTokens.mdx` | Storybook page; swatches take the token name **and** a hardcoded `hex` string prop. | Hex column drifts from the CSS the moment tokens change. |
| `.storybook/preview.ts` | Imports `index.css` + `tokens.css`. | No theme switcher, no background wiring. |

Seven components consume tokens (`Breadcrumbs`, `Carousel`, `Checkbox`, `FAB`, `Icon`, `NavBar`, `Select`). The blast radius is small — this is a good moment to do it properly.

---

## 1. Restructure `tokens.css` into two layers

The single most important change: **separate the palette from the roles.** A raw ramp holds the colors; semantic tokens point at ramp entries. Components only ever touch semantic tokens, so a whole new color scheme is a change to layer 1 alone.

```css
/* ---------- Layer 1: the palette (raw, mode-independent names) ---------- */
:root {
  /* warm neutral ground */
  --tendril-canvas:      #F3EEE6;
  --tendril-surface:     #FBF8F3;
  --tendril-hairline:    #E4DCCF;
  --tendril-hairline-2:  #D8CDBB;
  --tendril-ink:         #2E2A26;
  --tendril-ink-body:    #4A443D;
  --tendril-ink-muted:   #7D746A;
  --tendril-ink-faint:   #A79C90;

  /* the accent — the one active priority
     (darkened one step from the original artboard-01 values so
     --color-text-on-primary clears 4.5:1 on the button fill — see §10) */
  --tendril-accent:      #9E5350;
  --tendril-accent-over: #8A463F;   /* hover  */
  --tendril-accent-down: #753C36;   /* active */
  --tendril-accent-wash: #EBD3CD;

  /* dark ground */
  --tendril-d-canvas:      #1B1917;
  --tendril-d-surface:     #24211D;
  --tendril-d-hairline:    #332E29;
  --tendril-d-hairline-2:  #3E3833;
  --tendril-d-ink:         #EDE7DE;
  --tendril-d-ink-body:    #C9C1B7;
  --tendril-d-ink-muted:   #948A7E;
  --tendril-d-ink-faint:   #6B6259;
  --tendril-d-accent:      #D98A7E;
  --tendril-d-accent-over: #E9A296;
  --tendril-d-accent-down: #C4756A;
  --tendril-d-accent-wash: #3B2B27;

  /* status — warmed so they sit in the same world as the accent,
     and kept far enough from it in hue that error ≠ accent */
  --tendril-success:   #4F7A57;
  --tendril-error:     #C2382B;
  --tendril-d-success: #7FA37E;
  --tendril-d-error:   #E0685A;
}
```

## 2. Map the roles — keep the existing names

Every current token name stays, so **no component CSS has to change** in this step. Add the two names the palette needs and the app was faking.

```css
/* ---------- Layer 2: semantic roles — LIGHT (default) ---------- */
:root {
  color-scheme: light;

  --color-text-strong:      var(--tendril-ink);
  --color-text-body:        var(--tendril-ink-body);
  --color-text-muted:       var(--tendril-ink-muted);
  --color-text-disabled:    var(--tendril-ink-faint);

  --color-border:           var(--tendril-hairline);
  --color-border-input:     var(--tendril-hairline-2);

  --color-bg-page:          var(--tendril-canvas);
  --color-bg-surface:       var(--tendril-surface);   /* NEW — cards, sheets */
  --color-bg-disabled:      var(--tendril-hairline);

  --color-primary:          var(--tendril-accent);
  --color-primary-hover:    var(--tendril-accent-over);  /* NEW */
  --color-primary-active:   var(--tendril-accent-down);  /* NEW */
  --color-primary-tint:     var(--tendril-accent-wash);
  --color-primary-disabled: var(--tendril-ink-faint);
  --color-text-on-primary:  var(--tendril-surface);

  --color-success:          var(--tendril-success);
  --color-error:            var(--tendril-error);

  /* absorbed from index.css — see §4 */
  --color-bg-code:      var(--tendril-surface);

  --shadow-sm: 0 1px 2px rgb(46 42 38 / .06);           /* NEW — tokenised */
  --shadow-md: 0 4px 12px rgb(46 42 38 / .10);
  --shadow-lg: 0 6px 16px rgb(46 42 38 / .14);

  /* type families — also absorbed from index.css */
  --font-sans:    system-ui, 'Segoe UI', Roboto, sans-serif;
  --font-heading: system-ui, 'Segoe UI', Roboto, sans-serif;
  --font-mono:    ui-monospace, Consolas, monospace;
}
```

Note `--color-bg-disabled` moves from a near-white (`#F9FAFB`) to the hairline tone: on a warm canvas, "disabled" has to be *darker* than the surface, not lighter.

## 3. Add the dark block, keyed on an attribute

Two selectors, one rule set. `[data-theme="dark"]` is the explicit user choice; the media query inside `[data-theme="auto"]` (and bare `:root` with no attribute) follows the OS. There's no way to share the declaration block between a plain selector and one nested in `@media` without a preprocessor or a build step, so the values are written out twice — deliberately, see the trade-off note below.

Concretely:

```css
:root[data-theme='dark'] {
  color-scheme: dark;
  --color-text-strong:     var(--tendril-d-ink);
  --color-text-body:       var(--tendril-d-ink-body);
  --color-text-muted:      var(--tendril-d-ink-muted);
  --color-text-disabled:   var(--tendril-d-ink-faint);
  --color-border:          var(--tendril-d-hairline);
  --color-border-input:    var(--tendril-d-hairline-2);
  --color-bg-page:         var(--tendril-d-canvas);
  --color-bg-surface:      var(--tendril-d-surface);
  --color-bg-disabled:     var(--tendril-d-hairline);
  --color-primary:         var(--tendril-d-accent);
  --color-primary-hover:   var(--tendril-d-accent-over);
  --color-primary-active:  var(--tendril-d-accent-down);
  --color-primary-tint:    var(--tendril-d-accent-wash);
  --color-text-on-primary: var(--tendril-d-canvas);
  --color-success:         var(--tendril-d-success);
  --color-error:           var(--tendril-d-error);
  --color-bg-code:         var(--tendril-d-surface);
  --shadow-sm: 0 1px 2px rgb(0 0 0 / .40);
  --shadow-md: 0 4px 12px rgb(0 0 0 / .50);
  --shadow-lg: 0 6px 16px rgb(0 0 0 / .60);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) { /* …the same declarations… */ }
}
```

To avoid writing the block twice by hand, extract the dark declarations into `tokens.dark.css` and `@import` it inside both selectors is not possible in plain CSS — so either (a) accept one duplicated block with a comment pointing at the other, or (b) generate `tokens.css` from a small `tokens.ts` map at build time. Given the token count, **(a) is the pragmatic choice**; revisit if the palette grows past ~40 entries.

Because (a) means two hand-maintained blocks, add a small guardrail so a token added to one and forgotten in the other fails loudly instead of silently breaking dark mode: a test that parses `tokens.css`, extracts the custom-property names declared inside `:root[data-theme='dark']` and inside the `@media (prefers-color-scheme: dark)` block, and asserts the two sets are identical. Cheap to write, and it's the only thing standing between "forgot a token" and a dark-mode regression nobody notices until a screenshot review.

## 4. Move `index.css`'s tokens into `tokens.css` and consolidate the duplicates

`index.css` becomes what its name says — base element styles and layout — and owns only the variables the migration deliberately leaves out of scope. Every declaration in its `:root` block is either a duplicate of an existing role, a role that belongs in `tokens.css`, a scaffold-only variable left untouched (see below), or a base style that is not a token at all. Resolve each one; dark values for the migrated roles now live in one place (§3), so only the scaffold's own dark values stay behind in the `@media (prefers-color-scheme: dark)` sibling.

| `index.css` variable | Resolution | Canonical token |
| --- | --- | --- |
| `--text` #6b6375 | duplicate | `--color-text-body` |
| `--text-h` #08060d | duplicate | `--color-text-strong` |
| `--bg` #fff | duplicate | `--color-bg-page` |
| `--border` #e5e4e7 | duplicate | `--color-border` |
| `--accent` #aa3bff | not a product token — see note below | leave as-is, out of scope |
| `--accent-bg` rgba(accent, .1) | not a product token — see note below | leave as-is, out of scope |
| `--shadow` | duplicate | `--shadow-md` |
| `--accent-border` rgba(accent, .5) | not a product token — see note below | leave as-is, out of scope |
| `--code-bg` #f4f3ec | keep as a role | `--color-bg-code` |
| `--social-bg` rgba(…, .5) | not a product token — see note below | leave as-is, out of scope |
| `--sans`, `--heading`, `--mono` | keep as roles; type families are tokens | `--font-sans`, `--font-heading`, `--font-mono` |
| `font: 18px/145%`, `letter-spacing`, `color-scheme`, `font-synthesis`, smoothing, the `@media (max-width:1024px)` size step | not tokens — base styles | stay in `index.css`, referencing `var(--font-sans)` |

Five duplicates disappear; two new roles (`--color-bg-surface`, `--color-bg-code`) and three font families join `tokens.css` (already written into the §2 and §3 snippets above).

The one that needs a decision rather than a rename:

- **`--code-bg` #f4f3ec.** Already a warm off-white — the one value in `index.css` that survives the palette change on its own terms. Point it at `--tendril-surface` and keep the role name.

`--accent`, `--accent-bg`, `--accent-border`, and `--social-bg` (plus the `#social .button-icon` dark-mode filter rule that goes with it) are **not** touched by this migration. They're unmodified Vite/React scaffold — the default `.counter` demo button and the `#next-steps` "learn React"/social-links footer in `App.css` — not product UI. The app has no real hyperlinks today (the only navigation, `NavBar`, already uses `--color-primary`/`--color-text-*` and never referenced any of these). So there's no "second accent" or "translucent surface" role to manufacture: leave these four variables, their dark-mode values, and `App.css` exactly as they are for this migration, and decide how links (and anything else that needs a translucent surface) should look — reusing `--color-primary`/`--color-bg-surface`, or their own quieter role — if and when the product actually grows real links. Deleting the leftover scaffold entirely is a separate cleanup, not part of this plan. (This is also why `--color-bg-translucent` and `--color-border-accent` were dropped from the §2/§3 snippets above — they existed only to absorb these two scaffold-only variables, and per the project's own minimal-footprint guidance there's no reason to add a token with zero real consumers.)

Mechanics:

1. Add the two new color roles (`--color-bg-surface`, `--color-bg-code`) + three font families to `tokens.css` (both modes).
2. Rewrite `index.css`'s element rules to use the canonical names: `color: var(--color-text-body)`, `background: var(--color-bg-page)`, `h1, h2 { font-family: var(--font-heading); color: var(--color-text-strong) }`, `code { background: var(--color-bg-code); font-family: var(--font-mono) }`, and so on.
3. `rg -n -- '--text\b|--text-h|--bg\b|--border\b|--code-bg|--shadow\b|--sans|--heading\b|--mono\b' apps/web/src` and update every remaining call site. Do **not** leave alias variables behind — a deliberately breaking rename is what keeps the consolidation from quietly reverting. (Deliberately excludes `--accent`, `--accent-bg`, `--accent-border`, `--social-bg` — those stay untouched, see above.)
4. Remove the migrated variable declarations from both `:root` blocks in `index.css` (light and the `@media (prefers-color-scheme: dark)` block) — but don't delete the blocks wholesale: the non-token base styles (`font`, `letter-spacing`, `color-scheme`, `font-synthesis`, smoothing) and the untouched `--accent*`/`--social-bg` scaffold variables (plus `#social .button-icon`) stay right where they are.
5. Import order: `tokens.css` **before** `index.css`. Update `src/main.tsx` and `.storybook/preview.ts`.
6. Update the contract line in `DesignTokens.mdx` — font *families* are now tokenised; font sizes and weights still are not.

## 5. Rework the eight slide tints

`--color-slide-0…7` are eight pastels at eight different hues — the loudest thing in the current palette and the most at odds with "one accent, everything else quiet". Replace with eight steps of the warm ground at very low chroma, staying inside a ±25° hue band around the canvas:

```css
--tendril-slide-params: #F6EDE1;
--tendril-slide-0: #EFE9DD;  --tendril-slide-4: #EAE6DC;
--tendril-slide-1: #F0E7DE;  --tendril-slide-5: #EFE5DE;
--tendril-slide-2: #ECE8E1;  --tendril-slide-6: #F1EBDD;
--tendril-slide-3: #F1E8E0;  --tendril-slide-7: #EBE8E2;
```

Dark equivalents: the same eight as `#221F1C … #2A2622`. If the slides need to be *told apart* rather than merely varied, use one shared tint plus a left-edge accent mark instead of eight fills — and confirm that intent before implementing.

## 6. Remove the last hard-coded values

- `FAB.module.css`: `#4338CA` → `var(--color-primary-hover)`, `#3730A3` → `var(--color-primary-active)`, `rgba(0,0,0,.2)/.25` → `var(--shadow-md)/var(--shadow-lg)`.
- `Carousel.module.css`: drop all three `var(--token, #hex)` fallbacks.
- Add an ESLint/stylelint rule (`declaration-property-value-disallowed-list` on color properties, or a `no-hex-colors` custom rule) so a raw hex in a `*.module.css` fails CI. Whitelist `tokens.css`.

## 7. Runtime theme switching

1. `src/features/theme/useTheme.ts` — `'light' | 'dark' | 'auto'`, persisted to `localStorage['tendril-theme']`, written to `document.documentElement.dataset.theme`.
2. Anti-flash: a 3-line inline script in `index.html` `<head>` that reads localStorage and sets `data-theme` before first paint.
3. A control in `NavBar` — three-way segmented (Light / Auto / Dark), matching the token names so there is no translation layer.
4. `<meta name="theme-color">` updated from the same hook, so mobile browser chrome follows.

## 8. Storybook — theme switching

In `.storybook/preview.ts`:

```ts
export const globalTypes = {
  theme: {
    description: 'Color scheme',
    defaultValue: 'light',
    toolbar: { icon: 'circlehollow', items: ['light', 'dark'], dynamicTitle: true },
  },
};

export const decorators = [
  (Story, ctx) => {
    document.documentElement.dataset.theme = ctx.globals.theme;
    return Story();
  },
];
```

Also set `parameters.backgrounds` to `var(--color-bg-page)` (or disable backgrounds and let the decorator paint the canvas), so a story never sits on white while claiming a warm ground.

## 9. Storybook — the Color Story page, derived from the CSS

Replace the hex props in `DesignTokens.mdx` with values read from the cascade at render time. One small hook, then the page cannot drift.

`src/styles/useTokenValue.ts`:

```ts
export function useTokenValue(name: string) {
  const [value, setValue] = useState('');
  const theme = document.documentElement.dataset.theme;
  useEffect(() => {
    const read = () =>
      setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, [name, theme]);
  return value;
}
```

Then `<Swatch token="--color-primary" label="primary action" />` — no `hex` prop. The swatch prints `useTokenValue(token)` beneath the name, so the page shows **light or dark values depending on the toolbar**, from the same CSS the app uses.

Going one step further, auto-discover the token list instead of hand-listing it:

```ts
export function listTokens(prefix = '--color-') {
  const out = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }      // cross-origin
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) continue;
      for (const prop of Array.from(rule.style)) if (prop.startsWith(prefix)) out.add(prop);
    }
  }
  return [...out].sort();
}
```

Group by the segment after the prefix (`text`, `border`, `bg`, `primary`, `slide`, status) to build the sections automatically. A new token then appears in Storybook the moment it is added to `tokens.css` — which is the property you actually want from "derived from the CSS values".

Page structure (`ColorStory.mdx`, title `Design System/Color Story`):

1. **The story** — one paragraph: a cleared, uncluttered ground; a single confident accent that means *the one next thing*. Two sentences on why there is no second accent.
2. **Ground** — canvas / surface / hairline swatches, live hexes, both modes via the toolbar.
3. **Ink** — the four text roles, each shown as real text on canvas *and* on surface, with the computed contrast ratio next to it.
4. **The accent** — base / hover / active / wash / on-primary, plus a live button and a selected row.
5. **Status** — success / error, with a note that they are deliberately the only other saturated colors.
6. **Slide tints** — the eight, side by side.
7. **Do / don't** — accent reserved for the single active priority; never two accents on one screen; disabled is darker than surface, not lighter.

Keep `DesignTokens.mdx` for spacing, radius and the token contract; `ColorStory.mdx` carries the color narrative. Cross-link them.

## 10. Verify

- Contrast: `--color-text-body` on `--color-bg-page` and on `--color-bg-surface` ≥ 4.5:1 in **both** modes; `--color-text-on-primary` on `--color-primary` ≥ 4.5:1. The original artboard-01 accent (`#B4635A` against `#FBF8F3`, ~4.0:1) fell short of that bar for both the button fill and accent-colored body copy, so §1's accent ramp was darkened one step (`#9E5350` / `#8A463F` / `#753C36` for base/hover/active) — that alone clears 4.5:1 against both `--tendril-surface` (5.2:1) and `--tendril-canvas` (4.78:1), so no separate `--color-primary-text` step is needed. Re-verify with the actual rendered colors before sign-off; the numbers above are hand-computed, not tool-measured.
- Run the a11y addon across all seven components in both themes (`test: 'error'` in CI once green).
- Grep for stragglers: `rg -n '#[0-9a-fA-F]{3,8}' apps/web/src --glob '!**/tokens.css'` returns nothing (`App.css`'s untouched `--accent*`/`--social-bg` rgba() values are hand-authored, not hex, so this grep won't flag them), and no `--text`/`--bg`/`--sans` references survive outside `tokens.css`. `--accent`/`--accent-bg`/`--accent-border`/`--social-bg` are expected to remain, confined to `index.css`/`App.css` — see §4.
- Toggle light → dark on every story and every route; watch for anything that reads as "inverted grey" rather than warm.
- Parse `tokens.css` and assert `:root[data-theme='dark']` and the `@media (prefers-color-scheme: dark)` block declare the same set of custom-property names (the guardrail from §3).

---

## Suggested commit order

1. `tokens.css` two-layer restructure, light only — no visual change intended beyond the new (already-darkened, AA-checked) palette. Add the `documentation/ARCHITECTURE.md` entry for the two-layer palette/role structure in this same commit, per this repo's rule that architectural decisions land with the decision, not after.
2. Dark block + `color-scheme` + shadow tokens, plus the token-parity guardrail from §3. Note the accepted duplicated-block trade-off in the same `ARCHITECTURE.md` entry from step 1.
3. `index.css` tokens moved into `tokens.css`, duplicates consolidated, call sites renamed, import order fixed. `--accent*`/`--social-bg` and their dark values deliberately left in place (§4).
4. Hard-coded hexes removed from `FAB` / `Carousel`; lint rule added.
5. `useTheme` + anti-flash script + NavBar control.
6. Storybook theme toolbar + decorator.
7. `useTokenValue` / `listTokens` + `ColorStory.mdx`; hex props stripped from `DesignTokens.mdx`.

Steps 1–4 are mechanical and safe to land together. 5–7 are the part worth reviewing carefully.
