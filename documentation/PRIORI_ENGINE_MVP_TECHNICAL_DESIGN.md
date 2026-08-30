# Priori Engine — MVP Technical Design

## 1. Overview
The goal of this system is to create a task recommendation engine that selects the most relevant tasks for the current moment (default: top 3).

Unlike traditional task managers, this system does not simply list tasks. Instead, it ranks tasks dynamically based on contextual inputs and task metadata.

The system reads a JSON task file, evaluates tasks against runtime parameters, and returns the top N recommended tasks (default: 3).

Initial design goals:
- Minimal user input
- Minimal data structure
- Explainable ranking
- Deterministic behavior
- Easy local experimentation

The MVP is intended to run locally as a command-line tool.

## 2. Core Concepts

### 2.1 Atomic Tasks
The ranking engine evaluates atomic tasks.
A task may belong to a project or be a subtask of another task, but the ranking algorithm treats each leaf task independently.

### 2.2 Task Tree
Tasks may form a hierarchical structure.

Example:
```
Project: Garden Cleanup
    ├── Trim roses
    ├── Pull weeds
    └── Water plants
```

Rules:
- MVP input format is nested task tree with `children`
- Tasks may have a `parentId`
- Maximum depth: 3-4 levels
- Only leaf tasks are eligible for ranking
- Parent tasks serve mainly as grouping containers
- Subtasks may inherit properties from parent tasks if fields are not defined locally

Example inherited properties:
- `contexts`
- `projectId`
- `energyRequired`

### 2.3 Priority Model
User input priority scale:
- `1` - strict due date
- `2-9` - loose time horizon
- `10` - ongoing / recurring

Rules:
- Priority `1` requires:
  - `dueDate`
- Priority `10` requires:
  - `recurrence`
- All tasks include:
  - `priorityUpdatedAt`

This timestamp represents the last time the task priority was set.
The ranking algorithm uses this timestamp to calculate urgency aging.

> **Superseded:** snoozing does not touch `priorityUpdatedAt`. See `ARCHITECTURE.md` § Task status for the implemented snooze mechanism.

### 2.4 Context
Context defines where or how a task can be executed.

Initial MVP context options:
- `learning`
- `garden`
- `bureaucracy`
- `creativity`
- `home`
- `health`
- `fitness`
- `errands`
- `phone`
- `computer`

Tasks may have multiple contexts.

Example:
```json
contexts: ["home", "computer"]
```

Context behavior:
- Context matching is a hard filter
- Tasks without matching context are excluded
- Context filtering may be disabled to show all tasks
- Context values are normalized by trimming and lowercasing

### 2.5 Energy Requirement
Each task may specify required energy level:
- `low`
- `medium`
- `high`

Runtime input includes the user's current energy level.
Energy mismatch causes a score penalty.

### 2.6 Task Duration
Each task includes an estimated duration in minutes.

Example:
```json
duration: 15
```

Duration is compared against:
- `availableTime`

Tasks that exceed the available time receive a ranking penalty.

### 2.7 Flow Bonus
When a task is completed, tasks within the same project receive a flow bonus.

Purpose:
- Encourage completing related tasks in sequence
- Support momentum within a project

Flow is implemented using:
- `projectId`

If the last completed task belongs to project X:
- tasks in project X receive score bonus

### 2.8 Suggestion History
To avoid repeated recommendations, each task includes:
- `lastSuggestedAt`

Recently suggested tasks receive a temporary penalty.

## 3. System Architecture (MVP)
The MVP architecture is intentionally simple.

```
tasks.json
     |
     v
Task Loader
     |
     v
Task Normalizer
     |
     v
Ranking Engine
     |
     v
Top 3 Tasks
```

### 3.1 Task Loader
Responsibilities:
- Read tasks JSON file
- Parse task tree
- Flatten into a list of atomic tasks

Output:
- `List<Task>`

### 3.2 Task Normalizer
Responsibilities:
- Apply inherited properties from parent tasks
- Validate required fields
- Filter completed tasks
- Preserve `in_progress` tasks for active-session detection

Output:
- `NormalizedTask[]`

### 3.3 Ranking Engine
The ranking engine calculates a score for each task.

Inputs:
- `tasks`
- `currentTime`
- `context`
- `availableTime`
- `energyLevel`
- `explain` (optional)

Output:
- Top N ranked tasks (default: 3)
- Or an `in_progress` block response when any active task exists

## 4. Data Structures

### 4.1 Task Object
Example structure:
```json
{
  "id": "task_1",
  "title": "Water plants",
  "priority": 4,
  "priorityUpdatedAt": "2026-04-15T10:00:00Z",
  "dueDate": null,
  "duration": 10,
  "energyRequired": "low",
  "contexts": ["garden"],
  "projectId": "garden_maintenance",
  "parentId": null,
  "status": "pending",
  "createdAt": "2026-04-01T09:00:00Z",
  "lastSuggestedAt": null
}
```

