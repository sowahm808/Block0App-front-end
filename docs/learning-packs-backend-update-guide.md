# Learning Packs Backend Update Guide

The frontend route `/learning-packs` now renders a purpose-built Learning Packs list. Update the backend `GET /learning-packs` endpoint so authenticated scholars receive the fields needed for filters, status chips, progress metrics, permitted accuracy summaries, and pack actions.

## Route and auth

```http
GET /learning-packs?search=&topic=&status=&availability=&sort=
Authorization: Bearer <access token>
```

The current frontend can filter client-side from the returned array, but the backend should accept these optional query parameters as the dataset grows:

| Query parameter | Values                                                           | Behavior                                                   |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| `search`        | Text                                                             | Match pack code, title, topic, objective summary, or tags. |
| `topic`         | Topic slug or display value                                      | Return packs for one topic.                                |
| `status`        | `all`, `not_started`, `in_progress`, `completed`, `locked`       | Filter by scholar-specific progress state.                 |
| `availability`  | `all`, `available`, `locked`, `coming_soon`                      | Filter by release and assignment state.                    |
| `sort`          | `recommended`, `title`, `topic`, `progress_desc`, `progress_asc` | Sort consistently with frontend controls.                  |

## Response shape

Return a JSON array. Each item should represent one learning pack assigned or visible to the current scholar.

```json
[
  {
    "id": "lp_cardiology_day_01",
    "externalId": "cardiology-day-01",
    "code": "LP01",
    "title": "Cardiology Foundations",
    "topic": "Cardiology",
    "description": "Core high-yield rhythm, murmur, and medication review.",
    "objectivesSummary": "Identify unstable arrhythmias, match murmurs to maneuvers, and select first-line management.",
    "status": "in_progress",
    "progressStatus": "in_progress",
    "availability": "available",
    "availabilityStatus": "available",
    "estimatedMinutes": 45,
    "capsuleCount": 5,
    "totalCapsules": 5,
    "completedCapsules": 2,
    "questionCount": 20,
    "totalQuestions": 20,
    "completedQuestions": 8,
    "accuracyPermitted": true,
    "accuracyPercentage": 75,
    "progressPercentage": 40,
    "continueUrl": "/capsules/attempt-lp01-capsule-03"
  }
]
```

## Field contract

| Field                                 | Required       | Notes                                                                                           |
| ------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `id` or `externalId`                  | Yes            | Stable identifier used to build `/learning-packs/{id}` detail links.                            |
| `code`                                | Recommended    | Display code such as `LP01`. If absent, the frontend falls back to `externalId` or `dayNumber`. |
| `title`                               | Yes            | Card title.                                                                                     |
| `topic`                               | Yes            | Displayed on cards and used for the Topic filter.                                               |
| `description`                         | Recommended    | Fallback text if no objective summary exists.                                                   |
| `objectivesSummary`                   | Yes            | Short learning objectives summary for the card.                                                 |
| `status` / `progressStatus`           | Yes            | Use one of `not_started`, `in_progress`, `completed`, or `locked`.                              |
| `availability` / `availabilityStatus` | Yes            | Use `available`, `locked`, or `coming_soon`.                                                    |
| `capsuleCount` or `totalCapsules`     | Yes            | Total capsules in the pack.                                                                     |
| `completedCapsules`                   | Yes            | Scholar-specific completed capsules.                                                            |
| `questionCount` or `totalQuestions`   | Yes            | Total questions in the pack.                                                                    |
| `completedQuestions`                  | Yes            | Scholar-specific completed questions.                                                           |
| `accuracyPermitted`                   | Yes            | Set `false` when policy should hide accuracy.                                                   |
| `accuracyPercentage`                  | When permitted | Scholar-specific percent from answered questions.                                               |
| `progressPercentage`                  | Recommended    | 0–100 overall completion. Frontend can derive from capsule counts if absent.                    |
| `continueUrl`                         | When available | In-app URL for Start/Continue/Review actions.                                                   |

## Status derivation rules

1. Return `locked` when the scholar is not allowed to open the pack because of prerequisites, cohort release time, enrollment status, or role restrictions.
2. Return `completed` when all required capsules/questions in the pack are complete.
3. Return `in_progress` when at least one capsule or question has been started but the pack is not complete.
4. Return `not_started` for available assigned packs with no scholar attempts yet.

## Availability derivation rules

- `available`: the scholar can start, continue, review, or view the pack now.
- `locked`: the scholar cannot access the pack because prerequisites or permissions are missing.
- `coming_soon`: the pack is assigned but the release date is in the future.

## Accuracy policy

Only return an accuracy number when the current scholar is permitted to see it. If accuracy should be hidden until a minimum question count, until completion, or for locked packs, set `accuracyPermitted` to `false` and omit `accuracyPercentage`.

## Recommended implementation checklist

1. Join learning-pack assignments for the authenticated scholar, team, cohort, and challenge day.
2. Join capsule attempts and question attempts to calculate completed capsule count, completed question count, progress percentage, and accuracy.
3. Apply release/prerequisite rules before generating `status`, `availability`, and `continueUrl`.
4. Return a deterministic recommended order, usually current-day packs first, then in-progress packs, then upcoming packs.
5. Add backend tests for each filter value: `Not Started`, `In Progress`, `Completed`, `Locked`, and all availability states.
6. Seed at least four packs in non-production environments so the frontend can verify each action label: Start Pack, Continue Pack, Review Pack, and View Details.

