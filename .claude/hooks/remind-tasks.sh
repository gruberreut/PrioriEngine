#!/usr/bin/env bash
# PreToolUse hook for `git commit`: remind the agent to check the task files.
# Only a reminder; the push hook (check-tasks.sh) is the one that blocks.

source "$(dirname "$0")/lib/runs-git.sh"
runs_git commit || exit 0

echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"Before committing: check the task files (tasks/TASKS-BUGS.md, tasks/TASKS-TECH.md, tasks/TASKS-FEATURES.md) and update them to reflect completed work if needed."}}'
