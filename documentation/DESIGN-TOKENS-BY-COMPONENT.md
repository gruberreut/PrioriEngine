# Applying the TempAppName design, one component at a time

A per-component playbook. Each section is self-contained: pick the component you are working on, add its token block to `apps/web/src/styles/tokens.css`, apply the CSS diff, tick the checklist. Nothing here requires migrating anything else first.

The visual reference is artboard **05 · Form components** in the TempAppName identity exploration — every value below is taken from it.

---

## 1. The token model

Three layers, each with one job. Layers 1 and 2 already exist in `tokens.css`. This document adds layer 3.

```
Layer 1  --tendril-*          raw palette. Hexes live here and nowhere else.
Layer 2  --color-* --space-*  semantic roles, mode-aware. "What it means."
         --radius-* --shadow-*
Layer 3  --<component>-*      per-component knobs. "What this one component uses."
```

**The rule: a `*.module.css` file references layer 3 only.**

A component that reads `var(--color-primary)` directly cannot be adjusted without adjusting everything else that reads it. A component that reads `var(--fab-bg)` — which itself defaults to `var(--color-primary)` — can be retuned in one line, in one place, with a diff that says exactly what changed and for whom.

### Where layer 3 lives

In `tokens.css`, in a third block after the dark-mode blocks, one clearly-labelled group per component:

```css
/* ---------- Layer 3: component tokens ----------
   One group per component. Every entry defaults to a Layer-2 role — a literal
   value here means this component deliberately diverges, and the comment says
   why. Components reference ONLY these; see apps/web/CLAUDE.md § Design tokens. */
:root {
  /* Button — components/Button */
  --button-radius:          var(--radius-md);
  --button-height:          var(--control-height-md);
  /* … */

  /* FAB — components/FAB */
  --fab-size:               56px;
  --fab-radius:             var(--radius-lg);   /* squircle, not a circle: the
                                                   Tendril mark is never circular */
  /* … */
}
```

Layer 3 sits outside the light/dark split on purpose. It points at layer-2 roles, and those already flip with the mode, so a component token is written once and works in both. **If you find yourself adding a `:root[data-theme='dark']` override for a component token, stop** — the value you need belongs in layer 2 as a role, where the dark block already exists and the parity test already guards it.

### How much belongs in layer 3

Balance, not maximalism. The test is: *would a designer plausibly ask to change this for this component alone?*

| Put it in layer 3 | Keep reading layer 2 directly |
| --- | --- |
| Background, border, and text colors the component paints | `--space-*` used for internal gaps between sub-elements |
| Radius, height, min-width, icon size | `--font-sans` / `--font-mono` family |
| Padding on its own box | `--motion-*` easing and duration (a component with its own timing is a bug, not a style) |
| Shadow level | |
| Font size of its own label | |

Roughly 6–12 tokens per component. Two smells to watch:

- **A literal in layer 3 that appears twice.** Two components needing the same literal means it is a role. Promote it to layer 2 and point both at it.
- **A layer-3 token used by a different component.** `--card-radius` inside `ListRow.module.css` couples the two silently. Give `ListRow` its own token, even if it defaults to the same role.

---

## 2. Global tokens to add first

These are prerequisites — shared scales the per-component blocks below point at. Add the whole block once; it changes nothing on its own, because no component references it yet.

Add to the **light** `:root` block in `tokens.css`:

