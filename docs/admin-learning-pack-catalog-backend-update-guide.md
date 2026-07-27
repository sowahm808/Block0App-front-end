# Admin learning-pack catalog backend update guide

The admin catalog at `/admin/learning-packs` now presents learning packs as operational content records rather than rendering arbitrary JSON. The backend should implement the contracts below so counts, publication state, duplicate identification, and assignment actions are reliable.

## Authorization

All endpoints require an authenticated `Administrator` or `SuperAdministrator`. Recommended granular permissions are `admin.learning-packs.read` for the catalog and details, `admin.learning-packs.assign` for assignments, and `admin.learning-packs.publish` for publication changes. Return `401` when authentication is absent and `403` when permission is insufficient.

## List catalog records

`GET /admin/learning-packs`

Supported query parameters should include `query`, `publicationStatus`, `cursor`, `limit`, and `sort`. The current UI can filter the returned page locally, while server-side filtering should be added for large catalogs.

```json
{
  "items": [
    {
      "id": "8f92ed54-85d8-47f7-b404-04e3f6e09a72",
      "externalId": "LP-CARDIO-01",
      "code": "CARDIO-FOUNDATIONS",
      "title": "Cardiovascular Foundations",
      "description": "Core cardiovascular concepts and clinical application.",
      "topic": "Cardiology",
      "audience": "Year 1",
      "publicationStatus": "published",
      "reviewStatus": "approved",
      "capsuleCount": 6,
      "questionCount": 48,
      "assignmentCount": 127,
      "updatedAtUtc": "2026-07-27T10:30:00Z"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

`id` is the immutable internal identifier used in URLs and mutations. `code` is the stable, human-readable catalog identifier and should be unique when possible. Always return aggregate counts; do not require the browser to download capsules, questions, or assignments to calculate them. `publicationStatus` should use a documented enum such as `draft`, `in_review`, `published`, or `archived`. Retaining both `id` and `externalId` is important for diagnosing imports and near-duplicate records.

For a transition period, the UI accepts either a bare array or an envelope with `items` or `data`. New implementations should return the `items` envelope.

## Assign a pack

`POST /admin/learning-packs/{learningPackId}/assignments`

```json
{ "scholarIds": ["scholar-123", "scholar-456"] }
```

```json
{ "assignedCount": 1, "skippedCount": 1 }
```

The operation should be transactional and idempotent for an existing `(learningPackId, scholarId)` pair. Validate that the pack exists and is assignable and that every supplied user is an eligible scholar. Return RFC 9457 problem details for validation failures, including field-level errors where possible. Record the acting administrator, timestamp, pack ID, scholar IDs, and result in the audit log. A successful response must make the updated `assignmentCount` visible on the next catalog request.

## Detail and publication workflow

The existing detail route uses `GET /admin/learning-packs/{learningPackId}`. It should return the catalog fields plus full objectives, capsule summaries, review history, and version metadata. Publication should be an explicit audited command, for example `POST /admin/learning-packs/{learningPackId}/publish`, protected by `admin.learning-packs.publish`; reject publication when required review or content validation is incomplete.

## Data and performance guidance

- Add indexes for publication status, normalized title/code search, and assignment foreign keys.
- Compute counts with grouped queries or maintained aggregates to avoid N+1 queries.
- Define duplicate detection around normalized title, code/external ID, and content fingerprint; expose a future `duplicateGroupId` if administrators need grouping rather than merely comparing IDs.
- Use cursor pagination with a deterministic secondary sort by `id`.
- Include a correlation/trace identifier in problem responses and never expose stack traces.

## Acceptance checklist

1. The list returns stable IDs, display metadata, publication state, and all three counts.
2. Duplicate-looking packs can be distinguished by code/external ID and record ID.
3. Assignment is authorized, validated, idempotent, audited, and reflected in the next list response.
4. Empty catalogs return `200` with `items: []`; missing packs return `404`; malformed requests return `400` or `422` problem details.
5. Contract tests cover bare permissions, pagination, every publication state, duplicate assignment, mixed valid/invalid scholar IDs, and aggregate-count correctness.
