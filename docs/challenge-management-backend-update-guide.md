# Challenge management backend update guide

The Angular admin now treats challenges as managed programs rather than rendering arbitrary JSON. This document is the implementation contract for the Node.js/Firebase backend. Reuse the existing challenge router, controller, service, and Firestore collection; do **not** create a second admin challenge module or collection.

## API and authentication

All paths below are relative to `environment.apiBaseUrl`. Verify the Firebase ID token with the existing authentication middleware, then authorize the user's custom claims before reading Firestore.

| Method | Path                            | Permission                 | Purpose                               |
| ------ | ------------------------------- | -------------------------- | ------------------------------------- |
| `GET`  | `/admin/challenges`             | `admin.challenges.read`    | Searchable, filterable challenge list |
| `GET`  | `/admin/challenges/:id`         | `admin.challenges.read`    | Challenge detail and configuration    |
| `POST` | `/admin/challenges`             | `admin.challenges.write`   | Create a draft                        |
| `PUT`  | `/admin/challenges/:id`         | `admin.challenges.write`   | Update editable fields and schedule   |
| `POST` | `/admin/challenges/:id/publish` | `admin.challenges.publish` | Validate and publish a program        |
| `POST` | `/admin/challenges/:id/archive` | `admin.challenges.archive` | Archive a program without deleting it |

Return `401` for a missing/invalid token and `403` for insufficient claims. Never rely on the UI to enforce authorization. Use the existing RFC 7807/problem-details error shape, including the request correlation ID. The frontend supports both a bare array and the transitional `{ data: [] }` shape, but `{ items, total, nextCursor }` is the target contract.

### List request

Support these optional query parameters so filtering can move server-side as the collection grows: `query`, `status`, `sort` (`updated-desc`, `start-asc`, `title-asc`), `pageSize` (maximum 100), and an opaque `cursor`. Do not accept a client-provided Firestore offset or document path as a cursor; sign or encode the ordered field values and document ID, validate them, then use `startAfter`.

```json
{
  "items": [
    {
      "id": "challenge-2026-01",
      "title": "30-day clinical foundations",
      "slug": "clinical-foundations-30",
      "description": "Build consistent clinical reasoning habits.",
      "status": "scheduled",
      "startsAtUtc": "2026-09-01T00:00:00.000Z",
      "endsAtUtc": "2026-09-30T23:59:59.999Z",
      "durationDays": 30,
      "audience": "Pre-clinical scholars",
      "learningPackCount": 6,
      "cohortCount": 2,
      "enrollmentCount": 84,
      "updatedAtUtc": "2026-07-27T12:00:00.000Z"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

Normalize timestamps to UTC ISO-8601 strings at the API boundary. The Firestore SDK may store `Timestamp` values internally, but its wire representation must never leak to Angular. Omit optional empty fields rather than sending placeholder strings such as `"Not set"`.

## Firestore model and relationships

Keep the existing challenge document as the aggregate root. Migrate documents in place toward these fields:

```text
challenges/{challengeId}
  title, slug, description, audience
  status: draft | scheduled | active | completed | archived
  startsAt: Timestamp | null
  endsAt: Timestamp | null
  durationDays: number | null
  createdAt, createdBy, updatedAt, updatedBy
  publishedAt, publishedBy, archivedAt, archivedBy
  version: number
```

Use the project's existing relationship records rather than embedding whole documents:

- Learning-pack relationship: retain the current `challengeId` reference on learning packs or the existing challenge/pack join collection. Derive `learningPackCount` with the established counter strategy.
- Cohort relationship: retain the current challenge assignment field/join on cohorts. Do not copy cohort membership into a challenge.
- Enrollment relationship: count the existing enrollments whose `challengeId` points to the challenge. A cohort assignment and an individual enrollment are different facts.

If counts cannot be queried cheaply, maintain aggregate counters transactionally when relationships change and run a one-time reconciliation. Firestore count aggregations are acceptable at low volume; avoid an N+1 query per item on the list endpoint. Add composite indexes required by status/updated date and status/start date queries to the existing Firestore index configuration.

## Lifecycle rules

Implement lifecycle transitions in a Firestore transaction. Read the current document, validate its version and state, update audit metadata, and write an audit-log entry using the existing audit facility.

- **Draft → scheduled/published:** require a title, unique normalized slug, valid start/end dates, and at least one learning pack. If the start is in the future, store `scheduled`; otherwise store `active`.
- **Scheduled → active:** perform this with the existing scheduled job or derive effective status consistently. Do not depend on an administrator reopening the page.
- **Active → completed:** mark complete after the end time using the existing scheduler/business policy.
- **Any non-archived state → archived:** preserve the document and relationships. Archiving is not deletion.
- Reject invalid transitions with `409 Conflict`; return field validation failures with `422 Unprocessable Entity`.

`POST /:id/publish` and `POST /:id/archive` should be idempotent: repeating an already-applied action returns the current resource. Do not accept lifecycle fields through the general update endpoint. Consider an `Idempotency-Key` header if the existing API middleware already supports it.

## Validation, concurrency, and security

- Validate IDs and all request bodies with the validation library already used by the backend; discard or reject unknown properties to prevent mass assignment.
- Enforce a unique lowercase slug with a transaction-backed reservation/document strategy. A query followed by a write is race-prone.
- Use a `version` precondition (or Firestore update-time precondition) for edits and return `409` with the latest version on collision.
- Cap search input and page size. For case-insensitive prefix search, persist normalized search keys or use the search provider already present; do not scan the collection in application memory.
- Write actor UID, action, challenge ID, old/new state, timestamp, and correlation ID to the existing immutable audit log for create, update, publish, archive, and relationship changes.
- Security Rules remain defense in depth. The Admin SDK bypasses rules, so middleware authorization is mandatory.

## Rollout checklist

1. Inventory the current challenge, cohort, enrollment, and learning-pack documents and map legacy timestamp/status names.
2. Add backward-compatible serializers and the list endpoint before migrating stored documents.
3. Backfill normalized timestamps, status, version, and aggregate counts in small idempotent batches; record failures for replay.
4. Deploy required indexes, then lifecycle actions and scheduled transitions.
5. Test authorization for each role/permission and Firebase token failure mode.
6. Contract-test array and envelope serialization, UTC dates, filters, ordering, cursor stability, validation, concurrent edits, and idempotent lifecycle calls.
7. Reconcile counters against relationship records and monitor error rate, query latency, rejected transitions, and audit writes after release.

The UI intentionally links schedule editing to `/admin/challenges/:id?section=schedule`, learning packs to `/admin/learning-packs?challengeId=:id`, and cohorts to `/admin/cohorts?challengeId=:id`. Existing detail/list pages should consume these query parameters when their corresponding backend relationship endpoints are available.
