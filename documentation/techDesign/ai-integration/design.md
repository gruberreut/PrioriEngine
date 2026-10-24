# AI integration

Tracked in `TASKS.md` § 52.

## Context

TempAppName is adding its first AI feature, AI task input (`documentation/techDesign/ai-task-input/design.md`): the user describes one or more tasks in free text and gets back a draft task tree to review. More AI features are likely to follow. This document sets the project-wide rules every AI feature follows: where AI code lives, how the provider is called, how users opt in and out, how cost is capped, what is logged, and how untrusted input is kept from steering the model.

Nothing in the repo calls an AI provider today. There is no auth yet (§ 34), the API runs only on `localhost` (§ 38), and all data belongs to a single dev user.

## Decisions

### Provider: Claude, called directly through one module

The API calls Claude through the official Anthropic TypeScript SDK (`@anthropic-ai/sdk`). The SDK is imported in exactly one place, `apps/api/src/ai/`, which exposes app-level functions (e.g. `draftTasks(...)`), never SDK types. Routes call those functions and know nothing about the provider.

**Why:** smallest footprint that doesn't foreclose a provider switch. A switch would mean rewriting one module, not the routes.

**Rejected:**
- A provider-agnostic interface with a Claude adapter. That's abstraction for a second provider that doesn't exist yet.
- A multi-provider library (e.g. Vercel AI SDK). It's an extra dependency, and it reduces every provider to the features they all share.

### All AI calls happen on the server

The web app never talks to the provider. It calls TempAppName's own API, which holds the API key (`ANTHROPIC_API_KEY`, server env only) and enforces consent and allowance.

**Why:** the key must never reach the browser, and only the server can enforce allowance strictly.

### One model for the whole app, chosen by measurement

Every AI feature uses the same model. The model ID is a constant in `src/ai/client.ts`, so changing it goes through a PR like any other change. A feature that turns out to need a different model can get a per-feature override then; until a real need appears, that option isn't built.

**The model is chosen on the backend only.** It is never part of an API request or response. Endpoints don't accept a model field, and the browser can't influence which model runs. The model is recorded in `ai_usage_events` for cost tracking, which is server-side only.

**Why:** there's one AI feature today, and one model means one config value, one prompt-caching namespace and one set of costs to understand.

**Rejected:**
- Choosing a model per feature now. It adds configuration and testing for each feature with no current need.
- An environment variable for the model. It would allow switching without a deploy, but nothing needs that yet, and a code constant keeps model changes reviewable in a PR.

The model is chosen from the pricing research and the evaluation sets (see Testing), and re-checked when a feature is added. Current candidates, at Anthropic first-party prices per million tokens (input / output):

| Model | ID | Input | Output | Notes |
|---|---|---|---|---|
| Claude Opus 5.5 | `claude-opus-5-5` | $4.00 | $20.00 | Most capable of the three; Anthropic's recommended default |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | $2.00 | $10.00 | Middle option |
| Claude Haiku 5.5 | `claude-haiku-5-5` | $0.10 | $0.50 | Fastest and cheapest; no server-side refusal fallback |

