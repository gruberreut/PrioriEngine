#!/usr/bin/env bash
# PreToolUse hook for `git push`: block the push if none of the outgoing
# commits touch TASKS.md, unless a commit message opts out with a line
# starting "Tasks: none". Exit 2 blocks the tool call; stderr is the reason.

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

# No origin/main to compare against (fresh clone, offline): don't block.
git rev-parse --verify --quiet origin/main >/dev/null || exit 0

range="origin/main..HEAD"

# Nothing outgoing (e.g. deleting a remote branch from main).
[ -n "$(git rev-list "$range")" ] || exit 0

[ -n "$(git log --format=%H "$range" -- TASKS.md)" ] && exit 0
git log --format=%B "$range" | grep -q '^Tasks: none' && exit 0

cat >&2 <<'EOF'
Push blocked: none of the outgoing commits (origin/main..HEAD) change TASKS.md.
Update TASKS.md for the completed work, or, if there is genuinely nothing to
track, add a line "Tasks: none — <reason>" to one of the commit messages.
EOF
exit 2
