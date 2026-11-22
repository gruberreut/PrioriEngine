# Sourced by the PreToolUse hooks. The settings.json `if` filters skip most
# Bash calls, but a command with shell expansions ($?, $(...), heredocs) can't
# be matched statically, so Claude Code runs the hook anyway. Each hook checks
# the real command here and does nothing unless it runs the git subcommand.
#
# Usage: runs_git <subcommand>   (reads the hook's JSON input from stdin)
# Errs towards running the check: any `git [-C <dir>] <subcommand>` in the
# command matches, even inside a longer chain or quoted text.
runs_git() {
  local command
  command=$(jq -r '.tool_input.command // empty' 2>/dev/null) || return 0
  # No command to inspect (unexpected input): run the check rather than skip it.
  [ -n "$command" ] || return 0
  printf '%s\n' "$command" |
    grep -Eq "(^|[^[:alnum:]_.-])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+$1([[:space:]]|\$)"
}
