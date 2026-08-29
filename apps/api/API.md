# Priori API

Base URL: `http://localhost:3001`

`POST /api/rank` reads tasks from `PRIORI_TASKS_PATH` (env var, defaults to the engine's sample file). All other endpoints read from and write to the PostgreSQL database (`DATABASE_URL`).

---

## POST /api/rank

Rank tasks against the given runtime parameters. Returns the top results, or an in-progress block if a task is already active.

**Request body**

```json
{
  "availableTime": 30,
  "energyLevel": "medium",
  "context": "admin",
  "location": "home",
  "explain": true,
  "limit": 3
}
```

| Field           | Type                                    | Required | Default |
|-----------------|-----------------------------------------|----------|---------|
| `availableTime` | number (minutes)                        | yes      | —       |
| `energyLevel`   | `"low"` `"medium"` `"high"`             | yes      | —       |
| `context`       | string                                  | no       | all     |
| `location`      | `"home"` `"in-person"` `"anywhere"`     | no       | all     |
| `explain`       | boolean                                 | no       | false   |
| `limit`         | number                                  | no       | 3       |

**Response — recommendations**

```json
{
  "mode": "recommendations",
  "top": [
    {
      "task": { "id": "t1", "title": "Pay utility bill", "duration": 15, "energyRequired": "low", "location": "home", "contexts": ["admin"], "priority": 2 },
      "breakdown": { "priorityScore": 9, "urgencyScore": 1.25, "energyScore": 2, "durationScore": 2, "flowBonus": 0, "suggestionPenalty": 0, "totalScore": 14.25, "reasons": ["priority weighting", "urgency aging", "energy fit", "duration fit"] }
    }
  ],
  "exclusions": []
}
```

**Response — in-progress block**

```json
{
  "mode": "in_progress_block",
  "top": [],
  "inProgressTask": { "id": "t2", "title": "Write design doc", "duration": 60, "energyRequired": "high", "location": "anywhere", "contexts": ["creativity"] },
  "exclusions": []
}
```

**curl example**

```bash
curl -s -X POST http://localhost:3001/api/rank \
  -H "Content-Type: application/json" \
  -d '{"availableTime": 30, "energyLevel": "medium", "explain": true}' | jq
```

---

## GET /api/tasks

Returns all tasks for the dev user as a flat array of DB rows.

**Response**

```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "parentId": "uuid | null",
    "contextId": "uuid | null",
    "title": "Pay utility bill",
    "priority": 2,
    "priorityUpdatedAt": "2024-01-01T00:00:00.000Z",
    "dueDate": null,
    "duration": 15,
    "energyRequired": "low",
    "location": "home",
    "status": "pending",
    "lastSuggestedAt": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**curl example**

```bash
curl -s http://localhost:3001/api/tasks | jq
```

---

## POST /api/tasks

Insert a new task for the dev user. The `id` is client-generated.

**Request body**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "parentId": null,
  "contextId": "uuid",
  "title": "Write release notes",
  "priority": 3,
  "dueDate": null,
  "duration": 20,
  "energyRequired": "medium",
  "location": "anywhere"
}
```

| Field           | Type                                    | Required | Default      |
|-----------------|-----------------------------------------|----------|--------------|
| `id`            | UUID string (client-generated)          | yes      | —            |
| `parentId`      | UUID string                             | no       | null         |
| `contextId`     | UUID string                             | no       | null         |
| `title`         | string                                  | yes      | —            |
| `priority`      | integer (1–10)                          | yes      | —            |
| `dueDate`       | ISO 8601 timestamp                      | no       | null         |
| `duration`      | integer (minutes)                       | yes      | —            |
| `energyRequired`| `"low"` `"medium"` `"high"`             | yes      | —            |
| `location`      | `"home"` `"in-person"` `"anywhere"`     | no       | `"anywhere"` |

**Response** — `201 Created`, the inserted task row (same shape as `GET /api/tasks` items).

Returns `400` if `title` is missing, empty, or whitespace-only.

**curl example**

```bash
curl -s -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Write release notes",
    "priority": 3,
    "duration": 20,
    "energyRequired": "medium",
    "location": "anywhere"
  }' | jq
```

---

## GET /api/contexts

Returns all contexts for the dev user.

**Response**

```json
[
  { "id": "uuid", "userId": "uuid", "name": "Learning", "createdAt": "2024-01-01T00:00:00.000Z" },
  { "id": "uuid", "userId": "uuid", "name": "Creativity", "createdAt": "2024-01-01T00:00:00.000Z" }
]
```

**curl example**

```bash
curl -s http://localhost:3001/api/contexts | jq
```

---

## POST /api/contexts

Create a new context for the dev user. Returns `409` if the name already exists for this user.

**Request body**

```json
{ "name": "Deep Work" }
```

| Field  | Type   | Required |
|--------|--------|----------|
| `name` | string | yes      |

**Response** — `201 Created`, the inserted context row.

**curl example**

```bash
curl -s -X POST http://localhost:3001/api/contexts \
  -H "Content-Type: application/json" \
  -d '{"name": "Deep Work"}' | jq
```

---

## POST /api/tasks/:id/split

Atomically splits a task into a parent/sibling structure:

1. Creates a new parent task with `{ title }` from the request body, inheriting all other fields (priority, duration, energyRequired, location, contextId) from the original task.
2. Re-parents the original task under the new parent.
3. Creates a blank sibling task under the new parent (inherits same fields; title is `""`).

Returns `400` if `title` is missing, empty, or whitespace-only. Returns `404` if the task id does not exist.

**Request body**

```json
{ "title": "Prepare for product review" }
```

| Field   | Type   | Required |
|---------|--------|----------|
| `title` | string | yes      |

**Response** — `200 OK`

```json
{
  "parent":   { "id": "uuid", "title": "Prepare for product review", ... },
  "original": { "id": "uuid", "title": "Write release notes", "parentId": "<new parent id>", ... },
  "sibling":  { "id": "uuid", "title": "", "parentId": "<new parent id>", ... }
}
```

Each object is a full task row (same shape as `GET /api/tasks` items).

**curl example**

```bash
curl -s -X POST http://localhost:3001/api/tasks/550e8400-e29b-41d4-a716-446655440000/split \
  -H "Content-Type: application/json" \
  -d '{"title": "Prepare for product review"}' | jq
```
