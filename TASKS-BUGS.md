# Bugs

---

## 10. Known Bugs (`known-bugs`)

Per-user decision: this section header stays in `TASKS.md` even when its list is empty, rather than being archived away like other fully-completed sections — it's the standing place new bugs get filed. An individual bug still moves to `TASKS-DONE.md` once fixed; only the section title itself is exempt from archiving. See the priority note at the top of this file: known bugs come first.

Resolved bugs are in `TASKS-DONE.md` § 10 (most recently § 10.6, the duplicate-context-option bug).

### 10.7 Web lint fails on `main` — fix, then make lint a mandatory check

Found while refreshing the agent docs (`docs/claude-md-split`). Filed as a bug at the user's request so it gets bug priority. `npm run lint -w @priori/web` (eslint + stylelint) currently fails on `main`: 22 ESLint errors and 5 warnings. Stylelint is clean. Breakdown at the time of filing:
- 18 errors, `storybook/no-renderer-packages`: older `*.stories.tsx` files import `@storybook/react` directly; newer ones already use `@storybook/react-vite`
- 2 errors, `react-hooks/set-state-in-effect`: `RankingPage.tsx`, `TaskCreationForm.tsx`
- 2 errors, `react-refresh/only-export-components`: `LocationIcon.tsx`, `TaskCreationForm.tsx`
- 2 warnings, `react-hooks/exhaustive-deps`: `Carousel.tsx`, `ParamsForm.tsx`
- 3 warnings from the generated `coverage/` report, which ESLint isn't ignoring

- [ ] Switch the 18 story files to `@storybook/react-vite`
- [ ] Fix the two `set-state-in-effect` errors. These are behavioural changes, so check each in Storybook/the app rather than just silencing the rule
- [ ] Fix the two `only-export-components` errors (move the non-component exports out of the component files)
- [ ] Resolve the two `exhaustive-deps` warnings
- [ ] Add `coverage` to `globalIgnores` in `apps/web/eslint.config.js`
- [ ] Confirm `npm run lint -w @priori/web` exits 0. Decide whether warnings must also be zero (e.g. `eslint --max-warnings 0`)
- [ ] Once it passes, make it mandatory: add a rule to `apps/web/CLAUDE.md` that lint must pass after any change in `apps/web` before the work is considered complete. Decide whether to also enforce it mechanically (a hook like `.claude/hooks/check-tasks.sh`, or CI once § 38 adds one) so it doesn't depend on remembering

### 10.8 Stored subtasks don't inherit context or due date when ranked

Found while designing AI task input (`documentation/techDesign/ai-task-input/hld.md`), by reading the code (not yet reproduced in a test). Filed as a bug at the user's request rather than waiting for § 53.

The engine's `inheritedValue` (`normalizer.ts`) walks up to the parent only when a field is `undefined`; any other value, including `null` and `[]`, counts as set. `routes/rank.ts` builds the engine input from DB rows with `dueDate: t.dueDate?.toISOString() ?? null` and `contexts: t.contextId ? [...] : []`, so a subtask with no due date or context of its own never inherits its parent's.

User-visible effect: a subtask under a project that has a context (e.g. *Garden*) but no context itself is excluded when ranking for that context (`context_mismatch`), and a subtask under a project with a due date is ranked as if it had none.

- [ ] Write a failing real-DB test in `test/routes/rank.test.ts`: a parent with a context and due date, a child with neither; ranking for that context includes the child, and the child's normalized due date is the parent's
- [ ] Fix the mapping in `routes/rank.ts`: a DB `null` becomes an omitted field (`undefined`), and no context becomes no `contexts` key, so the engine inherits
- [ ] Check the other fields in that mapping for the same problem (`lastSuggestedAt` should stay `null`, since it's per task and not inherited)
- [ ] Check the web side: `resolveTask.ts` already inherits `contexts`, so confirm the tasks list and ranking now agree