```css
  /* Border radius — the TempAppName scale (artboard 03). Large and soft
     throughout; nothing sharp-cornered anywhere, including inputs and the
     app icon. This is a RENAME of the existing 6px/8px sm+md pair, not an
     addition — every existing call site keeps working and simply lands on
     the correct TempAppName value. */
  --radius-xs:   8px;    /* chips, tags                                 */
  --radius-sm:   12px;   /* small controls, icon buttons, nav targets   */
  --radius-md:   16px;   /* buttons, text inputs, list rows             */
  --radius-lg:   22px;   /* cards, menus, the FAB                       */
  --radius-xl:   28px;   /* sheets, modals, full-bleed panels           */
  --radius-full: 999px;  /* dots, toggles, pills                        */

  /* Control heights — 44px is the floor for anything tappable */
  --control-height-xs: 34px;  /* chip                          */
  --control-height-sm: 36px;  /* small button                  */
  --control-height-md: 44px;  /* icon button, list row, in-group button */
  --control-height-lg: 46px;  /* primary button                */
  --control-height-xl: 48px;  /* text input, select            */

  /* Focus — never the browser default */
  --focus-ring-width:   3px;
  --focus-ring-color:   var(--color-primary-tint);
  --focus-ring:         0 0 0 var(--focus-ring-width) var(--focus-ring-color);
  --focus-ring-offset:  0 0 0 2px var(--color-bg-page), 0 0 0 4px var(--color-primary);

  /* Motion — "organic settle": fast to leave, slow to arrive, no bounce */
  --motion-ease:     cubic-bezier(0.22, 1, 0.28, 1);
  --motion-fast:     160ms;  /* taps, tints, hovers            */
  --motion-medium:   420ms;  /* sheets, screen transitions      */
  --motion-slow:     720ms;  /* the icon unfurl on completion   */

  /* Stacking order — kept together so collisions are visible in one place */
  --z-bottom-nav: 90;
  --z-fab:        100;

  /* Spacing — extending the existing 4pt scale */
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;

  /* Font sizes — additions for the component set */
  --font-size-body:  14px;
  --font-size-meta:  12px;
  --font-size-micro: 11px;
```

The radius rename is the one global change here with a visible effect, and it is wider than it first looks. `--radius-sm` and `--radius-md` are already referenced well beyond the components this document migrates: `Select`, `NavBar`, `ThemeToggle` (since deleted), `TaskCard`, `EnergyPicker`, `LocationPicker`, `DurationPicker`, `PriorityPicker`, `TaskCreationForm`, `TaskCreationPage`, `InProgressBlock`, `ResultsSlide`, `TaskTreeItem`, `EmptyState` — roughly fifteen files, most of them outside this plan's scope this round. The rename still carries all of them automatically, no CSS edit required, but "check visually" needs to be a real step against that whole list, not an aside:

- [ ] After TASKS-DONE.md § 22.1 lands, visually diff every file in the list above in both modes — the rename affects them whether or not they are otherwise being migrated this round

Everything else in the block is additive and inert until referenced. `--motion-*`, `--focus-ring*`, `--control-height-*`, `--z-*` and the radius scale need no dark variants: they are mode-independent, and `--focus-ring-color` resolves through `--color-primary-tint`, which already flips.

---

## 3. Existing components

Ordered by how contained the change is. Each is independent.

### 3.1 Checkbox — `components/Checkbox`

Currently a native `<input type="checkbox">` with a styled label. TempAppName wants a 22px control with an accent fill and a check glyph, inside a 44px row.

**Tokens** — add to layer 3:

```css
  /* Checkbox — components/Checkbox */
  --checkbox-size:            22px;
  --checkbox-radius:          7px;   /* not --radius-xs: an 8px radius on a 22px
                                        box reads as a rounded rect; 7px reads as
                                        a soft square, which is what the sheet shows */
  --checkbox-row-height:      var(--control-height-md);
  --checkbox-bg:              var(--color-bg-surface);
  --checkbox-border:          var(--color-border-input);
  --checkbox-border-width:    1.5px;
  --checkbox-bg-checked:      var(--color-primary);
  --checkbox-mark:            var(--color-text-on-primary);
  --checkbox-bg-disabled:     var(--color-bg-disabled);
  --checkbox-label-size:      var(--font-size-body);
  --checkbox-gap:             var(--space-3);
```

**CSS.** Keep the native input for semantics and keyboard behaviour; hide it visually and draw a sibling span, or use `appearance: none` on the input itself (simpler, and the label association survives):

