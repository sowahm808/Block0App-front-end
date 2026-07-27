# Admin Audit backend update guide

The frontend Audit Log uses `environment.apiBaseUrl` and the existing authenticated `ApiService`. It calls `GET /admin/audit`, `GET /admin/audit/:eventId`, and `GET /admin/audit/export`; with the production base URL these should resolve to the backend's `/api/v1/admin/audit` routes. There is no backend source tree in this repository, so this document is the implementation contract for the Node.js/Firebase service rather than an unverified backend patch.

## Authorization and immutable storage

Require an authenticated Firebase principal and `audit.read` (or `*`) for list/detail. Require `audit.export` independently for CSV. Consider a stronger `audit.security.read` permission before returning restricted network/device context. Return 403 rather than filtering permissions silently.

Keep audit documents append-only: the application service must expose create and read operations only. Firestore rules must reject client writes, updates, and deletes. Only the trusted server audit writer may create documents. Retention, archival, or TTL must be an operations policy rather than an administrator button.

Centralize writes behind `AuditService.append(input)`. The contract should include action, category, actor snapshot (`id`, `displayName`, `email`, roles), optional entity snapshot (`type`, `id`, `title`), outcome, severity, notes, changed fields, before/after, request/trace/correlation IDs, and sanitized metadata. Add calls for role/account changes, cohort membership, mentor and learning-pack assignments, challenge lifecycle, content-review decisions, exports, authentication/security activity, and sensitive configuration changes.

## Sanitization (required server-side)

Recursively remove or replace keys matching passwords/passcodes, access or refresh tokens, authorization headers, cookies/session values, secrets/API keys/private keys, reset links, and protected-health fields not explicitly approved for auditing. Apply this both **before writing** and when serializing older documents. Limit object depth, array length, string length, and metadata size. Never depend on the frontend's defense-in-depth redaction.

Do not return full IP addresses or user agents by default. If an authorized security view needs them, return purpose-limited/masked values from a separate DTO policy. CSV must omit raw metadata, before/after objects, IP addresses, and user agents.

## List endpoint

`GET /api/v1/admin/audit` accepts:

| Parameter | Contract |
| --- | --- |
| `start`, `end` | ISO-8601 instants; reject start after end |
| `search` | actor name/email, notes, entity title/ID, event/trace/correlation ID |
| `actor` | actor name, email, or exact ID |
| `action`, `entityType`, `entity`, `category`, `outcome`, `source`, `severity` | allow-listed or bounded strings |
| `sort` | `createdAtUtc`, `actor`, `action`, `category`, `outcome`, or `severity` plus `asc`/`desc`; default newest first |
| `limit` | integer, default 50, maximum 100 |
| `cursor` | opaque, signed/validated cursor tied to sort and filters |

Return `{ items, total?, nextCursor? }`. Each item follows the frontend `AdminAuditEvent` contract in `src/app/core/api/api.types.ts`. Older aliases (`data`, `auditEvents`, `events`) are accepted temporarily by the frontend but new backend code should use `items`. Invalid queries and malformed cursors return Problem Details (`type`, `title`, `status`, `detail`, `instance`, `correlationId`).

Firestore does not provide arbitrary substring search. Maintain normalized bounded search terms or use the application's approved search service; do not fetch the entire collection and filter in Node. Cursor pages must use stable ordering with document ID as a tie-breaker.

## Detail and export

`GET /api/v1/admin/audit/:eventId` validates the ID, returns the sanitized event DTO, and returns 404 Problem Details when absent. The frontend currently opens list DTOs in a dialog; keep list DTOs sufficient for normal changed-field inspection, or switch the UI to the explicit detail method if list responses intentionally omit before/after.

`GET /api/v1/admin/audit/export` accepts the same filters and emits UTF-8 CSV with timestamp, actor, actor email, action, category, entity type/title/ID, outcome, summary, source, and trace ID. Escape spreadsheet formulas (cells beginning `=`, `+`, `-`, or `@`) and CSV delimiters. Stream bounded exports; for large ranges return an asynchronous job with short-lived authorized download delivery. Append an audit event for every export.

## Actor and entity resolution without N+1 queries

New documents must retain immutable `actorDisplayName`, `actorEmail`, `actorRoleSnapshot`, and `entityTitle` snapshots. A later user/entity rename must not rewrite history. For legacy documents, collect unique unresolved IDs from the page, batch Firestore lookups in supported chunks, and merge from a request-scoped/cacheable map. Apply the same strategy per entity collection. Never perform one lookup per returned row. Labels resolved from current records should be marked as current rather than historical when that distinction matters.

The audit collection may mix content reviews, security/authentication events, admin operations, jobs, and assignment/enrollment events. Normalize them at write/DTO boundaries; do not assume feature-specific fields exist.

## Firestore indexes

Create descending composite indexes pairing `createdAtUtc` with each filter field used by production queries: `action`, `entityType`, `actorId`, `category`, `outcome`, `severity`, and `source`. Add only query-plan-driven multi-filter composites to avoid an exponential index set. Ensure the collection has an ordered `createdAtUtc` query and document-ID tie-break support. Commit the resulting `firestore.indexes.json` in the backend repository and validate each supported query against the emulator.

## Backend verification checklist

- Unauthorized and missing-permission requests return 401/403; export checks `audit.export`.
- Date, actor, entity, action, category, outcome, severity, source, sorting, and cursor pagination return stable results.
- Detail returns sanitized data and missing events return 404.
- Export has the exact safe columns, spreadsheet-injection protection, and creates an export audit event.
- Recursive sanitization covers nested objects/arrays and legacy documents.
- Firestore/client rules prove update/delete are impossible and only the server can append.
- Batch actor/entity resolution has a bounded query count (no N+1 behavior).
- Emulator tests exercise every indexed query path; production typecheck, build, and test commands pass.
