# Admin System Settings backend implementation guide

## Frontend contract

The Angular workspace calls the existing API base (`environment.apiBaseUrl`, currently ending in `/api/v1`) and these relative routes:

| Method | Route | Permission | Purpose |
|---|---|---|---|
| `GET` | `/admin/system-settings` | `system-settings.read` | Sanitized settings plus operational metadata |
| `POST` | `/admin/system-settings/validate` | `system-settings.validate` | Validate without persisting |
| `PUT` | `/admin/system-settings` | `system-settings.update` (plus `system-settings.security.update` for security) | Transactional update |
| `POST` | `/admin/system-settings/reset` | `system-settings.reset` | Reset the named category |
| `GET` | `/admin/system-settings/history` | `system-settings.read` and audit access policy | Redacted change history |

The read/update/reset response may be the settings object directly, `{ "data": settings }`, or `{ "settings": settings }`. Prefer `{ "data": settings }`. Always return `version` and `schemaVersion`. The update request is:

```json
{ "version": 12, "settings": { "general": {}, "academy": {}, "challenges": {}, "learningPacks": {}, "enrollment": {}, "notifications": {}, "security": {}, "imports": {}, "reports": {}, "integrations": {}, "maintenance": {} } }
```

The frontend supports General, Academy, Challenges, Learning Packs, Enrollment, Notifications, Security, Imports & Uploads, Reports, read-only Integrations, Maintenance, and read-only Environment. Use the TypeScript `SystemSettings` interface in `src/app/core/api/api.types.ts` as the field-level contract. Provider booleans and identifiers are status, not configuration inputs.

## Firestore model and migrations

Reuse the existing admin settings repository/collection. Store one global, versioned document unless an existing per-category model is already in production. A global document should include `schemaVersion`, monotonic `version`, `updatedAtUtc` (server timestamp), `updatedBy` (Firebase UID), and the category objects. Never create a second source of truth.

Read through a migration function before serialization. Migrations must be sequential, idempotent, tested against every prior schema, fill safe defaults for missing fields, and fail with a Problem Details response rather than partially writing. Environment/provider status is assembled at read time and must not be persisted with editable settings.

## Authorization and transaction flow

1. Verify the Firebase ID token and disabled-user state.
2. Require the route permission server-side; `*` may satisfy it according to the existing authorization middleware.
3. Parse with a strict schema (`additionalProperties: false` / strict Zod object). Reject unknown categories and keys.
4. Re-read the document inside a Firestore transaction.
5. Compare request `version` to stored `version`. On mismatch return HTTP `409` with Problem Details title `Settings changed by another administrator` and the current version; never merge or overwrite.
6. Validate dependencies and policy, increment the version, apply a server timestamp/actor, and write in that transaction.
7. Write an audit event atomically where practical, or use an outbox written in the same transaction. If audit durability cannot be guaranteed, fail the update rather than create an unaudited sensitive change.

Read-only users receive the sanitized document. Security changes additionally require `system-settings.security.update`; reset requires `system-settings.reset`. Do not trust disabled controls or frontend permission checks.

## Validation and safeguards

Backend validation must match or exceed the UI: duration 1–365 days; session/reset timeout 5–1440 minutes; login attempts 1–20; audit retention 30–3650 days; upload size 1–500 MB; extraction timeout 10–900 seconds; export rows 1–1,000,000; valid email, locale, timezone, timestamps, and supported parser extensions only. Enforce upload size again in multipart middleware, reverse proxy, and storage rules.

Reject SMS enablement unless the SMS provider is configured and healthy. Define whether unavailable email blocks or warns and return warnings from validation. Enabling maintenance/read-only mode requires a nonblank banner/reason under product policy, preserves authenticated administrator bypass, and must be enforced in write middleware. Validate banner end after start. The validate endpoint executes the identical schema and business-policy pipeline but does not write.

Reset accepts `{ "category": "reports", "version": 12 }`, permits only resettable categories, uses the same transaction/version comparison, and audits changed field names. Do not expose a global reset route without separate, strongly confirmed authorization.

## Secret redaction

Use an explicit response allowlist; never serialize arbitrary Firestore documents or `process.env`. Exclude private keys, Firebase service accounts, JWT keys, SMTP passwords, Twilio tokens, API secrets, refresh tokens, and storage credentials. If operationally necessary, return only a separate status object such as `{ "configured": true, "lastRotatedAtUtc": "..." }`. Secret rotation belongs to dedicated write-only endpoints and request values must never enter logs, errors, audit before/after data, or history.

Environment output should be operationally minimal: deployment name, public versions/build time, public API base, Firebase project/bucket identifiers if approved, and coarse service status. Do not include hostnames, connection strings, account identifiers, or stack traces. There is no `/health` fallback; obtain health explicitly when the environment DTO is assembled.

## Audit and history

Record event ID/time, actor UID and display-safe identity, request/correlation ID, category, changed field paths (not values), result, old/new versions, and optional approved reason. Include rejected validation, conflict, reset, and sensitive-policy attempts according to the central audit retention policy. History returns paginated `{ items, nextCursor }`; each item contains only `id`, `occurredAtUtc`, `administrator`, `category`, `changedFields`, and `result`. Reuse the central Audit Log and link records by correlation ID.

## Problem Details and tests

Return `application/problem+json` with `type`, `title`, `status`, `detail`, `instance`, correlation ID, and field errors keyed by safe paths. Use `400/422` for invalid input, `401` unauthenticated, `403` unauthorized, `409` stale version, and `500` only for unexpected failures.

Required automated coverage: 401/403; read-only access; per-operation and security permissions; strict unknown-field rejection; all bounds and cross-field dependencies; stale-version conflict and simultaneous transaction race; each schema migration; defaults for absent optional fields; audit event/outbox creation and failure behavior; secret and environment allowlists; maintenance administrator bypass and write blocking; provider dependency; reset permission/category/version; sanitized history; and Problem Details shape. Run backend typecheck, production build, unit tests, emulator integration tests, and concurrency tests before release.
