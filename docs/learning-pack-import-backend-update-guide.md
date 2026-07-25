# Learning Pack Import Backend Update Guide

This guide defines the backend contract required by the learning-pack import UI at
`/admin/learning-packs/import`. It covers upload, extraction, draft editing, validation, commit, authorization,
idempotency, errors, and tests.

## Why this update is needed

The frontend enables **Commit draft content** when an import is in the `validated` state, has no validation errors,
and is not explicitly marked `valid: false`. For a consistent contract, the backend should return `valid` on every
detail, save, and validation response and keep `status`, `valid`, and `validationErrors` synchronized.

The backend remains the authority for workflow transitions. It must reject a commit unless the stored import is the
same validated version that the administrator reviewed.

## Authorization

Protect every endpoint in this guide with authenticated administrator authorization. The content-review alias may
also expose upload to users with `content.import`, but it must use the same service and authorization policy.

- Return `401 Unauthorized` when no valid session is present.
- Return `403 Forbidden` when the user lacks import permission.
- Scope all reads and writes according to the application's tenant or organization boundary.
- Record the authenticated user ID for upload, draft changes, validation, and commit audit events.

Never trust `uploadedBy`, `importedBy`, status, ownership, or audit fields supplied by the client.

## Endpoints

| Method | Path                                                | Purpose                                                 |
| ------ | --------------------------------------------------- | ------------------------------------------------------- |
| `GET`  | `/admin/learning-packs/imports?limit=20&cursor=...` | List recent imports.                                    |
| `POST` | `/admin/learning-packs/imports`                     | Upload and extract one PDF or DOCX file.                |
| `GET`  | `/admin/learning-packs/imports/{importId}`          | Load the extracted/editable draft and workflow state.   |
| `PUT`  | `/admin/learning-packs/imports/{importId}/draft`    | Replace the complete editable draft.                    |
| `POST` | `/admin/learning-packs/imports/{importId}/validate` | Validate the stored draft.                              |
| `POST` | `/admin/learning-packs/imports/{importId}/commit`   | Idempotently upsert validated content as draft records. |

Use opaque import IDs. URL-decode and validate the route value, and return `404 Not Found` rather than exposing an
import outside the caller's scope.

## Import record contract

Return the following shape from upload, detail, save, and validate operations. Fields marked optional are useful in
list responses, but detail and validation responses should include the complete record.

```json
{
  "importId": "imp_01JZ...",
  "sourceFileName": "cardiology-pack.docx",
  "packTitle": "Cardiology Foundations",
  "uploadedBy": "user_123",
  "uploadedAt": "2026-07-25T12:00:00Z",
  "status": "validated",
  "valid": true,
  "validationCount": 0,
  "validationErrors": [],
  "extractionWarnings": [],
  "created": 0,
  "updated": 0,
  "skipped": 0,
  "failed": 0,
  "contentVersion": "7",
  "draft": {
    "learningPack": {
      "externalId": "cardiology-foundations",
      "title": "Cardiology Foundations",
      "status": "draft"
    },
    "capsules": []
  }
}
```

### Consistency rules

- `valid: true` means validation completed successfully for the current `contentVersion`.
- `valid: false` means the current draft has not passed validation.
- `status: "validated"` must only be returned with `valid: true` and an empty `validationErrors` array.
- Saving or replacing a draft must increment `contentVersion`, clear stale validation results, set `valid: false`, and
  move the status to `needs_review`.
- `validationCount` must equal the number of blocking entries in `validationErrors`. Extraction warnings do not count
  as blocking errors.
- Return arrays as `[]`, not `null`, so clients can render a stable response.
- Use UTC ISO 8601 timestamps.

For backward compatibility, the current frontend accepts a `validated` response when `valid` is omitted. New and
updated backend implementations should nevertheless always return the boolean to remove ambiguity for other clients.

## Status state machine

Use only these status values:

```text
uploaded -> extracted -> needs_review -> validated -> committing -> completed
               |              ^             |
               |              |             +-> needs_review (draft edited)
               +-> failed     +-> failed (unexpected processing failure)
```

Recommended meanings:

