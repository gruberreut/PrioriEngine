# Priori API

Base URL: `http://localhost:3001`

Tasks are loaded from `PRIORI_TASKS_PATH` (env var) or the engine's sample file by default.

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

| Field           | Type                          | Required | Default |
|-----------------|-------------------------------|----------|---------|
| `availableTime` | number (minutes)              | yes      | —       |
| `energyLevel`   | `"low"` `"medium"` `"high"`   | yes      | —       |
| `context`       | string                        | no       | all     |
| `location`      | `"home"` `"in-person"` `"anywhere"` | no | all |
| `explain`       | boolean                       | no       | false   |
| `limit`         | number                        | no       | 3       |

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

## GET /api/contexts

Returns the distinct context labels present in the loaded task file. Used to populate the context filter in the UI.

**Response**

```json
["admin", "creativity", "learning", "physical"]
```

**curl example**

```bash
curl -s http://localhost:3001/api/contexts | jq
```

---

## GET /api/tasks

Returns the raw task array as loaded from the task file (nested tree, unflattened).

**curl example**

```bash
curl -s http://localhost:3001/api/tasks | jq
```
