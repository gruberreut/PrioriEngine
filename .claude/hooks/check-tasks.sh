#!/usr/bin/env bash
# PreToolUse hook for `git push`: block the push if none of the outgoing
# commits touch a task file (TASKS-BUGS.md, TASKS-TECH.md, TASKS-FEATURES.md),
# unless a commit message opts out with a line starting "Tasks: none".
# Exit 2 blocks the tool call; stderr is the reason.

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

# No origin/main to compare against (fresh clone, offline): don't block.
git rev-parse --verify --quiet origin/main >/dev/null || exit 0

# Known limitation: checks HEAD, so `git push origin <other-branch>` checks the wrong commits; accepted, since the workflow always pushes the current branch.
range="origin/main..HEAD"

# Nothing outgoing (e.g. deleting a remote branch from main).
[ -n "$(git rev-list "$range")" ] || exit 0

[ -n "$(git log --format=%H "$range" -- TASKS-BUGS.md TASKS-TECH.md TASKS-FEATURES.md)" ] && exit 0
git log --format=%B "$range" | grep -q '^Tasks: none' && exit 0

cat >&2 <<'EOF'
Push blocked: none of the outgoing commits (origin/main..HEAD) change a task
file (TASKS-BUGS.md, TASKS-TECH.md or TASKS-FEATURES.md). Update the task
files for the completed work, or, if there is genuinely nothing to track, add
a line "Tasks: none — <reason>" to one of the commit messages.
EOF
exit 2
