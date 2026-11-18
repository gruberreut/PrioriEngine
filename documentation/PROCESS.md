# TempAppName — Process

How work gets done in this repo, and why. The rules themselves live in `CLAUDE.md` (and `AGENTS.md`, which it imports), which every agent session loads, so they're applied while work is being done. This file records the reasoning behind them: what was decided, why, and the alternatives rejected. Read an entry before changing or proposing a change to its rule. Record new process decisions here in the same commit as the rule change. If a decision is superseded, mark it as such rather than deleting it.

Architecture decisions go in `documentation/ARCHITECTURE.md`, not here.

---

## Approval and pacing

**Approval before execution.** The agent plans and discusses until the user explicitly approves execution. It makes no code changes or implementation steps before that, and asks for an explicit confirmation when approval is ambiguous. Each outward-facing step (commit, push, PR creation) needs its own approval. Rule: `AGENTS.md` § Execution Approval Policy, `CLAUDE.md` § Approval Policy and § Branch Workflow.
- **Why:** the user wants to know the implementation plan and discuss its details before anything is carried out.

**One component at a time, with approval.** Each UI component is built and approved before the next one starts. Rule: `AGENTS.md` § Component Implementation Policy.
- **Why:** components are parts of a larger composition, and some are reused across it. Building them step by step keeps the work manageable and lets each piece be settled before others depend on it.

Coding conventions for components (presentational vs page/container, props in and events out, naming) are code guidelines, not process. They live in `guidelines/COMPONENT_BEST_PRACTICES.md`.

**`AGENTS.md` is imported into `CLAUDE.md`.** `CLAUDE.md` loads `AGENTS.md` with `@AGENTS.md`.
- **Why:** Claude Code loads `CLAUDE.md` files automatically but not `AGENTS.md`. The approval policy was restated in `CLAUDE.md` and so applied, but the component implementation policy existed only in `AGENTS.md`, so a fresh session wouldn't see it. Importing keeps `AGENTS.md` the single source, which other AI tools also read, at the small cost of loading its 15 lines every session.
- **Rejected:**
  - Restating the policy in `CLAUDE.md`. Two copies to keep in sync.
  - Moving it into `apps/web/CLAUDE.md`. It would only load when working in the web app, and tools that read `AGENTS.md` would lose it.

---

## Task tracking

**Tasks live in Markdown files in the repo, not an issue tracker.** All task tracking is in the `tasks/` files below; there is no Jira board or GitHub Issues. `tasks/README.md` says so for anyone browsing the repo. Rule: `CLAUDE.md` § Task Tracking.
- **Why:** this is a solo project worked on largely with an AI coding agent. The agent reads and updates the files directly, with no API, credentials or sync, and follows a written read order to choose the next task. Task changes go through review in the same PR as the code they describe, and `§ N` section numbers give code comments, design docs and PRs a stable reference.
- **Rejected:**
  - Jira. The usual choice for team work, but for one contributor its workflow, permissions and board setup are overhead with nothing to coordinate, and the agent would need an integration to read or update it.
  - GitHub Issues. Lighter and next to the code, but task changes would happen outside the PR diff, and the agent would need `gh` calls to read work it can otherwise read as a file.

**Task files live in `tasks/`.** The four task files moved from the repo root into `tasks/`, keeping their names. Rule: `CLAUDE.md` § Task Tracking.
- **Why:** the repo is public as a portfolio piece, and on GitHub the root listing showed four task files above the README. In a folder they're out of the way, and the folder's own README explains them.
- **Rejected:** shorter names inside the folder (`tasks/bugs.md` etc.). They read better, but `TASKS-` keeps each file unique in editor quick-open and grep, and kept the move to a plain path-prefix change.