# Learning Pack Detail Backend Update Guide

The frontend route `/learning-packs/:packId` now renders a dedicated Learning Pack Detail page. Update the backend so `GET /learning-packs/{packId}` returns one scholar-specific pack with header metadata, progress, information sections, summary metrics, capsule rows, and action URLs.

## Route and auth

```http
GET /learning-packs/{packId}
Authorization: Bearer <access token>
```

`packId` may be either the backend `id` or `externalId` that was returned by `GET /learning-packs`. Return `404` when the pack does not exist and `403` when it exists but is not visible to the current scholar.

## Response shape

```json
{
  "id": "lp_cardiology_day_01",
  "externalId": "cardiology-day-01",
  "code": "LP01",
  "title": "Cardiology Foundations",
  "topic": "Cardiology",
  "description": "Core high-yield rhythm, murmur, and medication review.",
  "summary": "This pack reviews core cardiology patterns through five short capsules and targeted questions.",
  "objectives": [
    "Identify unstable arrhythmias and immediate interventions.",
    "Match murmurs to maneuvers and lesion physiology.",
    "Select first-line medication management for common presentations."
  ],
  "objectivesSummary": "Identify arrhythmias, murmurs, and first-line management.",
  "status": "in_progress",
  "progressStatus": "in_progress",
  "availability": "available",
  "availabilityStatus": "available",
  "estimatedMinutes": 45,
  "estimatedStudyMinutes": 45,
  "capsuleCount": 5,
  "totalCapsules": 5,
  "completedCapsules": 2,
  "questionCount": 20,
  "totalQuestions": 20,
  "completedQuestions": 8,
  "questionsAnswered": 8,
  "progressPercentage": 40,
  "continueUrl": "/capsules/attempt-lp01-capsule-03",
  "activeCapsuleUrl": "/capsules/attempt-lp01-capsule-03",
  "nextCapsuleUrl": "/capsules/start/lp01-capsule-03",
  "capsules": [
    {
      "id": "lp01-capsule-01",
      "externalId": "cardiology-foundations-01",
      "capsuleNumber": 1,
      "sequence": 1,
      "title": "Unstable arrhythmias",
      "questionCount": 4,
      "totalQuestions": 4,
      "status": "completed",
      "progressStatus": "completed",
      "completedAtUtc": "2026-07-23T18:42:00Z",
      "startUrl": "/capsules/lp01-capsule-01",
      "continueUrl": "/capsules/attempt-lp01-capsule-01"
    }
  ]
}
```

## Detail field contract

| Field | Required | Notes |
| --- | --- | --- |
| `id` or `externalId` | Yes | Stable identifier used by `/learning-packs/:packId`. |
| `code` | Recommended | Header pack code, for example `LP01`. |
| `title` | Yes | Header pack title. |
| `topic` | Yes | Header topic label. |
| `progressPercentage` | Recommended | Header completion percentage. Frontend derives from capsule counts if absent. |
| `objectives` | Yes | Ordered objective list for the Learning objectives section. |
| `objectivesSummary` | Recommended | Fallback for list and search cards. |
| `summary` or `description` | Yes | Pack summary section text. |
| `capsuleCount` / `totalCapsules` | Yes | Total capsule summary metric. |
| `completedCapsules` | Yes | Scholar-specific completed capsule metric. |
| `questionCount` / `totalQuestions` | Yes | Total question summary metric. |
| `completedQuestions` or `questionsAnswered` | Yes | Scholar-specific questions answered metric. |
| `estimatedStudyMinutes` or `estimatedMinutes` | Yes | Estimated study time metric in minutes. |
| `continueUrl` | When available | General continue URL; used as fallback for active capsule actions. |
| `activeCapsuleUrl` | When in progress | Target for Continue Active Capsule. |
| `nextCapsuleUrl` | When available | Target for Start Next Capsule. |
| `capsules` | Yes | Ordered capsule row data for the capsule list. |

## Capsule field contract

| Field | Required | Notes |
| --- | --- | --- |
| `id` or `externalId` | Yes | Stable capsule identifier for fallback links. |
| `capsuleNumber` or `sequence` | Yes | Displayed as Capsule number and used for ordering. |
| `title` | Yes | Capsule row title. |
| `questionCount` or `totalQuestions` | Yes | Number of questions shown in the row. |
| `status` / `progressStatus` | Yes | Use `not_started`, `in_progress`, `completed`, or `locked`. |
| `completedAtUtc` or `completedAt` | When completed | Completion date shown in the row. Omit or null for incomplete capsules. |
| `startUrl` | When startable | URL for a not-started capsule. |
| `continueUrl` | When active/reviewable | URL for a started or completed capsule. |

## Detail implementation checklist

1. Authorize access against the authenticated scholar's assignments, cohort release rules, prerequisites, and role permissions before returning detail data.
2. Return capsules in ascending `sequence` order and ensure only one active capsule drives `activeCapsuleUrl`.
3. Calculate summary metrics from persisted capsule and question attempt state, not from client-submitted percentages.
4. Use UTC timestamps for `completedAtUtc`; the frontend can display the string until locale formatting is finalized.
5. Add backend tests for not-started, in-progress, completed, locked, missing, and unauthorized pack detail responses.
6. Keep list and detail field names aligned so the list page can link to the same `packId` accepted by the detail endpoint.
