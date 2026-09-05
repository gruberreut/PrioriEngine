# Patch — radius rename, bottom NavBar, slide tints

Drop-in replacements for `priori/`. Paths mirror the repo, so each file goes
to the same path with `priori-patch/` stripped.

| File | Change |
| --- | --- |
| `apps/web/src/styles/tokens.css` | Radius scale renamed to the Tendril scale; control-height, focus, motion, z-index, spacing 5–7 and three font sizes added; the eight dark slide tints given real values; Layer 3 opened with `BottomNav` and `FAB` groups |
| `apps/web/src/components/NavBar/NavBar.tsx` | Rewritten as a fixed bottom bar with icon links |
| `apps/web/src/components/NavBar/NavBar.module.css` | New — bottom bar, safe-area inset, 44px targets |
| `apps/web/src/components/NavBar/NavBar.stories.tsx` | Four stories, mobile viewport, fixed-position frame |
| `apps/web/src/components/FAB/FAB.module.css` | Fully tokenised; repositioned above the new bar; squircle radius; focus ring |
| `apps/web/src/assets/icons/Tendril.tsx` | New — the branch-and-coil mark as a 24px line icon |
| `apps/web/src/assets/icons/ListChecks.tsx` | New — line icon for Tasks |

## Not included — needs a decision or a call site I cannot see

1. **Page bottom padding.** Every scrollable route needs
   `padding-bottom: calc(var(--bottom-nav-total-height) + var(--space-4))`
   or the bar covers the last item. Best applied once on the app shell rather
   than per page.
2. **Carousel dots.** They are in normal flow, so they collide only if the
   page has no bottom padding — fixed by (1). No change to
   `Carousel.module.css` needed for the bar.
3. **`linksHidden` on `/in-progress`.** TASKS.md § 17 wants the top bar hidden
   there. The prop exists; wiring it is a route-level change.
4. **The theme toggle's place.** Kept in the bar's right slot so nothing else
   breaks, but a three-option segmented control inside a bottom nav is
   crowded. It probably belongs on a settings screen once one exists.

## Verify after applying

- `--radius-sm` moves 6px → 12px and `--radius-md` 8px → 16px. `--radius-md`
  had no call sites; `--radius-sm` had three (Select, NavBar, ThemeToggle), and
  all three want the larger value. No component CSS edit is required for the
  rename — check them visually rather than mechanically.
- Bottom bar in Storybook at 320 / 360 / 414 widths, both modes.
- FAB does not overlap the bar or the home indicator on a device with an inset.