| Status         | Meaning                                                  | Allowed next operations                                      |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| `uploaded`     | File is stored and queued for extraction.                | Extract or fail.                                             |
| `extracted`    | Extraction completed and a draft is available.           | Save or validate.                                            |
| `needs_review` | Draft was edited or validation found blocking errors.    | Save or validate.                                            |
| `validated`    | Current version passed all blocking checks.              | Commit or save a new version.                                |
| `committing`   | A commit owns the import lock and is writing content.    | Poll/detail only.                                            |
| `completed`    | Commit finished successfully.                            | Detail/list only; repeated commit returns the stored result. |
| `failed`       | Extraction or an unexpected processing operation failed. | Retry according to backend policy.                           |

Do not mark an import `failed` for ordinary content validation errors; use `needs_review`, `valid: false`, and return
the errors.

## 1. Upload and extraction

`POST /admin/learning-packs/imports` accepts `multipart/form-data` with one field named `file`.

Backend validation must independently enforce:

- `.pdf` or `.docx` content only, verified by signature/content type rather than filename alone;
- non-empty input no larger than 20 MB;
- sanitized display filename and a generated storage key;
- malware scanning and safe document parsing;
- parser time, page, decompression, and memory limits.

Return `201 Created` with an import record. Synchronous extraction may return `extracted` or `needs_review` with the
draft populated. Asynchronous extraction may return `uploaded`; detail polling must later expose the extracted draft.
Never execute macros, external links, embedded scripts, or active document content.

## 2. List and detail

`GET /admin/learning-packs/imports` returns newest uploads first using stable cursor pagination:

```json
{
  "items": [],
  "nextCursor": null
}
```

Honor `limit` with a server-side maximum. A detail request must return the current complete draft, warnings, validation
errors, counts, `valid`, status, and `contentVersion` from one consistent database snapshot.

## 3. Save the draft

`PUT /admin/learning-packs/imports/{importId}/draft` receives the complete `LearningPackImportPayload` directly as the
JSON body; it is not wrapped in a `draft` property.

```json
{
  "learningPack": {
    "externalId": "cardiology-foundations",
    "title": "Cardiology Foundations",
    "status": "draft"
  },
  "capsules": [
    {
      "externalId": "cardiology-basics",
      "title": "Cardiology basics",
      "sequence": 1,
      "estimatedMinutes": 15,
      "questions": []
    }
  ]
}
```

Replace the stored draft atomically. Perform structural/schema checks before storage, but reserve full content checks
for validation. A successful save returns `200 OK` with the updated import record in `needs_review`, `valid: false`,
empty stale validation results, and an incremented `contentVersion`.

Reject saves in `committing` or `completed` with `409 Conflict`. Apply request body and nesting limits to prevent
oversized JSON or denial-of-service payloads.

## 4. Validate the stored draft

`POST /admin/learning-packs/imports/{importId}/validate` has an empty JSON body (`{}`). Validate the stored draft, not a
second payload from the request.

At minimum, validate:

1. Required pack, capsule, question, choice, and explanation fields.
2. Stable, unique external IDs within the payload and valid external-ID format/length.
3. Unique positive capsule/question sequences within their parent.
4. Choice IDs normalized to lowercase `a` through `f`, with no duplicates.
5. The explanation's correct choice ID exists among the question choices.
6. Incorrect rationales reference existing non-correct choices.
7. Required correct rationale, memory, references, and product-specific educational fields.
8. Supported status/enum values and safe numeric limits such as estimated minutes.
9. No unsafe HTML, scripts, executable URLs, or unsupported media references.
10. References to challenge/cohort entities exist and are within the caller's tenant when present.

On success, return `200 OK` with `status: "validated"`, `valid: true`, and `validationErrors: []`.

On content failure, return `200 OK` with `status: "needs_review"`, `valid: false`, and all actionable errors. Use paths
that map back to the editor:

```json
{
  "status": "needs_review",
  "valid": false,
  "validationCount": 1,
  "validationErrors": [
    {
      "path": "capsules[0].questions[2].explanation.correctChoiceId",
      "message": "Correct choice d does not exist in choices."
    }
  ]
}
```

Return the complete import record around these fields. Do not use `500` for content mistakes.

## 5. Commit validated content

`POST /admin/learning-packs/imports/{importId}/commit` has an empty JSON body (`{}`). Before writing anything, verify in
one transaction or compare-and-swap operation that:

- status is `validated`;
- `valid` is `true`;
- validation errors are empty;
- the validated `contentVersion` is still current;
- no other commit owns the import lock.

Transition atomically from `validated` to `committing`, then upsert the pack, capsules, questions, choices, and
explanations by stable external ID. Imported educational content must remain `draft`; commit must not publish it.