**Split task files: bugs, then technical work, then features.** Active work is tracked in `tasks/TASKS-BUGS.md` (§ 10 Known Bugs only), `tasks/TASKS-TECH.md` (the goal is not a change users can see: refactors, infrastructure, tooling, docs, quality) and `tasks/TASKS-FEATURES.md` (the goal is a behaviour users see), replacing the single `TASKS.md`. The agent reads them in that order and moves to the next file only when the current one has no open, unblocked items, or when the user asks. A large feature keeps its technical subtasks, unless a technical part blocks other work or is needed by more than one feature; then it becomes its own `tasks/TASKS-TECH.md` section, linked with "Depends on §N". Dependencies between the files are fine in any direction. Section numbers are shared across all four task files (including `tasks/TASKS-DONE.md`) and never renumbered; `CLAUDE.md` gives the command that finds the next free number. Rule: `CLAUDE.md` § Task Tracking.
- **Why:** `TASKS.md` had grown to about 1,330 lines (about 55k tokens), and the agent read it every time it chose work. Bugs and technical work come first, so they don't compound and don't block features; splitting by that precedence means the file read first is the one that usually decides the next task. Bugs got their own file because they're few and short (about 40 lines, against about 560 for technical work), so `tasks/TASKS-TECH.md` isn't read at all while bugs are open. Shared numbers keep every existing `§N` reference valid without saying which file holds the section.
- **Rejected:**
  - Per-package task files (engine, API, web). Most sections span packages (e.g. § 55 touches the DB, API, engine and web), so a section would have to be split or duplicated, and the bugs-first precedence isn't per package.
  - Per-feature task files. Most features are a single short section, so a file each adds overhead without saving much reading. Revisit when the first feature with an HLD starts (§ 52, § 53), since those carry an LLD and long checklists.
  - Bugs as a section at the top of `tasks/TASKS-TECH.md`. It reads first anyway, but it means reading the whole technical file (about 23k tokens) to find two bugs.
  - One archive per active file. `tasks/TASKS-DONE.md` stays the single archive; each newly archived section records its type instead (below).

**Archive finished sections to `tasks/TASKS-DONE.md`, with their type.** A top-level section moves to `tasks/TASKS-DONE.md`, in numeric order, only when every item in it is checked. A `Type: tech` or `Type: feature` line goes directly under its heading. No stub is left behind. Rule: `CLAUDE.md` § Task Tracking.
- **Why:** moving finished work out keeps the active files a manageable size. Partially done sections stay in full so open items are never hidden in the archive. The type line keeps one archive while still recording which kind of work each section was, which the split files would otherwise lose once a section leaves them.

**Superseded — archive finished sections to `tasks/TASKS-DONE.md`, leaving a stub.** A top-level `TASKS.md` section moved to `tasks/TASKS-DONE.md` only when every item in it was checked. A one-line stub stayed in its place.
- **Why (at the time):** `TASKS.md` kept growing, so moving finished work out kept it a manageable size. The stub kept section numbers and `§N` references working without opening the archive.
- **Superseded by** the split task files (above). With active work spread over three files, a stub would sit in whichever file the section happened to leave, so finding a number means searching all the files anyway. The archive itself answers "where did § N go", and the shared-number command finds the next free number. Stubs also cost reading tokens in exactly the files read most often: 17 of them were removed in the split.

**The Known Bugs file always exists, and is read first.** `tasks/TASKS-BUGS.md` and its `## 10. Known Bugs` header stay even with no open bugs. Individual fixed bugs still move to `tasks/TASKS-DONE.md` § 10. Rule: `CLAUDE.md` § Task Tracking. Before the split, this was a section of `TASKS.md` that was never archived, with the bugs-first priority stated at the top of that file.
- **Why:** bugs are fixed early so they don't compound, which makes them high priority. The file is the standing place new bugs are filed, so it has to exist and be findable even when empty.

---

## Branch and PR workflow

**PR per change.** Every change reaches `main` through a GitHub PR from a short-lived branch, even with a single contributor. The user reviews and merges on GitHub, and the agent never merges. Rule: `CLAUDE.md` § Branch Workflow. Moved from `documentation/ARCHITECTURE.md` § Development Workflow.
- **Why:** the PR, filled in from `.github/pull_request_template.md` (why, what changed, how it was verified, how AI was used), is the reviewable record linking plan → implementation → review.
- **Rejected:** fast-forward merges pushed straight to `main`. That's less ceremony for a solo project, but it leaves no review record. Before this change, local commits accumulated on `main` and were pushed in batches, so one push could publish several older commits along with the intended change.

**`/finish-pr` finalizes a PR.** The `/finish-pr` skill (`.claude/skills/finish-pr/SKILL.md`) checks an open PR for merge readiness, or runs the post-merge cleanup. It points to `CLAUDE.md` § Branch Workflow instead of copying its steps.
- **Why:** finishing a PR was a manual, repeated sequence. Pointing to the steps rather than copying them keeps one source of truth.

---

## Hooks

