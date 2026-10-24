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

**Archive finished sections to `TASKS-DONE.md`, leaving a stub.** A top-level `TASKS.md` section moves to `TASKS-DONE.md` only when every item in it is checked. A one-line stub stays in its place. Rule: `CLAUDE.md` § Task Tracking.
- **Why:** `TASKS.md` keeps growing, so moving finished work out keeps it a manageable size. The stub keeps section numbers and `§N` references working without opening the archive. Partially done sections stay in full so open items are never hidden in the archive.

**The Known Bugs section is never archived, and comes first.** `## 10. Known Bugs` stays in `TASKS.md` even with no open bugs. Individual fixed bugs still move to `TASKS-DONE.md`. Rule: `CLAUDE.md` § Task Tracking, and the priority order at the top of `TASKS.md`.
- **Why:** bugs are fixed early so they don't compound, which makes them high priority. The section is the standing place new bugs are filed, so it has to exist and be findable even when empty.

---

## Branch and PR workflow

**PR per change.** Every change reaches `main` through a GitHub PR from a short-lived branch, even with a single contributor. The user reviews and merges on GitHub, and the agent never merges. Rule: `CLAUDE.md` § Branch Workflow. Moved from `documentation/ARCHITECTURE.md` § Development Workflow.
- **Why:** the PR, filled in from `.github/pull_request_template.md` (why, what changed, how it was verified, how AI was used), is the reviewable record linking plan → implementation → review.
- **Rejected:** fast-forward merges pushed straight to `main`. That's less ceremony for a solo project, but it leaves no review record. Before this change, local commits accumulated on `main` and were pushed in batches, so one push could publish several older commits along with the intended change.

**`/finish-pr` finalizes a PR.** The `/finish-pr` skill (`.claude/skills/finish-pr/SKILL.md`) checks an open PR for merge readiness, or runs the post-merge cleanup. It points to `CLAUDE.md` § Branch Workflow instead of copying its steps.
- **Why:** finishing a PR was a manual, repeated sequence. Pointing to the steps rather than copying them keeps one source of truth.

---

## Hooks

**`TASKS.md`: a reminder at commit, a block at push.** A `git commit` PreToolUse hook only reminds the agent to check `TASKS.md`. A `git push` PreToolUse hook (`.claude/hooks/check-tasks.sh`) blocks with exit 2 when none of the outgoing commits (`origin/main..HEAD`) touch `TASKS.md` and no commit message opts out with a `Tasks: none — <reason>` line. Rule: `CLAUDE.md` § Task Tracking. Moved from `documentation/ARCHITECTURE.md` § Development Workflow.
- **Why:** push is the right granularity. A branch is the unit of work, and it needs a `TASKS.md` update once, not in every commit.
- **Rejected:** blocking at commit. Intermediate commits (WIP, refactors, fixups) legitimately don't touch `TASKS.md`, so a commit-level block would mostly produce false positives and train opt-out habits.

---

## Documentation

**Architecture and process decisions are recorded separately.** Architecture decisions go in `documentation/ARCHITECTURE.md`, process decisions in this file, each in the same commit as the decision. Rule: `CLAUDE.md` § Architecture Documentation and § Process Decisions.
- **Why:** `ARCHITECTURE.md` describes the system. Process rules (how work is tracked, reviewed and merged) don't belong in it.
- **Rejected:**
  - Keeping process decisions in `ARCHITECTURE.md`. It mixes two audiences and topics.
  - Moving the rules themselves out of `CLAUDE.md` into this file. `CLAUDE.md` is loaded into every agent session and other files aren't, so the rules stay there. This file holds only the reasoning, which is needed when a rule is being changed.
  - Importing this file into `CLAUDE.md` (`@documentation/PROCESS.md`). That would load the reasoning into every session, when it's only needed for process changes.

**Design docs get a linked task.** A new design doc under `documentation/techDesign/<topic>/` gets a `TASKS.md` section in the same change. The section links to the doc, and the doc names its section near the top. Rule: `CLAUDE.md` § Task Tracking.
- **Why:** a design that no task points to is easily forgotten, and a task without its design loses the decisions behind it. Linking both ways means each can be found from the other. When the rule was applied to the existing designs, it showed that the user-provisioning plan had been archived as done but never implemented (§ 54).

**HLD, then LLD, then implementation.** Design docs are either `hld.md` (high-level design: decisions, flow, and which components, endpoints and tables are reused, extended or added) or `lld.md` (low-level design: API signatures, data objects, DB table structures, UI components). When a task attached to an HLD is started, its first step is writing the LLD and getting it approved; implementation waits for that approval. Rule: `CLAUDE.md` § Task Tracking.
- **Why:** an HLD settles direction but leaves the details open. Writing and approving the LLD first means the user sees and discusses those details before anything is built, which is the same reason as approval before execution (§ Approval and pacing). Separate file names also say what level of detail a doc has, which a generic `design.md` didn't.
- **Rejected:** going straight from an HLD to implementation. The details would be decided while coding, without review.
