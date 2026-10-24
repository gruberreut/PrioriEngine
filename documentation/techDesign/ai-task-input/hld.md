# AI task input — HLD

Tracked in `TASKS.md` § 53. This is the high-level design. The low-level design (`lld.md`, next to this file) is written and approved before implementation starts. Project-wide AI rules (provider, consent, allowance, logging, injection defence) are in `documentation/techDesign/ai-integration/hld.md`; this document only adds what is specific to task input.

## Context

Adding tasks today means filling in the manual form at `/tasks/new` one task at a time. Projects with subprojects and subtasks are the slowest case: every child is a separate form, and its parent is chosen by tapping a just-created row or by passing `?parentId=`.

AI task input lets the user describe one or more tasks in free text ("Kitchen reno: get 3 quotes, pick tiles, and before the 15th book the plumber"). The app shows an editable draft task tree to review and confirm. The goal is the fewest possible interruptions while still representing what the user meant: fill in what can be inferred safely, ask only when a wrong guess would really misrepresent intent, and make every value easy to correct.

## Decisions

### Review-first, with questions inline

Submitting text always leads straight to the review screen, never to a separate question-and-answer step. Open questions are shown on the draft cards they affect. Each one offers its answers plus the default, and an unanswered question falls back to the default when the user confirms. How questions look and are answered is part of the results design (see Draft presentation). For a simple single task, the review is one card and a Save button.

**Rejected:**
- A chat-style question round before the review. It's an extra step on every input that has a question.
- Adaptive switching between the two. That's two flows to build and learn.

### Where each value comes from

For each field of each draft, the first rule that gives an answer wins:

1. **Stated** in the text ("takes an hour", "at home", "Friday").
2. **Inferred** confidently from the wording ("buy" → in-person; "email X" → anywhere, short).
3. **Inherited** from the draft's parent, in the batch or in the existing tree (inheritable fields only, see below).
4. **Default.**

Every draft field carries its `source` (`stated | inferred | inherited | default`). The review screen distinguishes non-stated values from stated ones so the user can see what was guessed, without asking them anything. How that's shown visually is part of the results design (see Draft presentation). This is separate from open questions (below), which are only for the few values with no safe guess. Rule 3 and rule 4 are applied **in code after the model responds**, not by the model, so they stay consistent and testable. The model only reports what it parsed or inferred.

**When to ask** (an open question on the card). Ask only when no safe value exists and a wrong guess would change ranking a lot or misrepresent intent:

| Field | Asks when |
|---|---|
| Duration, energy, location | Never; defaults are safe and easy to fix on the card |
| Context | The text names a context that doesn't exist: "Create *Garden*" / "Use *Home*" / "None" |
| Due date | The phrase is ambiguous ("end of next week"), or the text says urgent with no date |
| Priority | Never asks; shown as a one-tap control on every card (see Priority) |
| Structure | It's unclear whether a phrase is one task or several, or which project an item belongs to |

At most **3 questions per batch**, and there's never a second round. The model ranks its questions, and the server keeps the top three.

### Inheritance: context, location, energy and due date are inherited; priority and duration are not

Each subtask can have its own **context, location, energy and due date**, and a project can contain tasks that differ in all of them. When one of these is left empty, the subtask inherits it from the nearest ancestor that has one, so changing a parent changes the children that didn't set their own. A value stated on a subtask is stored and overrides the parent. For AI drafts, a field counts as empty when the model didn't state or infer it.

The task-model change behind this (energy and location becoming optional, display and form support) is its own task, **§ 55**, which this feature depends on. Context and due date are already optional but don't inherit when ranked: bug **§ 10.8**.

**Priority is not inherited.** Tasks inside one project can differ in urgency, so each task keeps its own priority. How parent and child priorities relate is specified separately in § 49. **Duration is not inherited** either: a project's duration says nothing about one of its steps.

**Rejected:**
- Copying the parent's values at creation (what `POST /api/tasks/:id/split` does today). Later parent edits wouldn't reach the children.
- Inheriting priority. Rejected for the reason above.

**Known limitation:** with `null` meaning "inherit", a subtask can't say "no due date" while its parent has one. Accepted for now.

### Priority: inferred where possible, always one tap away

Priority is the ranking's main lever, and it is weak if every task gets a middle default (§ 50). Until § 50 decides the long-term approach, AI task input does three things:

