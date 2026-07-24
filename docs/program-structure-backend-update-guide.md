# Program Structure backend update guide

The frontend route `/challenge` redirects to `/challenge/program` and renders the Program Structure screen. It can currently build a safe static 21-day plan from dashboard progress, but the backend should expose a dedicated program endpoint so statuses, completion, locks, daily targets, and phase totals match each scholar's cohort and enrollment.

## Endpoint

```http
GET /challenges/current/program
```

Return the authenticated scholar's active 21-day program structure. The response should already be adjusted for the scholar's cohort timezone, release schedule, enrollment state, extensions, missed days, and completed work.

## Response shape

```json
{
  "challengeId": "block-zero-21-day",
  "challengeName": "Block Zero Ready",
  "currentDay": 7,
  "overallCompletion": 34,
  "timezone": "America/New_York",
  "phases": [
    {
      "id": "knowledge-mastery",
      "title": "Knowledge mastery",
      "dayStart": 1,
      "dayEnd": 14,
      "completionPercent": 43,
      "metrics": ["Learning-pack count", "Question count", "Daily target"]
    }
  ],
  "days": [
    {
      "dayNumber": 1,
      "activityType": "Knowledge mastery",
      "status": "Completed",
      "completionPercent": 100,
      "locked": false,
      "learningPackCount": 3,
      "questionCount": 60,
      "dailyTarget": "3 learning packs • 60 questions",
      "focus": ["Knowledge mastery", "Learning-pack count", "Question count", "Daily target"],
      "availableAtUtc": "2026-07-01T04:00:00.000Z",
      "completedAtUtc": "2026-07-01T21:14:00.000Z"
    }
  ]
}
```

## Required timeline

| Days  | Activity type        | Required frontend content                                                                                 |
| ----- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| 1–14  | `Knowledge mastery`  | Learning-pack count, question count, and daily target.                                                    |
| 15–18 | `Clinical scenarios` | Scenario volume by day. Recommended volumes are 10, 20, 40, and 60 scenarios for Days 15, 16, 17, and 18. |
| 19–20 | `Rehearsal`          | Weak-topic review and marked questions.                                                                   |
| 21    | `Rest`               | Rest, exam preparation, and final readiness.                                                              |

## Day card contract

Each item in `days` should include:

| Field               | Type                   | Notes                                                                     |
| ------------------- | ---------------------- | ------------------------------------------------------------------------- |
| `dayNumber`         | integer                | 1 through 21.                                                             |
| `activityType`      | string                 | One of `Knowledge mastery`, `Clinical scenarios`, `Rehearsal`, or `Rest`. |
| `status`            | string                 | One of the status values below.                                           |
| `completionPercent` | integer                | 0–100, rounded for display.                                               |
| `locked`            | boolean                | `true` when the day is not yet released for the scholar.                  |
| `dailyTarget`       | string                 | Short display label for the card.                                         |
| `learningPackCount` | integer, optional      | Required for Days 1–14.                                                   |
| `questionCount`     | integer, optional      | Required for Days 1–14.                                                   |
| `scenarioVolume`    | integer, optional      | Required for Days 15–18.                                                  |
| `focus`             | string[]               | Display bullets for the day.                                              |
| `availableAtUtc`    | ISO datetime, optional | Release timestamp used for lock calculations.                             |
| `completedAtUtc`    | ISO datetime, optional | Present when the day is complete.                                         |

## Status values

Use only these exact values so the frontend can style and filter consistently:

- `Upcoming`
- `Available`
- `In Progress`
- `Completed`
- `Missed`
- `Rest Day`

Recommended status rules:

1. `Completed`: completion is 100% or the day completion event exists.
2. `Missed`: the day is before the cohort-local current day and is not complete.
3. `In Progress`: the day is the current released day and completion is greater than 0% but less than 100%.
4. `Available`: the day is the current released day with 0% completion.
5. `Upcoming`: the day is after the current day or is unreleased.
6. `Rest Day`: Day 21, unless the product later needs a separate completed-rest state.

## Implementation notes

1. Derive `currentDay` from the active enrollment, cohort start date, and cohort timezone.
2. Calculate locks from release timestamps, not the client clock.
3. Join knowledge-pack assignments and question progress for Days 1–14.
4. Join clinical scenario assignments and scenario-attempt progress for Days 15–18.
5. Join weak-topic and marked-question review queues for Days 19–20.
6. Return Day 21 rest, exam preparation, and final readiness guidance even when no study workload is assigned.
7. Keep `/challenges/current/today` focused on the current day; use `/challenges/current/program` for the complete 21-day structure.
