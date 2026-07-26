# Content review backend update guide

The Angular review queues consume complete review workflow records from `GET /review/content`. The endpoint must not return only the nested authored content: the review record ID is the route key used by the **Review content** action, while status and entity metadata drive queue triage.

## List contract

Return `200 OK` with either the preferred envelope below or, during migration, the same review records as a top-level array:

```json
{
  "data": [
    {
      "id": "review-LP01-C01-Q01",
      "entityType": "question",
      "entityId": "LP01-C01-Q01",
      "status": "draft",
      "title": "Which component carries the core meaning related to the heart?",
      "notes": null,
      "reviewerId": null,
      "reviewedAtUtc": null,
      "content": {
        "id": "LP01-C01-Q01",
        "externalId": "LP01-C01-Q01",
        "learningPackId": "LP01-MEDTERM-FOUNDATIONS",
        "capsuleId": "LP01-C01",
        "type": "SingleChoice",
        "difficulty": "foundational",
        "sequence": 1,
        "stem": "Which component carries the core meaning related to the heart?",
        "choices": [
          { "id": "A", "label": "A", "text": "cardi" },
          { "id": "B", "label": "B", "text": "o" }
        ],
        "explanation": {
          "correctChoiceId": "a",
          "correctRationale": "The root cardi means heart."
        }
      },
      "importAudit": {
        "sourceFileName": "medical-terminology.json",
        "importedBy": "user-id",
        "importedAtUtc": "2026-07-26T12:00:00Z"
      }
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

`data` must always be an array; return an empty array when there is no work. `total` and `nextCursor` are optional. Keep `correctChoiceId` stable and compare it case-insensitively to choice IDs. The frontend accepts optional import audit fields but exposes only `sourceFileName` in the queue.

## Detail and workflow endpoints

The queue links to `/review/content/{reviewRecordId}` using the review record `id`, not `entityId` or `content.id`. Implement these authenticated endpoints with either a direct review record response or `{ "data": reviewRecord }`:

- `GET /review/content/{reviewRecordId}`
- `POST /review/content/{reviewRecordId}/approve`
- `POST /review/content/{reviewRecordId}/request-changes`
- `POST /review/content/{reviewRecordId}/reject`

Action requests use `{ "notes": "..." }`. Enforce valid status transitions and authorization on the server. Require `ContentReviewer`, `Administrator`, or `SuperAdministrator` plus the appropriate `content.read`/`content.review` permission. Return `404` for an unknown review record and `409` for a stale or invalid transition.

## Data assembly

Build each list item by joining the review-workflow row to the authored entity. Preserve the workflow `id`, `entityType`, `entityId`, `status`, `title`, notes, reviewer, and review time at the top level; place the authored question fields under `content`. If import provenance exists, map it under `importAudit`.

Do not flatten `content` into the list and do not synthesize labels such as `Review Item 1`. Do not require the queue to render raw HTML, media URLs, database versions, actor IDs, or timestamps. Those fields can remain available to an authorized detail/audit endpoint.

## Backend verification checklist

1. Contract-test both a populated response and `{ "data": [] }`.
2. Assert every item has a unique review record `id`, `entityType`, `entityId`, `status`, and `content` object.
3. Verify question choices and explanation data are returned to authorized reviewers only.
4. Verify mixed-case choice IDs (for example `A` and `a`) identify the same correct answer.
5. Verify each action loads and mutates by review record ID and rejects entity IDs used as route IDs.
6. Verify unauthorized roles receive `403`, missing authentication receives `401`, and error bodies follow the shared API error envelope.
7. Verify pagination preserves `total` and `nextCursor` when enabled.