```css
.container {
  display: flex;
  align-items: center;
  gap: var(--checkbox-gap);
  min-height: var(--checkbox-row-height);   /* 44px touch target */
}

.input {
  appearance: none;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  flex: none;
  margin: 0;
  border: var(--checkbox-border-width) solid var(--checkbox-border);
  border-radius: var(--checkbox-radius);
  background: var(--checkbox-bg);
  cursor: pointer;
  transition: background var(--motion-fast) var(--motion-ease),
              border-color var(--motion-fast) var(--motion-ease);
  display: grid;
  place-content: center;
}

.input::after {
  content: '';
  width: 11px;
  height: 6px;
  border-left: 2px solid var(--checkbox-mark);
  border-bottom: 2px solid var(--checkbox-mark);
  transform: rotate(-45deg) translateY(-1px);
  opacity: 0;
  transition: opacity var(--motion-fast) var(--motion-ease);
}

.input:checked {
  background: var(--checkbox-bg-checked);
  border-color: var(--checkbox-bg-checked);
}

.input:checked::after { opacity: 1; }

.input:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.input:disabled {
  background: var(--checkbox-bg-disabled);
  border-color: var(--checkbox-bg-disabled);
  cursor: not-allowed;
}

.label { font-size: var(--checkbox-label-size); }   /* color unchanged */
```

**Stories:** add `Checked`, `Focused` (via `parameters.pseudo` if `@storybook/addon-pseudo-states` is installed, otherwise a story with a note), `DisabledChecked`.

**Checklist:** 44px row height · check glyph visible at 200% zoom · focus ring present with keyboard, absent with mouse · both modes.

---

### 3.2 FAB — `components/FAB`

Closest to correct already. Two changes: the shape stops being a circle, and it gains a focus ring.

```css
  /* FAB — components/FAB */
  --fab-size:           56px;
  --fab-radius:         var(--radius-lg);   /* 22px squircle. A circle reads as a
                                               generic add-button; the softened
                                               square belongs to this system */
  --fab-bg:             var(--color-primary);
  --fab-bg-hover:       var(--color-primary-hover);
  --fab-bg-active:      var(--color-primary-active);
  --fab-fg:             var(--color-text-on-primary);
  --fab-shadow:         var(--shadow-md);
  --fab-shadow-hover:   var(--shadow-lg);
  --fab-glyph-size:     24px;   /* 28px is heavy against the new radius */
  --fab-inset-right:    var(--space-5);
  /* sits above the bottom bar, clear of the home indicator */
  --fab-inset-bottom:   calc(var(--bottom-nav-total-height) + var(--space-3));
  --fab-z:              var(--z-fab);
```

Diff: `border-radius: 50%` → `var(--fab-radius)`; `width/height: 56px` → `var(--fab-size)`; `font-size: 28px` → `var(--fab-glyph-size)`; `background`/`box-shadow` → the `--fab-*` names; `bottom`/`right` → the inset tokens; hard-code nothing. Add:

```css
.fab:focus-visible {
  outline: none;
  box-shadow: var(--fab-shadow), var(--focus-ring-offset);
}
```

**Checklist:** shadow reads as warm shade in light mode, neutral in dark · glyph optically centred (a `+` usually needs no nudge, an icon may) · focus ring visible over both page and card backgrounds.

---

### 3.3 ThemeToggle — removed (was `components/ThemeToggle`)