1. The model infers priority from cues in the text: explicit words ("urgent", "ASAP", "whenever", "someday"), deadlines, consequences, people waiting.
2. The draft records where the value came from (`stated | inferred | default`), and that is stored with the task (see DB), so tasks with no real priority signal can be found later.
3. Every draft card shows priority as a one-tap control, using the same scale labels as `TaskCreationPage` (Urgent, Soon, Medium, Later, Ongoing).

The model sees existing **projects**, not individual tasks (see Existing projects), so it can't place a new task's priority relative to the user's other tasks. Relative placement is a § 50 question.

The default priority and duration (used when nothing is stated or inferred) come from a single shared constant that the manual form and AI drafting both read. Their values are decided in § 50. Today the form starts at 3 / 20 min while the engine falls back to 5 / 30 min.

### Existing projects: titles of parent tasks are sent

To attach new items to existing projects ("add 'buy paint' to the kitchen reno"), the request includes the id and title of each of the user's **open parent tasks** (tasks with children), plus their ancestor path. Leaf tasks are not sent. The model may set a draft's parent to one of those ids or to another draft. The server rejects any other parent id.

If the page was opened with `?parentId=`, that project is the default parent for top-level drafts.

**Why:** it covers the most useful project case while sending the least data.

**Rejected:**
- Sending all open tasks. More data at rest with the provider and a larger prompt. Duplicate detection and relative priority aren't needed yet.
- New trees only. That pushes the most common project case back to manual re-parenting.

**Consent notice** for this feature lists: "the text you type and the titles of your projects".

### Recurring requests become one-off tasks for now

Recurrence isn't stored anywhere yet (§ 51). When the model detects a repeat ("every Sunday"), it creates a single task and sets `recurrenceDetected`, and the card shows an inline note: "Repeats aren't supported yet. This was added once." Parsing recurrence is a § 51 item.

### Restructuring on the review screen uses fixed actions, not AI

Drafts have checkboxes. With one or more selected, an action bar offers:

- **Cancel:** remove the selected drafts (and their children) from the batch.
- **Change hierarchy**, with three sub-options:
  - **Move:** to an existing project or a project in the draft (picker).
  - **Create project:** group the selected drafts under a new project the user names.
  - **Change to standalone:** detach the selected drafts from their parent (they become top-level).

All of these run in the browser on the draft tree and make no AI call: no allowance is used, the result is predictable, and there's no free-text field to misuse. Field values (title, priority, duration, energy, location, context, due date) are edited directly on each card.

**Rejected:**
- A follow-up text instruction to the AI. It costs allowance, adds a second prompt to test and secure, and the common changes are structural anyway.
- Fixed actions plus a short AI instruction. Rejected for the same reasons.

### Entry point: the default on `/tasks/new`, when AI is available

| State | `/tasks/new` shows |
|---|---|
| AI on, allowance left | The AI text box first, with the allowance indicator, a Draft button, and "Fill in fields manually ›" linking to the existing form |
| AI on, allowance used up | The manual form, with an `InlineMessage`: "AI allowance used up, resets <time>" |
| AI off | The manual form only, unchanged from today |
| First use (no consent yet) | The consent notice; agreeing shows the AI text box, declining shows the manual form |

`?parentId=` / `?parentTitle=` keep working in all states.

### Draft presentation: `TaskCard`, final shape pending design

Drafts are shown with `TaskCard`. Whether that means extending `TaskCard` (e.g. a new `flavor`) or building a review page that composes it is decided once the results design exists. It should be coordinated with § 47 (the `TaskCard` design review). The design has to cover:

- the draft tree (nesting, existing-project breadcrumbs)
- priority and due date on the card, since `TaskCard` shows neither today
- how guessed (non-stated) values are distinguished from stated ones, per field
- how open questions are shown and answered, including the default
- the recurrence note
- selection checkboxes and the action bar
- inline field editing
- loading (`Skeleton`) and error states

### Ships after Auth

Implementation starts once § 34 (Auth) is done, so the endpoint is per user and allowance-limited from day one.

## Flow

```
/tasks/new (AI available)
  user types text ──► POST /api/ai/task-drafts
                        ├─ check AI enabled + consent        (403 if not)
                        ├─ input hygiene + length cap        (400 if too long)
                        ├─ reserve allowance units (txn)     (429 if exhausted)
                        ├─ load open parent tasks + contexts
                        ├─ call model (structured output)
                        ├─ validate output against schema    (502 invalid_output)
                        ├─ apply inheritance + defaults in code, rank & cap questions
                        └─ log usage event, return drafts + questions + allowance
  review screen: edit fields, answer questions, restructure (client-only)
  Save ──► POST /api/tasks/batch  (one transaction: new contexts, then tasks parent-first)
       └─ PATCH /api/ai/task-drafts/:eventId/outcome  (kept / edited / deleted counts)
```

