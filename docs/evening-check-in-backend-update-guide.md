# Evening Check-In Backend Update Guide

This guide describes the backend work needed to support the frontend route `/check-ins/evening`.

## Required endpoints

Add authenticated scholar-only endpoints for the active scholar and cohort-local date.

```http
GET /check-ins/evening/summary
Authorization: Bearer <token>
```

```http
POST /check-ins/evening
Content-Type: application/json
Authorization: Bearer <token>
```

The `GET` endpoint supplies system-tracked values that the frontend renders as read-only. The `POST` endpoint creates or updates the evening check-in for the active challenge day. If duplicate completed submissions are not allowed, return `409 Conflict` when the scholar already has a completed evening check-in for the date.

## Read-only summary response

Do not ask the frontend or scholar to submit these values manually. They are already tracked by learning, question, study-time, and review workflows and should be queried by the backend.

```json
{
  "capsulesCompletedToday": 3,
  "questionsCompletedToday": 42,
  "studyTimeRecordedMinutes": 95,
  "questionsMarkedForReview": 6
}
```

| Field                      | Source guidance                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `capsulesCompletedToday`   | Count completed capsule records for the scholar on the cohort-local date.                          |
| `questionsCompletedToday`  | Count submitted/answered question attempts for the scholar on the cohort-local date.               |
| `studyTimeRecordedMinutes` | Sum recorded study sessions or capsule activity duration for the scholar on the cohort-local date. |
| `questionsMarkedForReview` | Count questions the scholar marked for review on the cohort-local date.                            |

Return zeros when the scholar has no tracked activity for a field. Avoid nulls unless the data source is unavailable; if unavailable, return a non-2xx error using the shared API error envelope so the UI can show a loading warning.

## Evening check-in request body

```json
{
  "kind": "evening",
  "confidence": 8,
  "goal": 4,
  "goalMet": "Partially",
  "supportGivenToday": 2,
  "supportReceivedToday": 1,
  "reflection": "I finished the highest-priority capsules but need to review renal questions tomorrow."
}
```

## Validation rules

| Field                  | Required | Rules                                                                                                                                       |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`                 | Yes      | Must be `evening` or inferred as `evening` by the endpoint.                                                                                 |
| `confidence`           | Yes      | Integer from `1` to `10`.                                                                                                                   |
| `goalMet`              | Yes      | Must be one of `Yes`, `Partially`, or `No`.                                                                                                 |
| `supportGivenToday`    | No       | Integer `0` or greater when supplied. Treat omitted as `0` or unknown according to backend analytics needs.                                 |
| `supportReceivedToday` | No       | Integer `0` or greater when supplied. Treat omitted as `0` or unknown according to backend analytics needs.                                 |
| `goal`                 | Yes      | Integer within the scholar's allowed daily target range; stores tomorrow's goal. Return allowed min/max in validation errors when rejected. |
| `reflection`           | No       | String, maximum `500` characters.                                                                                                           |

## Successful response

Return `201 Created` for a new check-in or `200 OK` for an idempotent update.

```json
{
  "id": "checkin_456",
  "kind": "evening",
  "status": "complete",
  "message": "Evening check-in complete. See you tomorrow."
}
```

The frontend displays the success text `Evening check-in complete. See you tomorrow.` after any 2xx response.

## Important data-integrity correction

Completed capsules and completed questions are not part of the evening check-in request body. The backend should calculate them from system-of-record tables. Accepting manually entered counts would create conflicting progress data and should be rejected or ignored.

## Suggested implementation steps

1. Add an evening summary query that joins the scholar's active enrollment, cohort-local date, capsule completions, question attempts, study-time records, and review markers.
2. Add the `GET /check-ins/evening/summary` controller action and protect it with the same scholar authorization used by morning check-ins.
3. Add an evening check-in command/model with the writable fields only: confidence, goal outcome, support given/received, tomorrow goal, and reflection.
4. Add `POST /check-ins/evening` validation and persistence, keyed by scholar id plus active challenge day.
5. Ensure dashboard/today challenge completion flags resolve the evening check-in from persisted status.
6. Add tests proving manually supplied capsule/question completion counts are not required and are not persisted from the check-in request.

## Error format

Use the shared API error envelope already used by the application. Include field-level validation errors for `confidence`, `goalMet`, `goal`, and optional numeric support fields so the frontend can map backend messages to controls in a future enhancement.
