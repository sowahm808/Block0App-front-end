# Admin Cohort Management backend update guide

The frontend uses the existing API base URL and calls `GET /admin/cohorts` (the deployed base URL is expected to include `/api/v1`). Keep the existing Node/Firebase modules and collections; do not create parallel cohort data.

## Audited frontend contract

The repository contains no backend source, emulator fixtures, or production response sample. The current UI previously treated the response as an arbitrary object, so the backend relationships cannot be verified from this repository. Before implementing writes, confirm in the backend whether scholar membership is authoritative in enrollments, `user.activeCohortId`, or team membership; whether mentors are direct cohort fields or relationship documents; and whether learning packs are inherited from a challenge or assigned to scholars. Do not migrate or duplicate those relationships merely to satisfy this DTO.

Return either an array or `{ items | data | cohorts, nextCursor?, total? }`. Every item should include `id`, `name`, challenge display fields, schedule, capacity, aggregate scholar/mentor/pack counts, and timestamps. Malformed wrappers are deliberately rejected. Compute aggregates in one controller/repository operation using stored counters, Firestore batch reads, or denormalized summaries—never one HTTP/database query per row.

## Endpoints

Secure every route after Firebase token verification and check the indicated permission server-side:

- `GET /admin/cohorts` — `cohorts.read`; filters for search, challenge, status, mentor, capacity, dates, archive state, sort, limit, cursor.
- `POST /admin/cohorts` — `cohorts.create`; validate name/challenge, timezone, dates, positive capacity, and uniqueness within challenge.
- `PUT /admin/cohorts/:id` — `cohorts.update`; require `version` or `If-Match`, returning 409 on stale writes.
- `POST /admin/cohorts/:id/status` — lifecycle-specific update/archive/enrollment permission.
- `POST /admin/cohorts/:id/duplicate` — `cohorts.create`.
- Member, mentor, schedule, enrollment, and learning-pack subroutes should reuse existing services and authoritative collections, protected respectively by `cohorts.members.manage`, `cohorts.mentors.manage`, `cohorts.schedule.manage`, `cohorts.enrollment.manage`, and `cohorts.learning-packs.manage`.

Use lifecycle values `draft`, `upcoming`, `enrollment_open`, `active`, `paused`, `completed`, `closed`, `archived`, and validate allowed transitions transactionally. Reject writes to archived cohorts. Bulk member and pack assignment operations require an idempotency key, preserve partial success, and must not silently transfer a scholar from another active cohort. Mentor assignments must verify the explicit Mentor role/capability.

## Errors, integrity, and indexes

Return RFC 9457 Problem Details (`type`, `title`, `status`, `detail`, `instance`, optional field errors). Use 401 for invalid sessions, 403 for permissions, 404 for missing routes/records, 409 for duplicate names/version conflicts, and 422 for domain validation. Firestore transactions must enforce capacity, membership uniqueness, transition validity, version increments, and idempotency.

Create composite indexes only after matching the actual queries. Expected candidates combine archive/status/challenge/mentor with `updatedAtUtc` or `startsAtUtc`; record the generated index definitions in the backend repository. Keep aggregate counters transactionally synchronized and add a reconciliation job rather than calculating them with N+1 reads.

## Backend verification checklist

Add tests for 403 authorization, invalid/overlapping dates, duplicate name, optimistic conflict, invalid transition, archived protection, capacity enforcement, duplicate member skip, explicit transfer, invalid mentor, partial bulk results, and idempotent assignment. Run that repository's typecheck, production build, tests, Firestore emulator integration suite, and index deployment validation.