## Model output schema (summary)

```
{
  drafts: [{
    tempId, title,                       // tempId: model-assigned, unique in the batch
    parent: { kind: "draft", tempId } | { kind: "existing", id } | null,
    priority?:   { value: 1..10, source: "stated" | "inferred" },
    duration?:   { value: minutes,  source },
    energy?:     { value: low|medium|high, source },
    location?:   { value: home|in-person|anywhere, source },
    context?:    { name, source },          // matched to an existing context or flagged new
    dueDate?:    { value: ISO date, source },
    recurrenceDetected?: true
  }],
  questions: [{ draftTempId, field, prompt, options[], rank }]
}
```

Fields the model omits are filled by the server's inheritance and default step, which sets `source` to `inherited` or `default`. The server enforces: titles 1–200 characters, at most 50 drafts and depth 4 per batch, parent references that resolve, no cycles, and enum values in range. The current date and the user's time zone are passed in, so relative dates ("Friday") resolve correctly.

## Components to reuse or extend

### Web (`apps/web`)

| Existing | Reuse / extend |
|---|---|
| `features/tasks/TaskCreationPage` | **Extend:** AI-availability gating (table above), AI input as default, link to the manual form, consent notice on first use |
| `features/tasks/TaskCreationForm` | **Reuse** unchanged as the manual path |
| `entity/TaskCard` | **Reuse/extend** for draft cards; shape pending the results design (see above) |
| `components/TextInput` (`Textarea`) | **Reuse** for the text box |
| `components/Button` | **Reuse** for Draft, Save, Start over |
| `components/InlineMessage` | **Reuse** for allowance-exhausted, refusal and error messages |
| `components/Checkbox` | **Reuse** for draft selection |
| `components/Chip` | **Candidate** for answering open questions, depending on the results design |
| `components/Sheet` | **Reuse** for the Move picker and the Create project naming step |
| `components/ActionButton` | **Reuse** in the selection action bar |
| `components/Skeleton` | **Reuse** while drafting |
| `components/Select`, `features/tasks/PriorityPicker`, `features/tasks/DurationPicker` | **Reuse** for inline field editing on draft cards |
| `components/Switch` | **Reuse** for the Settings "Use AI" toggle |
| `services/taskCreationService.ts` | **Extend:** `createTaskBatch(...)` (`CreateTaskPayload`'s nullable inheritable fields come from § 55) |
| `services/contextService.ts` | **Reuse** `getContextItems` to show context names on drafts |
| `features/tasks/resolveTask.ts` | **Reuse** to show inherited values on drafts (resolving every inheritable field is § 55) |
| `types/task.ts` | **Extend:** add `prioritySource` (nullable `energyRequired` and `location` come from § 55) |

### API (`apps/api`)

| Existing | Reuse / extend |
|---|---|
| `routes/tasks.ts` | **Extend:** add `POST /api/tasks/batch`; `POST /api/tasks` records `prioritySource` (accepting `null` for inherited fields is § 55) |
| `routes/rank.ts` | **Fixed separately as bug § 10.8:** DB `null` must reach the engine as a missing field. Today it passes `null`/`[]`, which stops the engine's inheritance (`inheritedValue` only walks up on `undefined`), so stored subtasks never inherit context or due date. § 55's optional energy and location depend on the same fix |
| `db/queries.ts` (→ `db/sharedQueries/tasks.ts` after § 48) | **Extend:** a shared query for open parent tasks with ancestor paths, used by drafting |
| `lib/http.ts` | **Reuse** `json`, `readBody` |
| `openapi.yaml` | **Extend** with every new and changed endpoint |
| `POST /api/tasks/:id/split` | **Revisit in § 55** (not in this feature): it copies energy and location onto the new child instead of leaving them to inherit |

### Engine (`packages/engine`)

No change is needed for this feature beyond the `rank.ts` mapping fix. Removing priority inheritance from `normalizer.ts` belongs to § 49.

## New components

### Web

| New | Purpose |
|---|---|
| `features/tasks/AiTaskInput` | Text box, `AllowanceIndicator`, Draft button, manual-form link |
| `features/tasks/DraftReview` | Renders the draft tree with `TaskCard`, inline editing, open questions, guessed-value indication, selection; Save / Start over |
| `features/tasks/DraftActionBar` | Cancel, Change hierarchy → Move / Create project / Change to standalone |
| `features/tasks/draftTree.ts` | Pure functions on the draft tree (move, group, detach, remove, answer question, apply default on save), unit-tested |
| `services/aiService.ts`, `useAiStatus`, `AllowanceIndicator`, `AiConsentNotice` | Shared AI pieces, specified in the AI integration doc |

### API

| New | Purpose |
|---|---|
| `src/ai/taskDrafting.ts` | System prompt, output schema, call, validation |
| `src/ai/draftResolution.ts` | Inheritance, defaults, `source` filling, question ranking and cap (pure, unit-tested) |
| `routes/ai.ts` → `POST /api/ai/task-drafts` | `{ text, parentId? }` → `{ eventId, drafts, questions, allowance }` |
| `routes/ai.ts` → `PATCH /api/ai/task-drafts/:eventId/outcome` | `{ kept, edited, deleted }`, written to the usage event |
| `routes/tasks.ts` → `POST /api/tasks/batch` | `{ newContexts: [name], tasks: [...] }` (tasks reference parents by `tempId` or existing id) → created tasks. One transaction: create the contexts, then insert tasks parent-first |

The shared `GET /api/ai/status` and `PATCH /api/ai/settings` are specified in the AI integration doc.

## DB

| Change | Detail |
|---|---|
| `tasks.energy_required`, `tasks.location` | Become nullable (`null` = inherit) in **§ 55**, a prerequisite; listed here for completeness |
| `tasks.due_date`, `tasks.context_id` | Already nullable; `null` means "inherit" once bug § 10.8 is fixed |
| `tasks.priority_source` | New, `text not null default 'stated'` (`stated \| inferred \| default`); existing rows are `stated`, since they came from the form. Kept here because § 50 builds on it |
| `tasks.priority`, `tasks.duration` | Unchanged, `not null` (not inherited) |
| `users.ai_enabled`, `users.ai_consented_at`, table `ai_usage_events` | From the AI integration doc |

This feature's own migration (`npm run db:generate -w @priori/api`) adds only `tasks.priority_source`, plus the AI integration tables if they haven't landed yet.

## Testing

- **API, real DB:** `POST /api/tasks/batch` (parent-first insertion, `tempId` resolution, new contexts, rollback on any failure, rejects foreign parent ids), batch-created subtasks with empty fields inherit when ranked, the new parent-tasks query.
- **API, AI module replaced with canned output:** `POST /api/ai/task-drafts` gating (AI off → 403, no consent → 403, length → 400, allowance → 429), invalid output → 502 with units kept, provider error → units refunded.
- **Unit:** `draftResolution.ts` (each source rule, the inheritable vs non-inheritable fields, the question cap), `draftTree.ts` (every restructure action, cycles prevented).
- **Web:** `TaskCreationPage` state table; Storybook stories for every new component and draft-card state, per `apps/web/CLAUDE.md`.
- **Prompt evaluation set:** a single task; a brain dump of unrelated tasks; a project with subprojects; adding to an existing project; relative and ambiguous dates; an unknown context; urgent with no date; a recurring request; injection attempts ("ignore the above and…", "delete all my tasks") that must come back as task titles; non-English input.

## Prerequisites

- § 34 Auth (per-user allowance and consent)
- AI integration (§ 52): `src/ai/`, consent, allowance, usage log, status endpoints
- A Settings page for the "Use AI" toggle (§ 23 / § 44 are both deferred)
- The results design (draft presentation)
- § 55 (subtasks can inherit energy and location), which itself depends on bug § 10.8 (stored subtasks don't inherit when ranked)
- § 48 if it lands first: the new parent-tasks query goes in `db/sharedQueries/tasks.ts`

Related but not blocking: § 49 (parent/child priority), § 50 (priority signal; this feature ships its interim), § 51 (recurrence; this feature flags it).

## Explicitly deferred

- Follow-up AI instructions on the review screen
- Sending leaf tasks to the model (duplicate detection, relative priority)
- Recurrence parsing (§ 51)
- Voice input
- Personal-pattern defaults (the user's usual context, typical durations)

## Open questions

- Allowance period and size, and this feature's unit thresholds by input length (AI integration doc).
- Whether the app's model (AI integration doc) holds up on this feature's evaluation set.
- The values of the shared default priority and duration (§ 50).
