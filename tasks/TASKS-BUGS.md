# Bugs

Known bugs. When choosing what to work on, read this file first: open bugs come before everything in `TASKS-TECH.md` and `TASKS-FEATURES.md` (see `CLAUDE.md` § Task Tracking). This file always exists, even with no open bugs, because it's where new bugs are filed. Fixed bugs move to `TASKS-DONE.md` § 10.

---

## 10. Known Bugs (`known-bugs`)

Per-user decision: this section (and this file) stays even when its list is empty, rather than being archived away like other fully-completed sections — it's the standing place new bugs get filed. An individual bug still moves to `TASKS-DONE.md` once fixed; only the section title itself is exempt from archiving. See the note at the top of this file: known bugs come first.

Resolved bugs are in `TASKS-DONE.md` § 10 (most recently § 10.7, the failing web lint).

### 10.8 Stored subtasks don't inherit context or due date when ranked

Found while designing AI task input (`documentation/techDesign/ai-task-input/hld.md`), by reading the code (not yet reproduced in a test). Filed as a bug at the user's request rather than waiting for § 53.

The engine's `inheritedValue` (`normalizer.ts`) walks up to the parent only when a field is `undefined`; any other value, including `null` and `[]`, counts as set. `routes/rank.ts` builds the engine input from DB rows with `dueDate: t.dueDate?.toISOString() ?? null` and `contexts: t.contextId ? [...] : []`, so a subtask with no due date or context of its own never inherits its parent's.

User-visible effect: a subtask under a project that has a context (e.g. *Garden*) but no context itself is excluded when ranking for that context (`context_mismatch`), and a subtask under a project with a due date is ranked as if it had none.

- [ ] Write a failing real-DB test in `test/routes/rank.test.ts`: a parent with a context and due date, a child with neither; ranking for that context includes the child, and the child's normalized due date is the parent's
- [ ] Fix the mapping in `routes/rank.ts`: a DB `null` becomes an omitted field (`undefined`), and no context becomes no `contexts` key, so the engine inherits
- [ ] Check the other fields in that mapping for the same problem (`lastSuggestedAt` should stay `null`, since it's per task and not inherited)
- [ ] Check the web side: `resolveTask.ts` already inherits `contexts`, so confirm the tasks list and ranking now agree

### 10.9 Ranking returns tasks longer than the available time

Moved from the Open Issues list in `TASKS-FEATURES.md` at the user's request. Found by reading the code, not yet reproduced in a test.

When ranking with an available time (e.g. 10 minutes), tasks whose duration exceeds it are still returned. `ranker.ts` only scores the fit (`durationBase` is `2` within budget, `-2` over it); nothing excludes an over-budget task, so it can still rank in the top results when its other scores are high.

- [ ] Write a failing test in `packages/engine/test/ranker.test.ts`: a task longer than `availableTime` with otherwise high scores isn't returned
- [ ] Decide whether over-budget tasks are excluded outright (a new exclusion reason, shown by `--explain` like the existing ones) or kept but always ranked below every task that fits, and fix accordingly
- [ ] Record the decision in `documentation/ARCHITECTURE.md` (Engine Pipeline)
