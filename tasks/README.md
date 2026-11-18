# Tasks

Work on this project is tracked in plain Markdown files rather than an issue tracker. In a team setting I'd use Jira; for a solo project worked on largely with an AI coding agent, these files are a better fit:

- **The agent reads and updates them directly.** No API, credentials or sync, and it follows the read order in `CLAUDE.md` to choose the next task.
- **Task changes go through the PR like the code.** A PR shows both the implementation and the task items it ticks off.
- **Section numbers (`§ N`) are stable.** Code comments, design docs and PRs can reference them.

| File | Holds |
|---|---|
| [`TASKS-BUGS.md`](TASKS-BUGS.md) | Known bugs, read first |
| [`TASKS-TECH.md`](TASKS-TECH.md) | Technical work: refactors, tooling, infrastructure, docs |
| [`TASKS-FEATURES.md`](TASKS-FEATURES.md) | Features users can see |
| [`TASKS-DONE.md`](TASKS-DONE.md) | Archive of completed sections |

The rules are in [`CLAUDE.md`](../CLAUDE.md) § Task Tracking; the reasoning behind them is in [`documentation/PROCESS.md`](../documentation/PROCESS.md) § Task tracking.