Supported status values:
- `pending`
- `in_progress`
- `completed`

### 4.2 Runtime Input Parameters
Example runtime configuration:
- `currentTime`
- `context`
- `availableTime`
- `energyLevel`
- `limit` (default: `3`)
- `explain`

Example CLI simulation:
```bash
rankTasks \
  --context garden \
  --available-time 20 \
  --energy medium \
  --limit 3 \
  --explain
```

## 5. Ranking Algorithm
Each task receives a composite score.

```
score =
priorityScore
+ urgencyScore
+ contextScore
+ energyScore
+ durationScore
+ flowBonus
+ suggestionPenalty
```

### 5.1 Priority Score
Priority is inverted:

```
priorityScore = (11 - priority) * weight
```

Higher priority -> higher score.

### 5.2 Urgency Aging
Tasks become gradually more urgent based on:
- `daysSincePriorityUpdate`

Example:
```
urgencyScore = daysSinceUpdate * urgencyWeight
```

This allows tasks to resurface naturally.

### 5.3 Context Score
If context filtering is enabled:

```text
if context ∉ task.contexts
    exclude task
```

If disabled:

```text
contextScore = 0
```

### 5.4 Energy Matching
Example scoring:
- exact match -> `+2`
- 1 level difference -> `+1`
- 2 levels difference -> `0`

### 5.5 Duration Fit
Example:

```text
if duration <= availableTime
    durationScore = +2
else
    durationScore = -2
```

### 5.6 Flow Bonus
If `task.projectId == lastCompletedProject`:

```text
flowBonus = +1.5
```

### 5.7 Suggestion Penalty
If a task was recently suggested:

```text
recentSuggestionPenalty = -1
```

This discourages repeated recommendations.
Default recency window is 24 hours for non-recurring tasks.
For recurring tasks, the recency window equals the recurrence timeframe (for example, weekly recurrence uses a 7-day window).

## 6. Output Format
Basic output:
1. Water plants
2. Practice French
3. Trim basil

If no tasks are eligible, the CLI should suggest adding new tasks or changing context.

If an `in_progress` task exists, ranking is paused and CLI output switches to active-task mode:

```text
Task in progress: Finish draft design doc
Choose next action: done | snooze | edit | dismiss
Ranking paused until in-progress task is resolved.
```

With explanation:
1. Water plants
   score: 8.4

   + context match
   + duration fit
   + urgency aging

## 7. Items Explicitly Excluded From the MVP
The following features are intentionally excluded to keep the initial system simple.
- Intelligent task splitting (detecting tasks that should be broken down)
- Adaptive learning (automatically adjusting scoring weights based on behavior)
- Calendar integration (no external time scheduling)
- Automatic energy detection (energy level will be manually provided)
- Machine learning recommendations (deterministic scoring only)
- Dependency graphs (tasks will not block other tasks)
- Collaborative tasks (tasks involving other people are excluded)

## 8. User Experience Components Not Addressed Yet
The MVP focuses solely on ranking logic.

The following UX components are not implemented:
- User signup
- User profile creation
- Energy profile configuration
- Task creation interface
- Task editing
- Task deletion
- Snooze interaction
- Mark task as complete
- Recurring task configuration
- Task splitting suggestions
- Project management interface
- Context management interface
- Notification system
- Mobile or web UI
- Syncing or cloud storage
- Multi-device support
- Task import/export tools

## 9. Suggested Next Steps
1. Implement Local Prototype
   Create a local script that:
   - reads `tasks.json`
   - runs ranking algorithm
   - prints top 3 tasks

   Preferred languages:
   - Node.js
   - Python

2. Create Test Task Sets
   Build multiple JSON datasets to simulate:
   - morning routines
   - home maintenance
   - creative work
   - learning tasks

   This will help tune scoring weights.

3. Tune Ranking Weights
   Adjust weights for:
   - priority
   - urgency aging
   - energy match
   - duration fit
   - flow bonus

   Goal: produce recommendations that feel intuitively correct.
   Weights are intentionally tentative in the MVP and expected to be refined iteratively.

4. Add Explainability Tools
   Allow toggling explanation mode to debug ranking behavior.

5. Evaluate Behavior in Real Use
   Use the system for several weeks and observe:
   - whether the top 3 feel correct
   - whether tasks resurface appropriately
   - whether flow bonuses help momentum

6. Define Future UX
   Once the ranking engine feels reliable, design the UI for:
   - task input
   - top 3 dashboard
   - task flow view

