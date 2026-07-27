# Admin user management: backend update guide

## Frontend audit and integration boundary

The existing `/admin/users` route, `AdminUserListPage`, `AdminUserApiService`, `AdminLearningPackApiService`, and `AdminEnrollmentApiService` are reused. The upgraded UI reads users and the published learning-pack catalog, then sends one bulk assignment request. All paths are relative; `ApiService` remains responsible for prefixing `environment.apiBaseUrl` and attaching authentication.

The backend must treat every filter and identifier as untrusted. Firebase Authentication is the identity source, while Firestore stores application roles, cohorts, learning-pack metadata, assignments, and audit events. Do not expose Firebase custom claims or profile fields that are not in the response contract below.

## Required permissions

Apply the existing authenticated administrator middleware to every endpoint. Verify the Firebase ID token, load current application permissions, and require:

| Endpoint | Permission |
| --- | --- |
| `GET /admin/users` | `admin.users.read` |
| `GET /admin/learning-packs` | existing catalog-read permission |
| `POST /admin/enrollments/learning-pack-assignments` | `admin.enrollments.manage` (recommended) |

Return `401` for an absent/invalid token and `403` for a valid principal without permission. Never accept the acting administrator ID from the request body; derive it from the verified token.

## 1. User list contract

`GET /admin/users?query=&role=&status=&cohortId=&limit=25&cursor=` should eventually filter and paginate server-side. Until then, returning all supported records is compatible with the client. Use a stable `(createdAt, uid)` order and an opaque, signed or encoded cursor rather than a Firestore document snapshot serialized to the browser.

```json
{
  "items": [
    {
      "uid": "firebase-uid",
      "email": "scholar@example.org",
      "displayName": "Avery Scholar",
      "emailVerified": true,
      "disabled": false,
      "status": "active",
      "roles": ["Scholar"],
      "mfaEnabled": true,
      "adminMfaRequired": false,
      "activeCohortId": "cohort-2026-08",
      "activeCohortName": "August 2026",
      "photoUrl": null,
      "authProvider": "password",
      "lastSignInAtUtc": "2026-07-26T18:04:00.000Z"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

Normalize role spelling consistently. The UI identifies scholars by a case-insensitive `Scholar` role; the API must not infer scholarship merely from a cohort. Batch Firebase Admin `getUsers()` calls where possible and avoid an Authentication lookup per Firestore row. Cache or denormalize safe Auth fields if list latency becomes unacceptable, with a reconciliation job for drift.

## 2. Published learning-pack catalog

`GET /admin/learning-packs?status=published` must return `{ "items": [...] }` (or the existing compatible array/data envelope). Each item requires `id`, `title`, and a `publicationStatus` or `status`. Do not allow draft or archived packs to be assigned even if a caller posts their IDs directly.

## 3. Bulk assignment contract

Implement `POST /admin/enrollments/learning-pack-assignments`:

```json
{
  "scholarIds": ["uid-1", "uid-2"],
  "learningPackIds": ["pack-1", "pack-2"],
  "availableFromUtc": "2026-08-01T12:00:00.000Z",
  "dueAtUtc": "2026-08-15T23:59:00.000Z",
  "notes": "Assigned after readiness review"
}
```

Validation rules:

* Require 1–100 unique scholar IDs and 1–25 unique pack IDs; reject empty, malformed, or over-limit arrays with `400`.
* Require every target user to exist and have the `Scholar` role.
* Require every pack to exist and be published.
* Parse timestamps strictly as ISO-8601 UTC; if both exist, require `dueAtUtc > availableFromUtc`.
* Trim notes, limit them to 500 characters, and store them as plain text.
* Enforce a maximum of 2,500 combinations per request and request-size limits at the HTTP layer.

Use an idempotent deterministic assignment identity, for example `sha256(scholarId + ':' + learningPackId)`, or a transaction/query backed by a unique index convention. A retry must report an existing active assignment as skipped, not create a duplicate. For larger operations use Firestore `BulkWriter`; keep each write independent so one invalid combination does not roll back valid assignments.

Recommended assignment document (adapt collection names to the backend's existing convention rather than creating a parallel collection):

```json
{
  "scholarId": "uid-1",
  "learningPackId": "pack-1",
  "status": "assigned",
  "availableFromUtc": "Firestore Timestamp or null",
  "dueAtUtc": "Firestore Timestamp or null",
  "notes": "Assigned after readiness review",
  "assignedBy": "admin-firebase-uid",
  "assignedAtUtc": "serverTimestamp",
  "updatedAtUtc": "serverTimestamp"
}
```

Return `200` after all combinations have been evaluated:

```json
{
  "createdCount": 2,
  "skippedCount": 1,
  "failedCount": 1,
  "failures": [
    { "scholarId": "uid-2", "learningPackId": "pack-2", "message": "Scholar is not active" }
  ]
}
```

Keep failure messages safe and actionable; do not include stack traces or document internals. Reserve request-level `4xx/5xx` responses for cases where the operation could not be evaluated. Include the normal API error envelope and correlation ID in those responses.

## Auditing, security, and observability

Write one immutable audit summary with actor UID, normalized request, counts, correlation ID, and server timestamp. Optionally write per-assignment audit events, but never place notes or email addresses in logs. Emit latency and created/skipped/failed metrics. Alert on repeated authorization failures and unusually large assignment bursts.

Firestore rules should deny client SDK access to admin collections; these routes use the Admin SDK after server authorization. Validate authorization in the controller/service even though Admin SDK bypasses Firestore rules.

## Suggested Node controller sequence

1. Authenticate and authorize the administrator.
2. Validate and normalize the body; deduplicate both ID arrays.
3. Batch-load users and packs, classifying invalid combinations as failures.
4. For each valid combination, create the deterministic document only if it does not already exist; count existing records as skipped.
5. Await all writes, record an audit summary, and return counts plus bounded failure details.

## Backend verification checklist

* Unit-test schema limits, timestamp ordering, trimming, role matching, and publication status.
* Integration-test mixed created/skipped/failed results against the Firestore emulator.
* Repeat the identical request and assert zero new documents and all valid combinations skipped.
* Test concurrent identical requests to prove the deterministic ID/transaction prevents duplicates.
* Test `401`, `403`, draft packs, non-scholars, disabled users, and missing records.
* Contract-test that counts add up to `scholarIds × learningPackIds` and that timestamps are stored as Firestore timestamps.
* Load-test the maximum accepted request and confirm bounded response time and audit creation.
