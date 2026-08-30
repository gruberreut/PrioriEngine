Below is a **clean user-flow specification**

* the **Priori Engine**
* **Top N suggestions (default 3)**
* **contexts carousel**
* **refresh = snooze**
* **minimal cognitive load**
* **short task bias (10–20 min)**

This is written like a **product spec**, not a UX wireframe.

---

# Priori – User Flow Specification (MVP)

## Core Product Idea

The application acts as a **personal cognitive assistant** that helps the user decide **what to do next** with minimal mental effort.

The user offloads tasks into the system.
When they want to act, the system surfaces **a small set of the most relevant tasks** for the current moment.

The goal is to reduce:

* decision fatigue
* mental load
* friction between intention and action.

---

# Core Objects

### Task

A task represents a single action the user can complete.

Tasks are ideally **10–20 minutes long**.

Tasks may contain **subtasks**, forming a limited-depth tree.

Tasks belong to one or more **contexts**.

---

### Context

Contexts represent **areas of life or work**.

Examples:

* General (system generated)
* Work
* Home
* Creativity
* Garden
* Learning
* Personal project

Users can:

* use default contexts
* create custom ones
* assign multiple contexts to a task

---

# Core Screens

## 1. Task Capture

Purpose: **offload thoughts quickly**

The user enters a new task when something comes to mind.

### Input fields

Required

* Task title

Optional

* Context(s)
* Priority (1–10)
* Estimated duration
* Energy level
* Parent task (optional)
* Due date (required if priority = 1)

### UX Principles

Task capture must be:

* fast
* low friction
* interruptible
* forgiving

Future improvement (not MVP):

* automatic suggestion to split large tasks.

---

# 2. Choose a Task (Main Interaction)

This is the **primary interaction of the app**.

The user opens the app when they want to **do something productive** but do not want to decide what.

---

## Step 1 — User provides available time

Example:

```
How much time do you have?
```

Options (example)

* 10 minutes
* 20 minutes
* 30 minutes
* 1 hour
* custom

This value becomes a **hard filter** for tasks.

---

## Step 2 — Priori Engine ranking

The Priori Engine ranks tasks using:

Inputs:

* available time
* time of day
* context
* energy level
* priority
* due date
* snooze timestamp
* lastSuggestedAt

Tasks are filtered and scored.

---

## Step 3 — Task Suggestions

The system presents **Top N tasks (default 3)**.

These are the **most relevant tasks for the moment**.

---

# Context Carousel

The suggestions are organized in a **horizontal carousel**.

Each page represents a context.

---

### Page 1 — General

Top tasks from **all contexts**.

Example:

```
Good use of 20 minutes

• Reply to insurance email
• Water balcony plants
• Sketch new design idea
```

Actions available for each task:

* Start
* Snooze
* View details

---

### Page 2+ — Context Pages

Examples:

Home

```
• Fix bathroom light
• Declutter kitchen drawer
• Order air filter
```

Creativity

```
• Sketch clothing pattern
• Draft blog idea
• Organize inspiration folder
```

Users can scroll between contexts.

---

# Task Actions

Each suggested task supports three actions.

---

## 1. Start Task

User selects a task to begin.

Task detail view opens.

Possible actions:

* mark complete
* view subtasks
* edit task
* abandon

---

## 2. Mark Done

When the user finishes a task:

Task state becomes:

```
done
```

Effects:

* removed from ranking
* parent task progress updated
* optional reward/feedback (future feature)

---

## 3. Snooze Task

Snoozing removes the task temporarily from suggestions.

This happens when:

* the user taps **snooze**
* the user taps **refresh suggestions**

Both actions trigger the same mechanism.

### Snooze behavior

See `ARCHITECTURE.md` § Task status for the canonical field-level mechanism (this doc's description matches it: `lastSuggestedAt = now`, suppressed via the recurrence-based window, default 24h).

This prevents repetition fatigue.

---

# Refresh Suggestions

When the user presses **Refresh Suggestions**:

The system treats the current suggestions as **implicitly snoozed**.

Then:

1. Those tasks are temporarily suppressed
2. The Priori Engine reruns ranking
3. A new set of tasks is presented

This allows users to quickly explore alternative options.

---

# Task Detail View

When opening a task:

Information displayed:

* task title
* context(s)
* priority
* estimated duration
* energy requirement
* due date
* subtasks

Possible actions:

* mark done
* edit
* add subtask
* snooze

---

# Subtasks

Tasks may contain subtasks.

Rules:

* max depth: **3–4 levels**
* subtasks inherit context and priority by default
* subtasks can override fields

When a subtask is completed:

The Priori Engine may slightly **increase priority of the next subtask** to encourage task flow.

---

# Task Priority System

User inputs priority on a **1–10 scale**.

Meaning:

| Priority | Meaning                  |
| -------- | ------------------------ |
| 1        | Hard due date (required) |
| 2–4      | Short term (days)        |
| 5–7      | Medium term (weeks)      |
| 8–9      | Long term (months)       |
| 10       | Ongoing / recurring      |

Internally the engine may convert this into **a continuous score**.

---

# Task State

Each task has a simple state:

```
pending
done
```

Snoozing does **not create a new state**.

It is expressed through timestamps.

---

# Ranking Inputs

The ranking algorithm considers:

* priority
* due date proximity
* task duration
* available time
* time of day
* context filter
* energy match
* subtask flow boost
* snooze timestamps
* lastSuggestedAt

---

# Items Explicitly Excluded from MVP

These features are intentionally postponed.

### Collaboration

* shared tasks
* team workflows
* task assignment

---

### External dependencies

* waiting for other people
* approval tasks
* communication workflows

---

### Advanced automation

* automatic task splitting
* AI task rewriting
* calendar integration

---

### Recurrence system

Currently simplified.

Default:

```
weekly recurrence
```

Full recurrence logic postponed.

---

### Adaptive learning

Future system could:

* learn user behavior
* adjust ranking weights
* predict optimal task timing

---

# UX Elements Not Covered Yet

The following UX components are acknowledged but not designed yet.

* user signup
* onboarding flow
* context creation UI
* task capture interface
* subtask editing interface
* snooze UI controls
* task detail layout
* notifications
* reminders
* daily review screen
* task history
* productivity statistics
* reward / progress system
* theme and visual design
* accessibility
* offline support
* mobile vs desktop UX differences

---

# Suggested Next Steps

1. Define **task JSON schema**
2. Design **Priori Engine ranking algorithm**
3. Create **sample dataset**
4. Implement **CLI ranking prototype**
5. Test scoring behavior
6. Validate UX with simulated workflows
7. Build **local prototype UI**
8. Iterate ranking weights
