#!/usr/bin/env bash
# PreToolUse hook for `git commit`: block the commit if apps/web has changes
# (staged or not, to cover `git commit -a`) and `npm run lint -w @priori/web`
# fails. Lint runs with --max-warnings 0, so a warning fails it too.
# Exit 2 blocks the tool call; stderr is the reason.

source "$(dirname "$0")/lib/runs-git.sh"
runs_git commit || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

# Commit doesn't touch the web app: nothing to check.
[ -n "$(git status --porcelain -- apps/web)" ] || exit 0

# Known limitation: lints the working tree, not the staged snapshot, so a
# partial commit is checked against all of apps/web; accepted, since the
# working tree must pass before the work is complete anyway.
if ! output=$(npm run lint -w @priori/web 2>&1); then
  {
    echo "Commit blocked: apps/web has changes and \`npm run lint -w @priori/web\`"
    echo "fails (warnings count). Fix the problems below, then commit again."
    echo
    printf '%s\n' "$output" | tail -40
  } >&2
  exit 2
fi
exit 0
