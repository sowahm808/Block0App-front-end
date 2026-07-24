# Check-In History Backend Update Guide

This guide describes backend work needed to support the frontend route `/check-ins/history`.

## Endpoint

`GET /check-ins/history`

Return the authenticated scholar's historical check-in records, filtered and sorted by date. Protect the endpoint with the same scholar authentication and authorization used by morning and evening check-ins.

## Query filters

Support these optional query parameters:

| Parameter          | Type                             | Behavior                                                                             |
| ------------------ | -------------------------------- | ------------------------------------------------------------------------------------ |
| `startDate`        | ISO date                         | Include records on or after this date.                                               |
| `endDate`          | ISO date                         | Include records on or before this date.                                              |
| `minConfidence`    | number 1-10                      | Include records where morning or evening confidence is at least this value.          |
| `maxConfidence`    | number 1-10                      | Include records where morning and evening confidence are no greater than this value. |
| `goalCompletion`   | `completed`, `partial`, `missed` | Include records with this goal result.                                               |
| `supportRequested` | boolean                          | Include records based on whether the scholar requested support.                      |

Return `400 Bad Request` for invalid date ranges, invalid confidence ranges, or unsupported enum values.

## Response contract

```json
{
  "items": [
    {
      "id": "checkin_2026_07_24",
      "date": "2026-07-24",
      "morningConfidence": 7,
      "eveningConfidence": 8,
      "capsuleGoal": "Complete cardiology capsules",
      "capsulesCompleted": 3,
      "goalResult": "completed",
      "studyMinutes": 95,
      "supportRequested": false
    }
  ],
  "summary": {
    "totalCheckIns": 1,
    "averageMorningConfidence": 7,
    "averageEveningConfidence": 8,
    "totalStudyMinutes": 95,
    "goalCompletionRate": 1
  }
}
```

## Field guidance

- `date`: Cohort-local check-in date, not server UTC timestamp.
- `morningConfidence` and `eveningConfidence`: Nullable numbers from 1 through 10.
- `capsuleGoal`: The morning goal text or a normalized daily capsule goal label.
- `capsulesCompleted`: Count from the learning-progress source of record, not user-entered text.
- `goalResult`: Normalize to `completed`, `partial`, `missed`, or `not_set`.
- `studyMinutes`: Total tracked study time for the date.
- `supportRequested`: `true` when morning or evening check-in data indicates help was requested.

## Charts and table views

The frontend renders three charts from `items`, and every chart also renders a table view:

1. Confidence trend: average of available morning and evening confidence by date.
2. Study-time trend: `studyMinutes` by date.
3. Goal-completion trend: completed = 100, partial = 50, missed/not set = 0.

Keep `items` sorted ascending by `date` for consistent chart and table output. If the backend returns descending records, the frontend still sorts chart points, but cards should be returned in the desired display order.

## Implementation checklist

1. Add a history query/controller for `GET /check-ins/history`.
2. Join morning check-ins, evening check-ins, capsule completion/progress, study-session duration, and support-request signals by scholar and cohort-local date.
3. Apply all query filters before pagination or response limiting.
4. Compute the `summary` block from the filtered result set.
5. Add unit and integration tests for each filter, empty states, invalid ranges, and authenticated scholar scoping.
6. Confirm no other scholar's check-in records can be returned.
