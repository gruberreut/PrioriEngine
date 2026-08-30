# Post-Engine Next Steps

This document defines the next product steps once the recommendation engine is ready, focusing on user flow, UX behavior, and implementation implications.

## 1) Onboarding Questions

When a user reaches the app for the first time, ask a short set of preference questions.

Initial questions:
- When do you usually have the most energy for tasks? (`day`, `night`, `varies`)
- Optional follow-up: preferred session length (`15m`, `30m`, `60m+`)

Requirements:
- Keep onboarding under 60 seconds.
- Provide sensible defaults so users can skip quickly.
- Allow users to edit these preferences later in settings.

Why this matters:
- Improves recommendation quality from first use.
- Reduces cold-start friction.

## 2) Signup and Authentication

Support low-friction account creation and login.

Authentication options:
- Google login
- Passkey
- Additional auth tools/providers (future extension)

Requirements:
- Offer at least one instant method (Google or passkey) on first screen.
- Keep fallback auth options available if a provider fails.
- Maintain one unified user profile regardless of auth method.

Why this matters:
- Fast activation improves conversion.
- Multiple auth options increase reliability across devices.

## 3) Fast Task Entry Flow

Task entry should be accessible from anywhere in the app without interrupting ongoing user activity.

Entry behavior:
- A global quick `+` button opens a lightweight input surface.
- Preserve current screen state and return user after task save/cancel.

Task fields:
- Title
- Context (select existing or create new)
- Time estimate
- Priority

Priority logic:
- If chosen priority requires extra fields, request them inline.
- Always provide defaults to keep completion fast.

Time estimate logic:
- If estimate is greater than split-threshold (default placeholder: 30 minutes) or unknown (`TBD`), suggest splitting into subtasks.
- Suggestion is assistive, not blocking.
- Split-threshold should be configurable and calibrated from usage data.

Future ideas integration:
- Option to send task to `Future Ideas` backlog.
- Planned sync path with external apps (calendar, learning apps).

Why this matters:
- Captures tasks at the moment of intent.
- Prevents workflow interruption and context switching cost.

## 4) Start Work Flow (No Ongoing Task)

If no task is currently in progress, user enters available time and receives recommendations.

Main behavior:
- User inputs available time for current session.
- Recommendation page uses a context carousel.
- First carousel page is `No Context`.
- User can swipe through context pages to see recommendations per context.
- UI must clearly indicate there are additional pages (dots/tabs/hints).

Task selection:
- User selects a recommended task.
- Task is marked as `in_progress`.
- Once a task is `in_progress`, it blocks normal recommendation flow until user updates that task status.

Implementation note:
- Task status model must include `in_progress`.
- Technical design and implementation plan must be updated to include:
  - status transition rules
  - how `in_progress` influences ranking and filtering
  - handling of stale in-progress tasks

Why this matters:
- Converts recommendations into immediate execution.
- Keeps context navigation simple and discoverable.

## 5) Return Flow (Ongoing Task Exists)

If user comes back with an in-progress task, show that task first and require an explicit status action before resuming normal flow.

User options:
- Mark task as `done`
- `Snooze` task if incomplete
- `Dismiss` or `Delete` task to remove it from active consideration
- `Edit` task details (title/context/time/priority and relevant metadata)

Completion behavior:
- Trigger a lightweight celebration moment.
- Then propose next tasks in the same context.
- Top recommendation should be a same-project `flow` task when available.

Snooze behavior:
- Move user back to the `No Context` recommendations page.
- Keep snooze lightweight and fast.
- Snooze does not change context or priority.
- **Superseded:** the field-level mechanism below predates the implemented decision. See `ARCHITECTURE.md` § Task status — snooze sets `lastSuggestedAt` only.

Why this matters:
- Supports real behavior when tasks are not always completed in one session.
- Preserves momentum after completion.

## Required Data and Design Updates

Before implementation, update technical and execution planning docs to include:
- `in_progress` task status in status model
- clear state transitions (`pending -> in_progress -> completed`, `in_progress -> snoozed`, `in_progress -> dismissed/deleted`, `in_progress -> edited`)
- ranking behavior with in-progress tasks
- snooze semantics: see `ARCHITECTURE.md` § Task status (implemented mechanism, supersedes the note earlier in this doc)
- same-context and same-project flow boosting rules
- blocking behavior: while `in_progress` exists, app routes user into in-progress action screen first
- editable task behavior and validation rules

Primary references to update:
- `documentation/PRIORI_ENGINE_MVP_TECHNICAL_DESIGN.md`
- implementation plan document(s) for app and engine integration

## Risks and Mitigations

1. Auth complexity
- Risk: multiple providers add implementation and support complexity.
- Mitigation: ship one primary and one fallback provider first.

2. Non-interruptive quick add UX
- Risk: modal or navigation can still break user focus if not designed carefully.
- Mitigation: use an overlay/sheet with state-preserving return behavior.

3. Subtask splitting fatigue
- Risk: too many split prompts can annoy users.
- Mitigation: keep split suggestion optional and one-tap.

4. In-progress task staleness
- Risk: users forget in-progress tasks and recommendation quality drops.
- Mitigation: keep in-progress task front-and-center on return, and define recovery behavior for stale in-progress items.

5. Context carousel discoverability
- Risk: users may not realize they can swipe for more contexts.
- Mitigation: require visible page indicators/tabs plus first-run guidance.

6. External sync conflicts
- Risk: duplicate or mismatched task states across systems.
- Mitigation: start read-only sync or one-way sync in first iteration.

## Local engine exploration UI (precursor)

Before the full product flows above, a **minimal local UI** can run against the engine to validate behavior. Intended scope:

- **Task data:** Load tasks from the **fixed static sample file** used for development (for example `packages/engine/test/data/tasks.example.json`). Task selection is **not** a user-facing parameter in this precursor; changing tasks means editing that file or replacing it server-side.
- **Context:** Dropdown. For now use a **static list** of contexts that matches the sample file (e.g. `garden`, `learning`, `home`, `bureaucracy`, `computer`). If the list drifts from actual task `contexts` values, users may see **empty recommendations** for a chosen filter.
- **Available time:** Dropdown with fixed options: **10, 15, 30, and 60** minutes.
- **Energy:** Dropdown (`low`, `medium`, `high`).
- **Explain:** Toggle (switch).
- **Limit:** Fixed at **3**; do not show in the UI.
- **Current time:** Use **now**; do not show a control.
- **Last completed project:** Omit (no UI, not passed to the engine in this precursor).

## API: contexts for the current user (future)

When tasks are **per-user** (or per-workspace) and stored server-side, the client should not rely on a hard-coded context list. Plan for an endpoint that returns the **distinct set of contexts** that appear on the current user’s tasks (authorization-scoped), so dropdowns and filters stay accurate as tasks change.

Until that exists, the local exploration UI may continue to use a static list aligned with the sample file.

## Suggested Additions After Initial Rollout

- Session recovery prompt when app opens with a stale in-progress task.
- Personalization loop: let users rate recommendation usefulness.
- Basic product metrics:
  - task completion rate
  - snooze rate
  - recommendation acceptance rate by context
  - time-to-start from app open
- Gentle anti-overwhelm defaults:
  - cap visible recommendations
  - highlight one best next action
