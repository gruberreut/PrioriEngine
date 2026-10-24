# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Naming

The app's name is **unsettled** — "Tendril" turned out to already be in use by another app/company and is being replaced. Until a new name is chosen, use **TempAppName** as a placeholder everywhere the app's name would otherwise appear — UI copy, docs, commit messages, general discussion. Don't reintroduce "Tendril" as the product name in new work. See `TASKS.md` § 41 for the task tracking the eventual real-name rollout (including internal identifiers like the `--tendril-*` token prefix, deliberately left alone for now — see that task for why).

The backend ranking engine (`packages/engine`) is called **Priori Engine** — this name is unaffected and correct to use when specifically discussing the Priori Engine's ranking system itself.

## Approval Policy

Per `AGENTS.md`: do not execute implementation steps or make code changes unless the user explicitly approves. Default to planning/discussion only until approval is given.

## Task Tracking

`TASKS.md` tracks active and upcoming work. When every item in a top-level numbered section (`## N. ...`) is checked off with no open sub-items left anywhere in it, move that section's full content out of `TASKS.md` into `TASKS-DONE.md` (same repo root), appended in numeric order. Leave a single-line stub in `TASKS.md` in its place — `## N. Title — completed, see TASKS-DONE.md` — so section numbers and existing `§N` cross-references still resolve without opening the archive. Do not archive a section that has any unchecked item anywhere in it, even if most of it is done — a partially-complete section stays in `TASKS.md` in full, including its already-completed subsections.

**Exception: the Known Bugs section (`## 10. Known Bugs`).** Its header stays in `TASKS.md` even when its list is fully resolved — do not collapse it to a stub. It's the standing place new bugs get filed, so it needs to exist and be findable even at zero open items. Individual fixed bugs still move to `TASKS-DONE.md` as normal; only the section title itself is exempt from archiving.

**Pushing without a TASKS.md change.** A `git push` hook (`.claude/hooks/check-tasks.sh`) blocks pushes whose outgoing commits don't touch `TASKS.md`. When a change genuinely has nothing to track, add a line `Tasks: none — <reason>` to one of the commit messages.

## Branch Workflow

Work happens on a short-lived branch off `main` (the default branch; there is no `master`), named `<type>/<short-description>`, e.g. `chore/repo-cleanup`, `feat/params-bar`, `fix/duplicate-context-option`.

Every change lands on `main` through a GitHub PR, even as a solo contributor — the PR is the reviewable record of plan → implementation → review. Never push directly to `main`.

**Starting**
- Branch from an up-to-date `main`: `git fetch origin`, then confirm local `main` matches `origin/main` before `git checkout -b`.

**Finishing** (only with explicit user approval at each outward-facing step: commit, push, PR creation)
1. Update `TASKS.md` for the completed work as a commit on the branch (see § Task Tracking).
2. `git fetch origin`, then check divergence in **both** directions before pushing: `git log HEAD..origin/main` (remote commits the branch lacks) and `git log origin/main..HEAD` (exactly the commits the PR will carry — flag anything unexpected).
3. Push the branch: `git push -u origin <branch>`.
4. Open the PR with `gh pr create`, filling every section of `.github/pull_request_template.md`.
5. The user reviews and merges on GitHub. The agent never merges.
6. Afterwards: `git checkout main`, `git pull --ff-only`, then delete the branch locally and on the remote. End on a clean `main` in sync with `origin/main`.

To finalize a PR, use /finish-pr.

## Architecture Documentation

Architectural decisions must be recorded in `documentation/ARCHITECTURE.md`. Update this file in the same commit as the decision — not after the fact. Each entry should capture: what was decided, why (the forces that drove it), and what alternatives were rejected. If a prior decision is superseded, mark it as such rather than deleting it.

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
npm run lint -w @priori/web        # eslint + stylelint (src/**/*.module.css)
npm run lint:css -w @priori/web    # stylelint only
npm run build -w @priori/web       # tsc -b (type-check) + vite build — web has no separate typecheck script

# API (apps/api)
npm test -w @priori/api            # vitest run — real-DB tests need PostgreSQL at TEST_DATABASE_URL
                                   # (default postgresql://localhost/priori_test); migrations run automatically
npm run db:migrate -w @priori/api  # apply migrations to DATABASE_URL (default postgresql://localhost/priori_dev)
npm run db:seed -w @priori/api     # seed the dev database
```

`apps/api` has no lint or type-check script.

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
