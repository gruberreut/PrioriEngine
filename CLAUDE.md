# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Naming

The app's name is **unsettled** — "Tendril" turned out to already be in use by another app/company and is being replaced. Until a new name is chosen, use **TempAppName** as a placeholder everywhere the app's name would otherwise appear — UI copy, docs, commit messages, general discussion. Don't reintroduce "Tendril" as the product name in new work. See `tasks/TASKS-FEATURES.md` § 41 for the task tracking the eventual real-name rollout (including internal identifiers like the `--tendril-*` token prefix, deliberately left alone for now — see that task for why).

The backend ranking engine (`packages/engine`) is called **Priori Engine** — this name is unaffected and correct to use when specifically discussing the Priori Engine's ranking system itself.

## Approval Policy

The execution approval policy and the component implementation policy live in `AGENTS.md` (shared with other AI tools) and are imported here so every session loads them:

@AGENTS.md

Why: see `documentation/PROCESS.md` § Approval and pacing.

## Task Tracking

Active and upcoming work is tracked in three files at the repo root, and completed work is archived in a fourth:

- `tasks/TASKS-BUGS.md` — known bugs, all in `## 10. Known Bugs`, one `### 10.N` subsection per bug.
- `tasks/TASKS-TECH.md` — technical tasks: the goal is not a change users can see (refactors, infrastructure, tooling, docs, quality).
- `tasks/TASKS-FEATURES.md` — features: the goal is a behaviour users see. A large feature keeps its technical subtasks, unless a technical part blocks other work or is needed by more than one feature; then it becomes its own `tasks/TASKS-TECH.md` section, linked from the feature with "Depends on §N".
- `tasks/TASKS-DONE.md` — the single archive of completed sections from all three.

Dependencies between the files are fine in any direction (a feature blocked by a bug, a technical task blocked by a feature).

**Read order.** When choosing what to work on, read `tasks/TASKS-BUGS.md` first. Read `tasks/TASKS-TECH.md` only when `tasks/TASKS-BUGS.md` has no open, unblocked items, and `tasks/TASKS-FEATURES.md` only when `tasks/TASKS-TECH.md` has none either, or when the user asks. When an item is blocked by a section in a file you haven't read ("Depends on §N", "Blocked by §N"), read just that section. Before starting a feature section, check `tasks/TASKS-BUGS.md` and `tasks/TASKS-TECH.md` for open items in the same area and do those first, or ask the user.

**Section numbers** are shared across all four files and never renumbered or reused. A new top-level section takes the highest number across the four files + 1:

```bash
awk -F'[ .]' '/^## [0-9]+\./ && $2+0>m {m=$2+0} END {print m+1}' tasks/TASKS-BUGS.md tasks/TASKS-TECH.md tasks/TASKS-FEATURES.md tasks/TASKS-DONE.md
```

A new bug is a `### 10.N` subsection, numbered after the highest `10.N` in `tasks/TASKS-BUGS.md` and `tasks/TASKS-DONE.md`.

**Archiving.** When every item in a top-level numbered section (`## N. ...`) is checked off with no open sub-items left anywhere in it, move that section's full content into `tasks/TASKS-DONE.md`, in numeric order, with a `Type: tech` or `Type: feature` line directly under its heading. Leave no stub behind: a number missing from the active files is in `tasks/TASKS-DONE.md`. Do not archive a section that has any unchecked item anywhere in it, even if most of it is done — a partially-complete section stays in full, including its already-completed subsections.