**Status:** there is no theme control in the UI. Theme follows time of day by default (`auto` mode in `features/theme/useTheme.ts`, light 6am–6pm, dark otherwise), and that replaced the need for a toggle. `ThemeToggle` was deleted (TASKS-TECH.md § 24.8) once it became an unused wrapper with no real caller — § 24 built `SplitGroup` as the general seamed/joined segmented primitive (artboard's "Today / This week / Someday" example) instead, and `ThemeToggle` was migrated onto *that* rather than the distinct construction below. That was a shortcut, not a correction: this section's tinted-track-with-inset-pill design is what a real theme control was actually spec'd to look like, and it's never been built. Whoever picks up § 23 (theme settings screen) needs to decide then whether to build this properly or accept `SplitGroup`'s shape for simplicity — the token block and rationale below are kept for that decision, not superseded.

Currently a bordered button group with negative-margin seams. The sheet's segmented control is a different construction: a tinted track, an inset selected pill, no shared borders. This is the one existing component whose markup changes shape.

```css
  /* ThemeToggle / segmented control — components/ThemeToggle (never built; see Status above) */
  --segmented-track-bg:      var(--color-border);
  --segmented-track-radius:  var(--radius-md);
  --segmented-track-pad:     3px;
  --segmented-opt-height:    38px;
  --segmented-opt-radius:    13px;   /* track radius minus padding, so the
                                        selected pill sits concentric */
  --segmented-opt-pad-x:     var(--space-4);
  --segmented-opt-fg:        var(--color-text-muted);
  --segmented-opt-fg-sel:    var(--color-text-strong);
  --segmented-opt-bg-sel:    var(--color-bg-surface);
  --segmented-opt-shadow-sel: var(--shadow-sm);
  --segmented-opt-size:      var(--font-size-meta);
```

```css
.group {
  display: inline-flex;
  gap: var(--segmented-track-pad);
  padding: var(--segmented-track-pad);
  border-radius: var(--segmented-track-radius);
  background: var(--segmented-track-bg);
}

.button {
  height: var(--segmented-opt-height);
  padding: 0 var(--segmented-opt-pad-x);
  border: none;                          /* was: 1px + negative margin seams */
  border-radius: var(--segmented-opt-radius);
  background: transparent;
  color: var(--segmented-opt-fg);
  font-size: var(--segmented-opt-size);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--motion-fast) var(--motion-ease),
              color var(--motion-fast) var(--motion-ease);
}

.selected {
  background: var(--segmented-opt-bg-sel);
  color: var(--segmented-opt-fg-sel);
  box-shadow: var(--segmented-opt-shadow-sel);
}

.button:focus-visible { outline: none; box-shadow: var(--focus-ring); }
```

Delete `.button + .button`, `.button:first-child`, `.button:last-child`, and the `z-index` juggling — the track construction needs none of them.

Note the selected option loses its accent coloring. That is deliberate: the accent marks *the one active task*, not the current tab. If a selected segment must be accent-colored somewhere, that is a different component (see the split group in artboard 05, which uses `--color-primary-tint`), not this one.

**Checklist:** three options fit on a 360pt screen without wrapping · selected pill concentric with the track · 38px is below the 44px floor, which is acceptable **only** because the whole group exceeds it — do not reuse `--segmented-opt-height` for standalone buttons.

---

### 3.4 Select — `components/Select`

Native `<select>` with `appearance: auto`. Two decisions:

**(a) Keep it native.** Cheapest, accessible, and the closed state can match the sheet exactly. The open menu is drawn by the OS and will not match. Correct choice for now.

**(b) Replace with a listbox.** Matches the sheet's open state (18px radius menu, 40px rows, `--color-primary-tint` on the selected row, `--shadow-md`), and costs keyboard handling, focus trapping, and a positioning strategy. Do this only when a design requirement actually needs the custom menu.

Tokens cover both; the menu tokens go unused under (a).

```css
  /* Select — components/Select */
  --select-height:          var(--control-height-xl);
  --select-radius:          var(--radius-sm);   /* 12px now; goes to --radius-md
                                                  when the field gets its full
                                                  48px treatment */
  --select-pad-x:           var(--space-4);
  --select-bg:              var(--color-bg-surface);   /* was --color-bg-page:
                                                          an input is a surface */
  --select-border:          var(--color-border-input);
  --select-border-focus:    var(--color-primary);
  --select-fg:              var(--color-text-strong);
  --select-fg-placeholder:  var(--color-text-disabled);
  --select-bg-disabled:     var(--color-bg-disabled);
  --select-fg-disabled:     var(--color-text-disabled);
  --select-min-width:       160px;   /* keeps the control from collapsing to
                                         fit a short value plus the arrow */
  --select-label-size:      var(--font-size-micro);
  --select-label-fg:        var(--color-text-body);
  --select-value-size:      var(--font-size-body);
  /* menu — only under option (b) */
  --select-menu-bg:         var(--color-bg-surface);
  --select-menu-radius:     var(--radius-lg);
  --select-menu-shadow:     var(--shadow-md);
  --select-menu-pad:        6px;
  --select-option-height:   40px;
  --select-option-radius:   var(--radius-sm);
  --select-option-bg-sel:   var(--color-primary-tint);
  --select-option-fg-sel:   var(--color-primary);
```

Diff for (a): swap every `var(--color-*)` for its `--select-*` equivalent; `padding` → `height: var(--select-height)` plus `padding: 0 var(--select-pad-x)`; `--radius-sm` → `--select-radius`; label `--font-size-label` → `--select-label-size` (16px → 11px: the sheet's field labels are small and quiet, and the value carries the size). Add:

```css
.select:focus-visible {
  outline: none;
  border-color: var(--select-border-focus);
  box-shadow: var(--focus-ring);
}
```

**Checklist:** 48px tall · label 11px/500 above the control · focus shows both accent border and 3px tint ring · disabled is *darker* than the surface, not lighter · both modes.

---

### 3.5 NavBar — bottom bar — `components/NavBar`

**Done** — was delivered via a patch folder (`priori-patch/`), since applied and deleted. TASKS-DONE.md § 17 already called for this: the top bar is replaced by a fixed bottom bar with icon links, safe-area insets, and a collision check against the FAB.

```css
  /* BottomNav — components/NavBar */
  --bottom-nav-height:            56px;
  --bottom-nav-safe-area:         env(safe-area-inset-bottom, 0px);
  --bottom-nav-total-height:      calc(var(--bottom-nav-height) + var(--bottom-nav-safe-area));
  --bottom-nav-bg:                var(--color-bg-surface);
  --bottom-nav-border:            var(--color-border);
  --bottom-nav-shadow:            var(--shadow-md);
  --bottom-nav-pad-x:             var(--space-4);
  --bottom-nav-gap:               var(--space-2);
  --bottom-nav-z:                 var(--z-bottom-nav);
  --bottom-nav-target-size:       var(--control-height-md);
  --bottom-nav-target-radius:     var(--radius-sm);
  --bottom-nav-target-bg-active:  var(--color-primary-tint);
  --bottom-nav-glyph-size:        24px;
  --bottom-nav-label-size:        10px;   /* below --font-size-micro: a nav label
                                             is a caption under a glyph, and the
                                             glyph carries the meaning */
  --bottom-nav-link-fg:           var(--color-text-muted);
  --bottom-nav-link-fg-hover:     var(--color-text-body);
  --bottom-nav-link-fg-active:    var(--color-primary);
```

`--bottom-nav-total-height` is the token other fixed elements position against, rather than each recomputing height + inset. The FAB does exactly that.

Two new line icons, both `currentColor` (the existing icon set is gradient-filled and cannot take a nav bar's active color): `Tendril` for Rank — the branch-and-coil mark, whose curl has to clear the branch or the mark reads as a lowercase "p" — and `ListChecks` for Tasks. Labels drop below 360px; the glyphs and the accent carry the meaning.

The theme toggle stays in the bar's right slot so nothing else breaks, but a three-option segmented control inside a bottom nav is crowded — it probably belongs on a settings screen once one exists.

**Checklist:** exactly one link in the accent · 44px targets at every width · safe-area inset as padding, so the bar's background extends behind the home indicator rather than stopping above it · FAB clears the bar · every scrollable route gains `padding-bottom: calc(var(--bottom-nav-total-height) + var(--space-4))`, best applied once on the app shell.

---

### 3.6 Breadcrumbs — `components/Breadcrumbs`

Smallest change in the set.

```css
  /* Breadcrumbs — components/Breadcrumbs */
  --breadcrumbs-size:          var(--font-size-meta);
  --breadcrumbs-fg:            var(--color-text-muted);
  --breadcrumbs-fg-current:    var(--color-text-strong);
  --breadcrumbs-separator-fg:  var(--color-border-input);
  --breadcrumbs-gap:           var(--space-2);
  --breadcrumbs-crumb-max:     200px;
```

Diff: `--font-size-card-meta` (15px) → `--breadcrumbs-size` (12px); `gap: var(--space-1)` → `var(--breadcrumbs-gap)`; replace `.separator { opacity: 0.5 }` with an explicit `color: var(--breadcrumbs-separator-fg)` — an opacity on a warm neutral drifts towards grey, a real token does not. Add a `.current` class at `--breadcrumbs-fg-current` and weight 500.

**Checklist:** the current crumb is the only strong one · separators visibly lighter than the crumbs but not invisible in dark mode.

---

### 3.7 Carousel — `components/Carousel`

Two parts: the dots, and the per-page tints from artboard 04.

```css
  /* Carousel — components/Carousel */
  --carousel-dot-size:        6px;
  --carousel-dot-size-active: 16px;   /* the active dot elongates rather than
                                         changing size — see artboard 04 */
  --carousel-dot-radius:      var(--radius-full);
  --carousel-dot-bg:          var(--color-border-input);
  --carousel-dot-bg-active:   var(--color-primary);
  --carousel-dot-gap:         5px;
  --carousel-hint-fg:         var(--color-text-muted);
  --carousel-hint-size:       var(--font-size-meta);
  --carousel-slide-pad:       var(--space-5);
```

Diff: `.dot` from 8×8 to `var(--carousel-dot-size)`; `.dotActive` gains `width: var(--carousel-dot-size-active)` and a `width` transition on `--motion-fast`; `border-radius: 50%` → `--radius-full`; `font-size: 0.8125rem` → `--carousel-hint-size`.

For per-page backgrounds, the eight `--color-slide-*` roles exist in layer 2 and now carry real dark values in both blocks (they previously all resolved to `#221F1C`, which made every dark-mode page identical). Apply with `background: var(--color-slide-{n})` on the slide, indexed from the page.

One consequence worth knowing: in dark mode a tint sits only 1.02–1.05:1 from `--color-bg-surface`. Cards on a tinted page separate by their hairline border, not by contrast — so a card without a border will visually merge into the page. In light mode the same pair is comfortable.

**Checklist:** active dot elongates smoothly, no layout jump in the row · cards on a tinted page still read as cards (they sit on `--color-bg-surface`, separated by hairline, never by contrast alone).

---

## 4. New components

Build these on the same three-layer model. Full token blocks; markup is straightforward from artboard 05.

**These are specifications, not implementations.** Each one needs a task entry
of its own (now `TASKS-TECH.md` § 24) before any code is written — see TASKS-DONE.md § 22.8. Nothing in § 4 has a component
file, a story, or a call site yet.

### 4.1 Button — `components/Button`

The most-needed missing primitive. Variants: `primary`, `secondary`, `ghost`, `destructive`. Sizes: `sm` 36, `md` 46, `icon` 44 square. Props: `variant`, `size`, `block`, `disabled`, `loading`.

```css
  /* Button — components/Button */
  --button-height:            var(--control-height-lg);
  --button-height-sm:         var(--control-height-sm);
  --button-radius:            var(--radius-md);
  --button-radius-sm:         var(--radius-sm);
  --button-pad-x:             var(--space-5);
  --button-pad-x-sm:          var(--space-3);
  --button-size:              var(--font-size-body);
  --button-weight:            500;

  --button-primary-bg:        var(--color-primary);
  --button-primary-bg-hover:  var(--color-primary-hover);
  --button-primary-bg-active: var(--color-primary-active);
  --button-primary-fg:        var(--color-text-on-primary);

  --button-secondary-border:  var(--color-border-input);
  --button-secondary-fg:      var(--color-text-body);
  --button-secondary-bg-hover: var(--color-primary-tint);

  --button-ghost-fg:          var(--color-primary);
  --button-ghost-bg-hover:    var(--color-primary-tint);

  --button-danger-border:     var(--color-error);
  --button-danger-fg:         var(--color-error);

  --button-bg-disabled:       var(--color-bg-disabled);
  --button-fg-disabled:       var(--color-text-disabled);

  --button-icon-size:         var(--control-height-md);
  --button-icon-radius:       var(--radius-md);
```

Primary is a **fill**, not an outline. (Nocturne outlines its primary; TempAppName fills it. The two systems are not mixed — this app is TempAppName.) Focus: `box-shadow: var(--focus-ring-offset)` on filled variants, `var(--focus-ring)` on outlined ones.

### 4.2 TextInput / Textarea — `components/TextInput`

```css
  /* TextInput — components/TextInput */
  --input-height:          var(--control-height-xl);
  --input-radius:          var(--radius-md);
  --input-pad-x:           var(--space-4);
  --input-pad-y:           var(--space-3);      /* textarea only */
  --input-min-height:      92px;                /* textarea only — tall enough
                                                    for a few lines before the
                                                    field scrolls; not tied to
                                                    any existing role */
  --input-bg:              var(--color-bg-surface);
  --input-border:          var(--color-border-input);
  --input-border-focus:    var(--color-primary);
  --input-border-error:    var(--color-error);
  --input-fg:              var(--color-text-strong);
  --input-fg-placeholder:  var(--color-text-disabled);
  --input-bg-disabled:     var(--color-bg-disabled);
  --input-size:            var(--font-size-body);
  --input-label-size:      var(--font-size-micro);
  --input-label-fg:        var(--color-text-body);
  --input-help-size:       var(--font-size-micro);
  --input-help-fg:         var(--color-text-muted);
  --input-help-fg-error:   var(--color-error);
```

The label/control/help triplet is one component with a `label`, `help` and `error` prop, not three. Error state changes the border and the help color; it does not change the background.

### 4.3 Card — `components/Card`

```css
  /* Card — components/Card */
  --card-bg:             var(--color-bg-surface);
  --card-radius:         var(--radius-lg);
  --card-pad:            var(--space-5);
  --card-border:         var(--color-border);
  --card-border-active:  var(--color-primary);
  --card-shadow:         var(--shadow-sm);
  --card-shadow-active:  none;            /* the active card is marked by its
                                             border, not by lifting off the page */
  --card-title-size:     var(--font-size-label);  /* 16px — reuses the existing
                                                      role instead of repeating
                                                      its value as a literal */
  --card-title-fg:       var(--color-text-strong);
  --card-meta-size:      var(--font-size-meta);
  --card-meta-fg:        var(--color-text-muted);
  --card-kicker-size:    9.5px;   /* smaller than every existing --font-size-*
                                     role; the kicker sits above the title as
                                     a label on a label, and nothing else in
                                     the set needs this size */
  --card-kicker-fg:      var(--color-primary);
```

### 4.4 The rest — token names and key values

Build these when needed; same pattern.

| Component | Prefix | Defining values |
| --- | --- | --- |
| `Radio` | `--radio-*` | 22px, `--radius-full`, 11px inner dot at `--color-primary` |
| `Switch` | `--switch-*` | 44×26 track `--radius-full`, 20px knob on `--color-bg-surface` + `--shadow-sm` |
| `Chip` | `--chip-*` | 34px, `--radius-xs`, selected = `--color-primary-tint` fill + `--color-primary` text, border transparent |
| `ListRow` | `--list-row-*` | 44px min, `--radius-md`, selected = `--color-primary-tint`, 8px leading dot |
| `SplitGroup` | `--split-*` | 44px, outer `--radius-md`, 1px `--color-border-input` seams, selected = `--color-primary-tint` |
| `InlineMessage` | `--message-*` | `--color-bg-surface`, `--radius-md`, 7px status dot in `--color-success` / `--color-error` |
| `Sheet` / `Modal` | `--sheet-*` | `--radius-xl` top corners, `--shadow-lg`, `--motion-medium` entry |

---

## 5. Per-component checklist

Copy into the PR description.

```
- [ ] Layer-3 block added to tokens.css under a `/* <Component> — components/<Component> */` header
- [ ] Every entry defaults to a Layer-2 role; each literal has a comment saying why
- [ ] No new dark-mode override for a component token
- [ ] Module CSS references ONLY --<component>-* (grep: no --color-/--radius-/--space- left in the file)
- [ ] No literal hex, px radius, or px height left in the module CSS
- [ ] :focus-visible styled; browser default suppressed
- [ ] Anything tappable is ≥44px (or the group containing it is)
- [ ] Hover and active states present for interactive elements
- [ ] Transitions use --motion-fast/--motion-ease, not ad-hoc timings
- [ ] Verified in light and dark, at 360pt width
- [ ] Body text ≥4.5:1 on its own background in both modes
- [ ] Stories cover every visual state, including disabled and error
- [ ] Token table in the story docs regenerated (§6)
```

---

## 6. Storybook

Two additions, both small.

**A per-component token table.** Extend the `useTokenValue` hook already used by the color-story page to take a prefix and render the component's own tokens with live values:

```tsx
<ComponentTokens prefix="--select-" />
```

Reading from `document.styleSheets` means it lists whatever is actually in `tokens.css`, resolves each through the cascade, and follows the theme toolbar. Put it at the bottom of each component's docs page. This is what makes the layer-3 block self-documenting rather than a second thing to maintain.

**A parity guard.** `apps/web/src/styles/tokens.parity.test.ts` already checks the two dark blocks match. Add two assertions:

1. Every `--<prefix>-*` group in layer 3 has a matching `components/<Prefix>` directory — catches tokens left behind after a rename.
2. No `*.module.css` references a layer-2 token directly. A short regex over the component CSS files; failure message points at this document.

The second one is what keeps the model from eroding six components from now.

---

## 7. To paste into `CLAUDE.md`

Add under a new `## Design tokens` heading, after the Storybook section:

```md
## Design tokens

All visual values live in `apps/web/src/styles/tokens.css`, in three layers:

- **Layer 1 — palette** (`--tendril-*`): raw hexes. Hexes appear nowhere else in the codebase.
- **Layer 2 — semantic roles** (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--control-height-*`, `--focus-ring*`, `--motion-*`): what a value *means*. Mode-aware — the light block, the `[data-theme='dark']` block and the `prefers-color-scheme` block must stay in parity (enforced by `apps/web/src/styles/tokens.parity.test.ts`).
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
```

Saving this document under that name and recording the three-layer decision in `documentation/ARCHITECTURE.md` are tracked as TASKS-DONE.md § 22.5.

---

## 8. Tasks — moved to the task files (§ 22, now in TASKS-DONE.md)

The task list that used to live here (patch application, app-shell padding, nav-links-hidden, theme-control placement, docs recording, the Storybook token surface, Carousel tints, scheduling the new primitives, and the final `priori-patch/` cleanup) moved to **§ 22** of the task files (now archived in `TASKS-DONE.md`), subsections 22.1–22.9 in the same order as the old 8.1–8.9. This document keeps §§ 1–7 (the token model, the per-component diffs, the checklist, Storybook additions, the CLAUDE.md block) and § 9 (suggested order); § 22 is where the actual checkboxes were ticked.

---

## 9. Suggested order

1. §2 global tokens — **done** (was delivered via a patch folder, since applied and deleted) (radius renamed, scales added).
2. `NavBar` bottom bar — **done** (was delivered via a patch folder, since applied and deleted) (TASKS-DONE.md § 17).
3. TASKS-DONE.md § 22.1 apply the patch, then § 22.2 app-shell padding — the bar is not usable without it. Includes the radius-rename visual audit called out in §2.
4. `Checkbox` — smallest remaining example of the pattern; use it to settle the layer-3 conventions before repeating them.
5. TASKS-DONE.md § 22.8 add the new primitives to the task list (now `TASKS-TECH.md` § 24), then build `Button`, `TextInput`, `Card` — the three most screens need. `Button` first and reviewed before the rest.
6. The remaining seven primitives from § 22.8, in the order it sequences them: `Radio`, `Switch`, `Chip`, `ListRow`, `SplitGroup`, `InlineMessage`, `Sheet`/`Modal` — each expands its §4.4 table row into a full token block as part of its own task.
7. `FAB` — **done** (was delivered via a patch folder, since applied and deleted); `Breadcrumbs`, `Select` — contained restyles.
8. `ThemeToggle` — superseded: deleted (TASKS-TECH.md § 24.8); theme now follows time of day. A future theme control belongs to TASKS-FEATURES.md § 23.
9. `Carousel` — TASKS-DONE.md § 22.7; the dark slide tints now have real values, and the index now comes from TASKS-DONE.md §14's `slide_index` once it lands.
10. TASKS-DONE.md § 22.6 parity guard and token surface, once two or three components are on the model and the conventions have stopped moving.
11. TASKS-DONE.md § 22.9 delete `priori-patch/` — done; the patch folder was applied and deleted.