The operation must be idempotent. A retry after a network timeout must not create duplicate records. Store the result
against the import and return the same successful summary for repeated requests after completion:

```json
{
  "created": 12,
  "updated": 2,
  "skipped": 4,
  "failed": 0,
  "validationErrors": [],
  "contentIds": {
    "learningPack": "lp_123",
    "capsules": ["cap_123"]
  },
  "importedBy": "user_123",
  "importedAt": "2026-07-25T12:05:00Z",
  "sourceFileName": "cardiology-pack.docx"
}
```

Prefer an all-or-nothing transaction. If the persistence layer cannot provide one, use a resumable job with durable
per-entity idempotency keys and report `failed` accurately. Set the import to `completed` only after all required
writes and the audit record succeed.

## Error response contract

Use RFC 7807-style problem details consistently:

```json
{
  "title": "Import changed",
  "detail": "The draft changed after validation. Reload, validate the current version, and try again.",
  "status": 409,
  "traceId": "00-a1b2c3...",
  "errors": [
    {
      "path": "contentVersion",
      "message": "Validated version 6 is no longer current."
    }
  ]
}
```

| Status | Use                                                                                      |
| ------ | ---------------------------------------------------------------------------------------- |
| `400`  | Malformed request, invalid cursor, or unsupported file metadata.                         |
| `401`  | Missing or invalid authentication.                                                       |
| `403`  | Authenticated user lacks permission.                                                     |
| `404`  | Import does not exist or is outside the caller's scope.                                  |
| `409`  | Invalid state transition, stale version, concurrent operation, or save after completion. |
| `413`  | File or JSON body exceeds limits.                                                        |
| `415`  | Unsupported document media type.                                                         |
| `422`  | Request JSON cannot satisfy the draft schema before it can be saved.                     |
| `429`  | Upload/extraction rate limit exceeded.                                                   |
| `500`  | Unexpected server or persistence failure only.                                           |

Always include a support-safe `traceId`. Do not return parser internals, stack traces, storage paths, answer-security
secrets, or data from another tenant.

## Persistence and audit recommendations

Persist the import header, source metadata, editable draft, status, validation result, validated version, commit result,
and timestamps. Keep an append-only audit trail containing actor, action, import ID, before/after version, outcome,
timestamp, and trace ID. Avoid storing the original file indefinitely unless retention requirements demand it; apply
encryption, access control, and deletion schedules.

Use a row version, ETag, or compare-and-swap token internally even though the current frontend does not send one on
save. At minimum, serialize state transitions and reject concurrent save/validate/commit operations rather than
silently overwriting them.

## Backend test checklist

### Contract tests

- Upload accepts valid PDF/DOCX multipart field `file` and rejects empty, oversized, spoofed, or unsupported files.
- List pagination is stable and tenant-scoped.
- Detail returns a complete record with non-null arrays, `valid`, status, and `contentVersion`.
- Save accepts the unwrapped payload, increments the version, clears validation, and returns `needs_review`.
- Validation success returns `validated`, `valid: true`, and no errors.
- Validation failure returns `needs_review`, `valid: false`, path-specific errors, and no content writes.
- Commit rejects unvalidated, invalid, stale, `committing`, and unauthorized imports.
- Commit writes draft content and returns correct created/updated/skipped/failed counts.
- Repeating a completed commit returns the stored summary without duplicate content.

### Concurrency and failure tests

- Simultaneous commits result in one writer and an idempotent response or one controlled `409`.
- Saving during validation or commit cannot overwrite the version being processed.
- A transaction failure leaves no partial authoring graph, or a resumable job safely completes it.
- A client timeout followed by retry does not duplicate entities.

### Security tests

- Cross-tenant and unauthorized IDs return `404` or `403` according to policy without leaking existence.
- Malicious documents, zip bombs, macros, unsafe HTML, and oversized nested JSON are rejected safely.
- User-controlled filenames and content never appear unsanitized in logs or responses.
- Audit records exist for upload, save, validation, commit, denial, and unexpected failure.

## Deployment order

1. Add database fields/state constraints and idempotency support.
2. Deploy response consistency (`valid`, arrays, `contentVersion`) and problem details.
3. Deploy save/validate state transitions and validators.
4. Deploy transactional/idempotent commit behavior.
5. Run contract, concurrency, security, and migration tests against production-like data.
6. Deploy the frontend and monitor `409`, validation failure, commit duration, and retry rates.