**Every PR leaves the repo consistent, or the gap tracked.** In the same PR as the change, update the task files so they describe the repository as it will be once the PR merges: tick finished items, reword items the change made out of date, and add new work it uncovered. A PR may leave an inconsistency (a doc describing something not yet built, two docs that disagree, code that doesn't follow a rule yet) only when an item in `tasks/TASKS-*.md` records closing it; add that item in the same PR if none exists.

**Exception: Known Bugs.** `tasks/TASKS-BUGS.md` and its `## 10. Known Bugs` header always exist, even with no open bugs — it's the standing place new bugs get filed. Each fixed bug moves on its own to `tasks/TASKS-DONE.md` § 10.

**Design docs: HLD, then LLD, then implementation.** Design docs live in `documentation/techDesign/<topic>/`, as `hld.md` (high-level design: decisions, flow, and which components, endpoints and tables are reused, extended or added) and `lld.md` (low-level design: implementation details such as API signatures, data objects, DB table structures and UI components). A new design doc gets a section in `tasks/TASKS-TECH.md` or `tasks/TASKS-FEATURES.md` in the same change; the section links to the doc, and the doc names its section (file and number) near the top, so each can be found from the other. When a task attached to an HLD is started, the first step is to write its LLD and get it approved. Implementation starts only after that approval.

**Pushing without a task-file change.** A `git push` hook (`.claude/hooks/check-tasks.sh`) blocks pushes whose outgoing commits don't touch `tasks/TASKS-BUGS.md`, `tasks/TASKS-TECH.md` or `tasks/TASKS-FEATURES.md`. When a change genuinely has nothing to track, add a line `Tasks: none — <reason>` to one of the commit messages.

Why: see `documentation/PROCESS.md` § Task tracking, § Hooks and § Documentation.

## Branch Workflow

Work happens on a short-lived branch off `main` (the default branch; there is no `master`), named `<type>/<short-description>`, e.g. `chore/repo-cleanup`, `feat/params-bar`, `fix/duplicate-context-option`.

Every change lands on `main` through a GitHub PR, even as a solo contributor — the PR is the reviewable record of plan → implementation → review. Never push directly to `main`.

**Starting**
- Branch from an up-to-date `main`: `git fetch origin`, then confirm local `main` matches `origin/main` before `git checkout -b`.

**Finishing** (only with explicit user approval at each outward-facing step: commit, push, PR creation)
1. Update the task files (`tasks/TASKS-BUGS.md`, `tasks/TASKS-TECH.md`, `tasks/TASKS-FEATURES.md`, and `tasks/TASKS-DONE.md` when archiving) for the completed work as a commit on the branch (see § Task Tracking).
2. `git fetch origin`, then check divergence in **both** directions before pushing: `git log HEAD..origin/main` (remote commits the branch lacks) and `git log origin/main..HEAD` (exactly the commits the PR will carry — flag anything unexpected).
3. Push the branch: `git push -u origin <branch>`.
4. Open the PR with `gh pr create`, filling every section of `.github/pull_request_template.md`. In "How AI was used", describe prompts by what was asked and what the user reviewed or decided, not as verbatim quotes, and list the user's corrections separately from slips the agent caught itself.
5. The user reviews and merges on GitHub. The agent never merges.
6. Afterwards: `git checkout main`, `git pull --ff-only`, then delete the branch locally and on the remote. End on a clean `main` in sync with `origin/main`.

To finalize a PR, use /finish-pr.

Why: see `documentation/PROCESS.md` § Branch and PR workflow.

## Architecture Documentation

Architectural decisions must be recorded in `documentation/ARCHITECTURE.md`. Update this file in the same commit as the decision — not after the fact. Each entry should capture: what was decided, why (the forces that drove it), and what alternatives were rejected. If a prior decision is superseded, mark it as such rather than deleting it. Process decisions don't go here; see § Process Decisions.

Why: see `documentation/PROCESS.md` § Documentation.

## Process Decisions

Before changing or proposing a change to a process rule (approval, task tracking, branch workflow, hooks, documentation rules), read its entry in `documentation/PROCESS.md`. Record the new decision there in the same commit as the rule change: what was decided, why, and the alternatives rejected. The rule itself stays in this file (or `AGENTS.md`), since this file is loaded into every session and `PROCESS.md` isn't.

## Technology and Architecture Choices

Prefer the minimal solution that satisfies current requirements and can be incrementally enhanced to support the planned features in this project. Avoid introducing abstractions, dependencies, or infrastructure that aren't needed yet.

When evaluating a technology or architecture decision:
- Choose the option with the smallest footprint that doesn't foreclose future needs
- Avoid choices that create tech debt (e.g. patterns that will need to be undone, not just extended, as the project grows)
- If there is genuine uncertainty about whether a simpler choice will hold up against future requirements, raise it explicitly before proceeding — describe the trade-off, identify the specific future features that create the tension, and ask the developer to weigh in before committing to an approach

## Commands

All commands are run from the repository root unless noted. The root `build`, `typecheck`, `test` and `test:coverage` scripts cover `packages/engine` only; web and API have their own workspace scripts, listed after the engine block.

```bash
npm ci                             # install all workspace dependencies (use this, not npm install)
npm install <pkg> [-w <workspace>] # add a new package — updates both package.json and package-lock.json; use npm ci for everything else

npm run build                      # compile packages/engine → dist/ (engine only)
npm run typecheck                  # type-check packages/engine without emitting (engine only)

npm test                           # run all engine tests (vitest run) — engine only, not web or API
npm run test:coverage              # run engine tests with v8 coverage report

# Run a single test file
npx vitest run packages/engine/test/ranker.test.ts

# Run the ranking CLI (defaults to test/data/tasks.example.json)
npm run rank -- --context garden --available-time 20 --energy medium --explain

# CLI flags
--tasks <path>                     # JSON task file (default: test/data/tasks.example.json)
--context <name>                   # filter by context label
--location home|in-person|anywhere # filter by location (tasks marked anywhere always pass)
--available-time <minutes>         # available time in minutes (default: 30)
--energy low|medium|high           # current energy level (default: medium)
--limit <n>                        # number of results (default: 3)
--explain                          # print per-task score breakdown + exclusions
--now <iso-date>                   # pin current time (for reproducible runs)
--last-completed-project <id>      # enable project flow bonus
```


```bash
npm run dev                        # start API and web dev servers together (or dev:api / dev:web)

# Web (apps/web)
npm test -w @priori/web            # vitest run
npm run test:coverage -w @priori/web
npm run lint -w @priori/web        # eslint (zero warnings) + stylelint (src/**/*.module.css); must pass, see apps/web/CLAUDE.md
npm run lint:css -w @priori/web    # stylelint only
npm run build -w @priori/web       # tsc -b (type-check) + vite build — web has no separate typecheck script

# API (apps/api)
npm test -w @priori/api            # vitest run — real-DB tests need PostgreSQL at TEST_DATABASE_URL
                                   # (default postgresql://localhost/priori_test); migrations run automatically
npm run db:migrate -w @priori/api  # apply migrations to DATABASE_URL (default postgresql://localhost/priori_dev)
npm run db:seed -w @priori/api     # seed the dev database
npm run typecheck -w @priori/api   # tsc --noEmit over src/ and test/ (the API is never compiled)
```

`apps/api` has no lint script.

## Architecture

### Monorepo layout

```
packages/engine/   — Priori Engine: ranking library + CLI, with its tests
apps/api/          — HTTP API server (Node http + Drizzle/PostgreSQL); calls the engine
apps/web/          — web UI (React + Vite, Storybook)
documentation/     — design and product docs
```

### Area-specific guidance

Claude Code loads these automatically when working in the folder:

- `apps/web/CLAUDE.md` — frontend layout, Storybook rules, design tokens
- `apps/api/CLAUDE.md` — API server structure, DB access pattern, API testing strategy, API documentation
- `packages/engine/CLAUDE.md` — engine pipeline, key types, engine testing
