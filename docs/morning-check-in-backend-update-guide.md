# Morning Check-In Backend Update Guide

This guide describes the backend work needed to support the frontend route `/check-ins/morning`.

## Endpoint

Add an authenticated scholar-only endpoint:

```http
POST /check-ins/morning
Content-Type: application/json
Authorization: Bearer <token>
```

The endpoint should create or update the current user's morning check-in for the active challenge day. If duplicate submissions are not allowed, return `409 Conflict` when a completed morning check-in already exists.

## Request body

```json
{
  "kind": "morning",
  "confidence": 7,
  "goal": 3,
  "needSupport": true,
  "obstacle": "Afternoon lab schedule may reduce study time.",
  "supportCategory": "Time management",
  "supportDescription": "Help me sequence capsules around lab blocks."
}
```

## Validation rules

| Field                | Required    | Rules                                                                                                                                  |
| -------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`               | Yes         | Must be `morning` or inferred as `morning` by the endpoint.                                                                            |
| `confidence`         | Yes         | Integer from `1` to `10`. Labels shown in the frontend are `1: Very low`, `5: Moderate`, and `10: Very high`.                          |
| `goal`               | Yes         | Integer within the scholar's allowed capsule target for the active day. Return the allowed min/max in validation errors when rejected. |
| `needSupport`        | Yes         | Boolean.                                                                                                                               |
| `obstacle`           | No          | String, maximum `500` characters.                                                                                                      |
| `supportCategory`    | Conditional | Required when `needSupport` is `true`; must be one of the allowed categories below. Null/empty when support is not needed.             |
| `supportDescription` | Conditional | Optional when `needSupport` is `true`; string, maximum `500` characters. Empty when support is not needed.                             |

Allowed `supportCategory` values:

- `Academic`
- `Technical`
- `Time management`
- `Motivation`
- `Personal`
- `Other`

## Successful response

Return `201 Created` for a new check-in or `200 OK` for an idempotent update.

```json
{
  "id": "checkin_123",
  "kind": "morning",
  "status": "complete",
  "studyPlanReady": true,
  "message": "Morning check-in complete. Your study plan is ready."
}
```

The frontend displays the success text `Morning check-in complete. Your study plan is ready.` after any 2xx response.

## Side effects

When `needSupport` is `true`, create or link a support request with:

- scholar id
- active challenge day / cohort context
- category
- description
- obstacle text, if provided
- source: `morning_check_in`

The response does not need to include the support request, but logging the created support request id is recommended.

## Draft support

The frontend currently hides **Save and Return Later** because draft persistence is not implemented. To enable drafts later, add endpoints such as:

- `PUT /check-ins/morning/draft`
- `GET /check-ins/morning/draft`
- `DELETE /check-ins/morning/draft`

Return a feature flag or profile capability, for example `checkInDraftsSupported: true`, before exposing the draft button in the UI.

## Error format

Use the shared API error envelope already used by the application. Include field-level errors for validation failures so the frontend can map backend messages to controls in a future enhancement.
