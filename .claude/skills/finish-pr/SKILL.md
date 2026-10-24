---
name: finish-pr
description: Finalize a GitHub PR for this repo — the PR number given, or else the current branch's PR. If it is OPEN, audit it for merge readiness (every PR template section filled, commits match the description, TASKS.md rule met) and report "ready to merge" or what's missing, without ever merging. If it is MERGED, run the post-merge cleanup from CLAUDE.md § Branch Workflow and confirm a clean main in sync with origin/main. If it is CLOSED unmerged, report and stop. Use when the user types /finish-pr or asks to finish, wrap up, check, or clean up after a PR.
argument-hint: "[pr-number]"
---

# Finish a PR

Arguments: `$ARGUMENTS` (optional PR number).

The branch workflow this skill serves is defined in `CLAUDE.md` § Branch Workflow; read that section now and treat it as the source of truth. **Never merge a PR**, and never push to `main`.

## 1. Find the PR

- If a PR number was given: `gh pr view <number> --json number,state,title,body,headRefName,url`
- Otherwise: `gh pr view --json number,state,title,body,headRefName,url` (the PR for the current branch)

If no PR is found, say so and stop.

Then branch on `state`.

## 2. OPEN — audit for merge readiness

Run `git fetch origin` first. If the PR's `headRefName` isn't the current branch, compare against `origin/<headRefName>` instead of `HEAD` below, and say so.

**a. PR template.** Read `.github/pull_request_template.md`. For every `##` section in it, check the PR body has the same heading with real content under it. A section counts as a gap if it is missing, empty, or holds only the template's `<!-- ... -->` placeholder comment (strip HTML comments before judging). List the gaps. If there are any, offer to fill them: draft the content from the commits and diff, show the user the **complete new body**, and run `gh pr edit <number> --body-file <file>` only after they approve it. Write the file to the scratchpad directory.

**b. Commits vs description.** Run `git log origin/main..HEAD` (and `git diff --stat origin/main...HEAD`). Check the commits and changed files match what "What changed" describes: flag commits or files the description doesn't account for, and described changes with no matching commit. Also note if `git log HEAD..origin/main` is non-empty (the branch is behind main).

**c. TASKS.md rule** (see `CLAUDE.md` § Task Tracking and the push hook `.claude/hooks/check-tasks.sh`). Met if either:
- some commit in `origin/main..HEAD` changes `TASKS.md` (`git log --format=%h origin/main..HEAD -- TASKS.md`) and the change reflects this PR's work, or
- a commit message has a `Tasks: none — <reason>` line, and the reason is accurate (the change really has nothing to track).

**d. Report.** End with either **Ready to merge** (and the PR URL) or a short list of what's missing. Merging is the user's step on GitHub.

## 3. MERGED — clean up

Run the post-merge step of `CLAUDE.md` § Branch Workflow ("Afterwards", step 6) for the PR's `headRefName`. Before deleting, check the branch has no local commits that aren't on the PR (`git log origin/<headRefName>..<headRefName>`); if it does, stop and ask. If the remote branch is already gone, say so and continue.

Finish by running `git status -sb` and confirm it shows `## main...origin/main` with no ahead/behind count and no changes. Report anything else as not clean.

## 4. CLOSED (not merged)

Report that the PR was closed without merging, with its URL, and stop. Don't delete the branch.
