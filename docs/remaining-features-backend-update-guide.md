# Remaining features: backend update guide

This guide is the implementation contract for connecting the completed Angular feature routes to NestJS. The endpoint-specific gaps and disabled frontend behavior are tracked in [`missing-backend-endpoints.md`](./missing-backend-endpoints.md); this document describes the cross-cutting backend work needed to make those screens production-ready.

## 1. API and authentication boundary

- Mount all controllers below `/api/v1`; Angular composes requests from `environment.apiBaseUrl`.
- Verify the Firebase ID token with Firebase Admin in a NestJS guard. Never accept a UID, role, permission, cohort, or enrollment supplied by the browser as authorization evidence.
- Resolve account status, roles, permissions, enrollment, and workspace scope on the server for every protected request.
- Return `401` for a missing or invalid token, `403` for insufficient role/permission or out-of-scope data, and `423` for a disabled account.
- Include a sanitized correlation/trace identifier in error responses and response headers. Never return tokens, provider keys, service-account data, or raw sensitive payloads.

## 2. Authorization matrix

| Boundary                 | Allowed roles                                            | Server-side scope checks                                                                        |
| ------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Scholar study endpoints  | `Scholar`                                                | Active enrollment in the requested challenge/cohort; administrators are not implicitly scholars |
| Shared account endpoints | Any authenticated role                                   | The authenticated user's own profile and preferences only                                       |
| Mentor endpoints         | `Mentor`, `Administrator`, `SuperAdministrator`          | Required mentor permission plus assigned team/cohort                                            |
| Review endpoints         | `ContentReviewer`, `Administrator`, `SuperAdministrator` | `content.*` permission for each transition                                                      |
| Admin endpoints          | `Administrator`, `SuperAdministrator`                    | Action-specific admin permission; protect super-administrator accounts and self-lockout         |

Publication must require `content.publish` independently of approval. Rejection and change requests must require a non-blank reason. Role checks in Angular improve navigation but are not a security boundary.

## 3. Contract conventions

### Cursor pagination

Firestore-backed list requests should accept `cursor` and `limit`, plus documented filters. Return:

```ts
interface CursorPage<T> {
  items: T[];
  nextCursor?: string;
  total?: number;
}
```

Cursors must be opaque and validated server-side. Do not expose Firestore document paths.

### Idempotent mutations

Scenario start/answer/complete, rehearsal start/complete, certificate generation, and raffle drawing accept an `Idempotency-Key` header. Persist the key with the authenticated actor, operation, request hash, response, and expiry. A retry with an identical hash returns the original result; reuse with a different payload returns `409`.

### Concurrency and workflow transitions

Editable content DTOs must include a version. Require `If-Match` or an equivalent version field for updates and return `409` with the current sanitized version on conflict. Enforce transitions on the backend:

`Draft → InReview → ChangesRequested | Approved → Published → Archived`

Published content is immutable; create a new version for further changes. Approval must never publish automatically.

### Errors

Use a stable envelope such as:

```json
{
  "code": "CONTENT_VERSION_CONFLICT",
  "message": "The content changed after it was opened.",
  "fieldErrors": {},
  "correlationId": "trace-safe-value"
}
```

Use `400` for malformed DTOs, `404` for unavailable or out-of-scope resources where revealing existence is unsafe, `409` for concurrency/idempotency conflicts, `429` for rate limiting, and `503` for unavailable AI or delivery providers.

## 4. Domain requirements

### Scholar workflows

- `/challenges/current/today` is authoritative for day type, availability, lock state, assignments, targets, and completion. Angular must not derive availability.
- Scenario attempt responses expose only the current permitted sequential question. Scores and rationales are backend-calculated and rationales are returned only when review policy allows.
- Rehearsal records reference but never overwrite original attempts. Return the selection reason as a typed enum.
- Readiness endpoints return separate academic and engagement scores, components, formula version, calculation date, history, and recommended actions. The backend owns all calculations.
- Certificate generation is asynchronous. Return a stable certificate identity and status (`Pending`, `Ready`, `Failed`, or `Revoked`); downloads require authentication and use short-lived streaming or signed access without browser persistence.
- Public certificate verification returns only validity, certificate number, permitted display name, challenge name, issue date, and revocation status.

### Notifications and profile

- Notification lists use cursor pagination and support unread/type filters. Mark-read operations must be idempotent.
- Store email/push choices, quiet hours, and an IANA time zone. FCM token registration must follow a user-initiated browser permission request.
- Profile updates use an allow-list: display name, profile image reference, time zone, study preferences, and accessibility preferences. Ignore or reject roles, permissions, status, enrollment/cohort identifiers, readiness, and rewards.

### Mentor and review portals

- Mentor DTOs contain only approved participation/support summaries. Exclude exact answers, answer keys, private check-in text, administrative notes, unrelated cohorts, and unauthorized academic weaknesses.
- Review DTOs may expose protected answer material only to authorized reviewers. Record comments, reasons, actor, timestamp, previous/new status, content version, and trace ID in the audit log.

### Administration

- Dashboard and report endpoints return only measured values; use an explicit unavailable marker instead of zero for unsupported metrics. Every chart series needs matching tabular rows.
- User mutations prevent self-lockout and prevent ordinary administrators from changing super-administrator accounts unless an explicit permission allows it.
- Team assignment validates capacity and prevents duplicate membership within a cohort in one transaction.
- Raffle drawing occurs in a transaction, consumes eligible immutable entries, records the idempotency key and rules snapshot, and returns an immutable result plus audit reference. Redraw requires a reason and a new audited operation.
- Audit responses must be sanitized through a field allow-list. Redact credentials, tokens, secrets, private text, and full request/response payloads.
- System settings endpoints return a non-secret projection only. Feature flags are persisted server-side and may control behavior, but never replace authorization.

## 5. AI provider gateway

Only NestJS may call OpenAI or Gemini. Apply authentication, action permission, input-size limits, rate limits, timeout/cancellation, safety screening, and structured-output validation to all `/ai/*` endpoints. Return provider, model, elapsed generation time, references, safety result, and whether human review is required. Persist a sanitized interaction audit record; do not log secrets or unrestricted prompts containing sensitive data. Generated content always remains a draft and must never be auto-published.

## 6. Delivery plan and acceptance checks

1. Implement guards, scope resolution, error envelopes, cursor pagination, idempotency storage, and audit interception.
2. Deliver scholar read endpoints, then attempt mutations and asynchronous certificates.
3. Deliver shared notification/profile endpoints.
4. Deliver scoped mentor and review DTOs plus workflow transitions.
5. Deliver admin CRUD, reports/audit, raffle transactions, settings/flags, and the AI gateway.
6. Enable each currently disabled Angular action only after its contract test passes.

For each endpoint, add NestJS unit tests for role, permission, scope, DTO validation, and redaction; integration tests for Firestore transaction/concurrency behavior; and contract tests matching the Angular DTO. Verify that an administrator without a Scholar enrollment cannot start a study attempt, unsupported analytics are not fabricated, duplicate idempotent requests do not duplicate writes, and public certificate responses never contain private identifiers.