**Task files: a reminder at commit, a block at push.** A `git commit` PreToolUse hook only reminds the agent to check the task files. A `git push` PreToolUse hook (`.claude/hooks/check-tasks.sh`) blocks with exit 2 when none of the outgoing commits (`origin/main..HEAD`) touch `tasks/TASKS-BUGS.md`, `tasks/TASKS-TECH.md` or `tasks/TASKS-FEATURES.md` and no commit message opts out with a `Tasks: none — <reason>` line. A change to `tasks/TASKS-DONE.md` alone doesn't count, since archiving always also removes the section from an active file. Rule: `CLAUDE.md` § Task Tracking. Moved from `documentation/ARCHITECTURE.md` § Development Workflow; before the split task files, both hooks checked `TASKS.md`.
- **Why:** push is the right granularity. A branch is the unit of work, and it needs a task-file update once, not in every commit.
- **Rejected:** blocking at commit. Intermediate commits (WIP, refactors, fixups) legitimately don't touch the task files, so a commit-level block would mostly produce false positives and train opt-out habits.

**Web lint: a block at commit.** A `git commit` PreToolUse hook (`.claude/hooks/check-web-lint.sh`) runs `npm run lint -w @priori/web` whenever `apps/web` has changes (staged or not, so `git commit -a` is covered) and blocks with exit 2 if it fails. The lint script runs eslint with `--max-warnings 0`, so warnings block too. It lints the working tree, not the staged snapshot; accepted, since the whole tree must pass before the work is complete anyway. Rule: `apps/web/CLAUDE.md` § Lint must pass. Added with `tasks/TASKS-DONE.md` § 10.7, after lint had silently drifted to 22 errors on `main`.
- **Why:** a written rule alone had already failed once, so enforcement mustn't depend on remembering. There's no CI planned to do it instead. Unlike the task-file check, every commit should pass lint, including intermediate ones, so a commit-level block doesn't produce false positives. Catching a failure before the commit also avoids follow-up fixup commits. Lint takes a few seconds, and commits that don't touch `apps/web` skip it.
- **Rejected:** blocking at push. It would let lint failures into the branch history and push the fix into extra commits. Also rejected: waiting for CI (§ 38), because no CI is planned. Also rejected: allowing warnings. Warnings that are allowed pile up, and this cleanup brought them to zero anyway.

---

## Documentation

**Architecture and process decisions are recorded separately.** Architecture decisions go in `documentation/ARCHITECTURE.md`, process decisions in this file, each in the same commit as the decision. Rule: `CLAUDE.md` § Architecture Documentation and § Process Decisions.
- **Why:** `ARCHITECTURE.md` describes the system. Process rules (how work is tracked, reviewed and merged) don't belong in it.
- **Rejected:**
  - Keeping process decisions in `ARCHITECTURE.md`. It mixes two audiences and topics.
  - Moving the rules themselves out of `CLAUDE.md` into this file. `CLAUDE.md` is loaded into every agent session and other files aren't, so the rules stay there. This file holds only the reasoning, which is needed when a rule is being changed.
  - Importing this file into `CLAUDE.md` (`@documentation/PROCESS.md`). That would load the reasoning into every session, when it's only needed for process changes.

**Design docs get a linked task.** A new design doc under `documentation/techDesign/<topic>/` gets a section in `tasks/TASKS-TECH.md` or `tasks/TASKS-FEATURES.md` in the same change. The section links to the doc, and the doc names its section (file and number) near the top. Rule: `CLAUDE.md` § Task Tracking.
- **Why:** a design that no task points to is easily forgotten, and a task without its design loses the decisions behind it. Linking both ways means each can be found from the other. When the rule was applied to the existing designs, it showed that the user-provisioning plan had been archived as done but never implemented (§ 54).

**HLD, then LLD, then implementation.** Design docs are either `hld.md` (high-level design: decisions, flow, and which components, endpoints and tables are reused, extended or added) or `lld.md` (low-level design: API signatures, data objects, DB table structures, UI components). When a task attached to an HLD is started, its first step is writing the LLD and getting it approved; implementation waits for that approval. Rule: `CLAUDE.md` § Task Tracking.
- **Why:** an HLD settles direction but leaves the details open. Writing and approving the LLD first means the user sees and discusses those details before anything is built, which is the same reason as approval before execution (§ Approval and pacing). Separate file names also say what level of detail a doc has, which a generic `design.md` didn't.
- **Rejected:** going straight from an HLD to implementation. The details would be decided while coding, without review.
