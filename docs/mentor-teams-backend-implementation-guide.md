# Mentor teams backend implementation guide

This contract powers the mentor team list at `GET /api/v1/mentor/teams` and its links to `GET /api/v1/mentor/teams/{teamId}`. The list is a mentor-scoped operational view: the server, not the browser, must decide which teams the caller may see.

## Authentication and authorization

- Require a valid access token and the `mentor.teams.read` permission.
- Return only teams assigned to the authenticated mentor. Administrators may receive all teams only when their role policy explicitly grants that scope.
- Apply the same scope check to the detail endpoint; knowing a team ID must not grant access.
- Use `401` for a missing or invalid session and `403` for a valid user without permission. Do not expose whether an out-of-scope team exists; return `404` from the detail endpoint.

## List endpoint

`GET /api/v1/mentor/teams?q=&status=active&page=1&pageSize=24`

The current UI filters the loaded page locally, but accepting `q` now allows server-side search when the data set grows. Sort results by case-insensitive `name`, then `id`, so pagination is deterministic.

### Successful response (`200`)

```json
{
  "items": [
    {
      "id": "foundations-cohort",
      "name": "Foundations cohort",
      "description": "Learners starting the Block Zero challenge.",
      "status": "active",
      "memberCount": 12,
      "needsAttentionCount": 2,
      "challengeId": "block-zero-21-day-medical-exam-prep",
      "challengeName": "21-day medical exam prep"
    }
  ],
  "page": 1,
  "pageSize": 24,
  "total": 1
}
```

### Field rules

| Field                 | Type    | Required | Rule                                                                            |
| --------------------- | ------- | -------- | ------------------------------------------------------------------------------- |
| `id`                  | string  | yes      | Stable opaque identifier used in the detail URL; never recycle it.              |
| `name`                | string  | yes      | Trimmed, 1–120 characters.                                                      |
| `description`         | string  | no       | Plain text, maximum 280 characters.                                             |
| `status`              | enum    | yes      | `active`, `paused`, or `archived`.                                              |
| `memberCount`         | integer | yes      | Non-negative count of current scholar memberships.                              |
| `needsAttentionCount` | integer | yes      | Non-negative subset requiring mentor follow-up.                                 |
| `challengeId`         | string  | no       | Current challenge identifier. Omit both challenge fields when none is assigned. |
| `challengeName`       | string  | no       | Human-readable current challenge name.                                          |

Return `{ "items": [], "page": 1, "pageSize": 24, "total": 0 }` when the mentor has no assignments. Do not use `404` for an empty collection. The UI temporarily accepts bare arrays and the aliases `teams`, `data`, or `results`, but `items` is the canonical contract.

## Detail endpoint

`GET /api/v1/mentor/teams/{teamId}` should return the same summary fields plus a `members` array. Each member needs a stable `id`, display name, current progress, last activity time, and attention reason where applicable. Use ISO 8601 UTC timestamps and integer percentages from 0 through 100. Keep personally sensitive fields out of the payload unless the mentor workflow requires them.

## Error envelope

All non-2xx responses should use one predictable shape:

```json
{
  "error": {
    "code": "MENTOR_TEAMS_UNAVAILABLE",
    "message": "Mentor teams could not be loaded.",
    "requestId": "req_01K..."
  }
}
```

Messages may be displayed to the user, so keep them safe and actionable. Log stack traces server-side against `requestId`; never return them to the client. Recommended codes are `VALIDATION_ERROR` (`400`), `UNAUTHENTICATED` (`401`), `FORBIDDEN` (`403`), `TEAM_NOT_FOUND` (`404`), and `MENTOR_TEAMS_UNAVAILABLE` (`503`).

## Query and performance guidance

1. Resolve the caller and authorized team IDs before querying summaries.
2. Aggregate membership and attention counts in the database; avoid one query per team.
3. Index mentor assignments by `(mentor_id, team_id)`, memberships by `(team_id, status)`, and attention records by `(team_id, resolved_at)`.
4. Enforce `pageSize` between 1 and 100 and reject malformed parameters with `400`.
5. Set `Cache-Control: private, max-age=30` only if cache keys include the authenticated identity; otherwise use `no-store`.

## Acceptance checklist

- A mentor sees only assigned teams and can open every returned `id`.
- Counts agree with the detail endpoint and never become negative or `null`.
- Empty assignments return `200` with an empty `items` array.
- Archived and cross-tenant IDs cannot be enumerated through the detail route.
- Search is case-insensitive, pagination is deterministic, and duplicate teams never appear.
- Contract tests cover `200`, empty `200`, `400`, `401`, `403`, `404`, and dependency-failure `503` responses.