**Leaning:** a low-cost model (Claude Haiku 5.5), since task drafting, the first feature, is a fairly simple extraction job. To be confirmed by the pricing research (§ 52's first item) and the task-drafting evaluation set before it's committed. Moving up a tier is reserved for cases where the evaluation shows the low-cost model making structure mistakes.

### Structured output only, no tools

Every AI call asks for a single JSON object that matches a schema, using the API's structured-output setting (`output_config.format` with a JSON schema). No tools are given to the model, so it has no way to take any action.

**Why:** the app gets back data it can validate, and the model's only possible output is that data. That is the core of the injection defence below.

**Rejected:** forced tool use (`tool_choice: tool`). It's the older way to get JSON back, it's rejected with a 400 by Claude Opus 5.5 and Claude Sonnet 5.5, and it would put a tool in the request for no reason.

### User input is data, never instructions

This is a hard rule for every AI feature: **anything the user types is material for the feature to process, never an instruction to the model.** A user can plan a task that mentions AI ("ask the AI to summarise my notes" is a valid task title), but they can never make the model do something through the app.

Sanitising text can't guarantee this, because there's no reliable way to detect instructions written in natural language. The guarantee comes from how calls are built:

1. **Fixed system prompt.** The system prompt is a constant in code. It never contains user text and states that the user turn holds data to process for one specific purpose, and that any instructions inside it are part of that data.
2. **Delimited user data.** User text goes in the user turn, inside clear delimiters (e.g. `<task_text>…</task_text>`), with no other content mixed in.
3. **No capabilities.** No tools, no web access, no code execution. The only possible output is a JSON object matching the schema.
4. **Server-side validation.** The server parses the output, validates it against the schema and length limits, and rejects anything else (outcome `invalid_output`, shown to the user as a retryable error).
5. **Minimal context.** The model sees only what the feature needs from the requesting user's own data, never other users' data or system information. An injected instruction has nothing else to reach.
6. **Human approval before effect.** Model output is a draft. Nothing is written until the user reviews and confirms it.
7. **Safe rendering.** Model output is rendered as text (React's default escaping), never as HTML or Markdown, and never turned into links.

Input hygiene still applies, but it isn't the security boundary: normalise Unicode (NFC), strip control characters, trim, and enforce a per-feature maximum length (rejected with a clear message, never silently cut).

### Consent: opt-in on first use, revocable in Settings

Each user has an AI setting, **off** until they agree. The first time they open an AI feature, they see a one-time notice of what is sent to the provider (their text, plus whatever context the feature lists, e.g. project titles) and agree or decline. Agreeing turns AI on and records when consent was given. Settings has a "Use AI" toggle to turn it off or back on at any time.

Every AI feature checks the setting on the server (the endpoint refuses when AI is off) and in the UI (the AI entry points are hidden when AI is off).

**Depends on:** a Settings page. None exists yet (§ 23 and § 44 are both deferred), so the AI toggle is a dependency for whichever is built first.

**Rejected:** a disclosure note only (no explicit agreement), and AI off until the user finds it in Settings (most users would never discover it).

### Cost control: a strictly enforced per-user allowance

Three layers:

1. **Input length cap per feature**, enforced before anything else. This bounds the worst-case cost of one call.
2. **Per-user allowance**, counted in **units**. A request costs 1–3 units depending on input length, with the thresholds set per feature. Users see the percentage of their allowance left next to each AI input, and when it resets.
3. **Monthly spend limit** in the Anthropic Console, as a backstop if the app's enforcement fails.

**Strict enforcement.** The allowance is checked and reserved in one database transaction *before* the provider is called. The transaction locks the user's row, sums the units used in the current period, and inserts the usage record with its units only if the total stays within the limit. Concurrent requests queue on the lock, so they can't overspend together. Because `max_tokens` caps the output and the length cap bounds the input, the worst-case cost of each unit is known in advance.

**Refunds.** If the call fails on the provider side (network error, 5xx, rate limit), the reserved units are released. If it fails because the model's output didn't validate, or the model refused, the units stay spent, since the model did the work.

**When the allowance runs out:** the endpoint returns `429` with the reset time, and the UI hides the AI input, showing the non-AI path with a short note.

**Rejected:**
- A Console spend limit only. One user could use up everyone's budget.
- Token budgets per user. Precise, but hard for users to relate to, and more to build.

**Open:** the allowance period (daily, monthly or rolling) and its size are deferred until cost options have been researched (see Open questions).

### Logging: metadata only

Each AI call stores one row in `ai_usage_events`:

- user, feature, timestamp, model
- units reserved, input/output/cache-read tokens, latency
- outcome (`ok | provider_error | refusal | invalid_output`)
- per-feature quality signals added afterwards (for task input: how many drafts were kept, edited and deleted)

No input text and no model output are stored. The same table drives allowance enforcement.

**Why:** enough for cost tracking, allowance and quality trends, without keeping user content at rest.

**Rejected:**
- Storing text and output for a short time. More useful for debugging, but it's user content at rest and would have to be disclosed.
- Storing nothing. Cost would only be visible in the Console, and allowance would need its own counter.

### Refusals and errors

- **Refusal:** check `stop_reason` before reading content. On `refusal` the outcome is `refusal`, and the user sees a neutral "Couldn't draft that, please rephrase or add tasks manually." On models that support it (Opus 5.5, Sonnet 5.5), the request includes the server-side refusal fallback (`fallbacks: "default"` with the `server-side-fallback-2026-07-01` beta), so a declined request is retried on another model inside the same call.
- **Provider errors:** handled with the SDK's typed error classes. The SDK's built-in retries (2 by default) cover transient 429/5xx responses. After that, the outcome is `provider_error` and the units are refunded.
- **Timeouts:** a client timeout suited to an interactive request (around 30 s), set per call.

### Prompt caching

Put the fixed system prompt and output schema first in the request and mark them for caching. Any variable content (current date, user context) goes after them. Caching applies only above a minimum prompt length (512–4096 tokens depending on the model), so a short prompt may not be cached. Check `usage.cache_read_input_tokens` in the usage log rather than assuming it's cached.

## Approach

**Code layout (`apps/api/src/ai/`):**

| File | Purpose |
|---|---|
| `client.ts` | The only `@anthropic-ai/sdk` import: client construction, the model constant, timeouts |
| `allowance.ts` | `reserveUnits`, `releaseUnits`, `getAllowanceStatus` (transactional, over `ai_usage_events`) |
| `inputHygiene.ts` | Normalisation, control-character stripping, length check |
| `<feature>.ts` | One file per feature (first: `taskDrafting.ts`): system prompt, output schema, call, validation |

**Routes:** `apps/api/src/routes/ai.ts`, using the existing `create<Entity>Handler(db, ...deps)` pattern, receives the AI module as a dependency so tests can replace it. It serves the shared endpoints:
- `GET /api/ai/status`: `{ enabled, consentedAt, allowance: { percentLeft, resetsAt } }`
- `PATCH /api/ai/settings`: `{ enabled }`. Turning AI on for the first time records consent.

Feature endpoints are listed in each feature's design doc. All endpoints are documented in `apps/api/openapi.yaml`.

**DB:**
- `users`: add `ai_enabled boolean not null default false` and `ai_consented_at timestamptz null`.
- New table `ai_usage_events`: `id`, `user_id` (FK), `feature`, `created_at`, `model`, `units`, `input_tokens`, `output_tokens`, `cache_read_tokens`, `latency_ms`, `outcome`, plus nullable per-feature quality columns. Index on `(user_id, created_at)` for the allowance sum.

**Web:**
- `services/aiService.ts`: `getAiStatus`, `updateAiSettings`.
- A `useAiStatus` hook that pages use to decide whether to show AI entry points.
- An `AllowanceIndicator` component ("72% of AI allowance left").
- An `AiConsentNotice` component (the first-use agreement).
- The "Use AI" toggle in Settings, using the existing `Switch` component.

**Dependencies:**
- `@anthropic-ai/sdk` in `apps/api`, recorded in `documentation/ARCHITECTURE.md` as a decision.
- § 34 Auth must be done before any AI endpoint is exposed, since the allowance is per user.

## Testing

- **API tests** replace the AI module with canned outputs (valid, invalid JSON, schema-violating, refusal, provider error), so they never call the provider.
- Allowance gets **real-DB tests** (concurrent reservations never exceed the limit, refunds on provider error, period boundaries), since that's a high-value invariant under `apps/api/CLAUDE.md`'s testing strategy.
- **Prompt evaluation:** each feature keeps a set of sample inputs with expected results, run against the real model on demand (not in `npm test`, since it costs money). It's used to choose the app's model, to check that a new feature works on it, and to check prompt changes.
- **Injection cases** belong in every feature's sample set: text that tries to give the model instructions must come back as ordinary feature output (for task input: tasks with those words as titles), and never as anything else.

## Open questions

- **Pricing research** (§ 52's first item, not blocked by Auth): per-call cost of task drafting at typical and worst-case sizes, the effect of prompt caching, and what an allowance would cost per user. The two questions below depend on it.
- **Allowance period and size.** Daily, monthly or rolling, and how many units.
- **The app's model.** Leaning low-cost (Claude Haiku 5.5); confirmed from measured quality and cost on the task-drafting sample set.
- **Anthropic data retention settings** for the organisation, and whether the consent notice needs to mention them.
