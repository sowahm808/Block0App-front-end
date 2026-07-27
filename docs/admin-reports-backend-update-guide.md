# Admin Reports backend implementation guide

## Frontend contract and audit result

The previous `/admin/reports` screen treated an untyped response as generic cards, defaulted a missing route path to `/health`, and refreshed with `window.location.reload()`. The frontend now calls explicit, typed aggregate endpoints and rejects malformed list wrappers. There is no backend source in this repository, so this document is the implementation hand-off rather than an unverified backend implementation.

The frontend requests these supported report categories:

| Permission | Endpoint | Response |
|---|---|---|
| `reports.read` | `GET /api/v1/admin/reports/overview` | `AdminReportOverview` |
| `reports.scholar.read` | `GET /api/v1/admin/reports/scholars` | `ReportListResponse<ScholarReportRow>` |
| `reports.cohort.read` | `GET /api/v1/admin/reports/cohorts` | `ReportListResponse<CohortReportRow>` |
| `reports.challenge.read` | `GET /api/v1/admin/reports/challenges` | `ReportListResponse<ChallengeReportRow>` |
| `reports.learning-pack.read` | `GET /api/v1/admin/reports/learning-packs` | `ReportListResponse<LearningPackReportRow>` |
| `reports.question.read` | `GET /api/v1/admin/reports/questions` | `ReportListResponse<QuestionReportRow>` |
| `reports.export` | optional `GET /api/v1/admin/reports/export` | streamed UTF-8 CSV or export job |

`environment.apiBaseUrl` already supplies `/api/v1` where applicable; route handlers must not repeat it. The current browser export is intentionally limited to the current, server-filtered page. Add the export endpoint/job before allowing exports larger than the paging ceiling.

## Shared query contract

Accept `startAtUtc`, `endAtUtc`, `challengeId`, `cohortId`, `status`, `scholarSearch`, `pageSize`, `cursor`, and a report-specific allow-listed `sort`. Parse dates as strict ISO-8601 UTC values; reject a missing start paired with an end, a start after the end, ranges beyond the configured maximum, invalid document IDs, page sizes above 100, and unsupported sorts with RFC 9457 Problem Details (`422`). Search should be normalized and backed by a searchable prefix/token field; do not scan all users.

Every successful list response should be:

```json
{
  "items": [],
  "total": 0,
  "nextCursor": null,
  "updatedAtUtc": "2026-07-27T12:00:00.000Z"
}
```

A direct array and `{ "data": [] }` remain accepted during migration, but the canonical wrapper above communicates paging and freshness. Overview includes counts, optional rates only when denominators exist, `completionTrend`, `assignmentStatus`, and permitted `{id,label}` challenge/cohort filter options. Rates are decimal fractions from 0 through 1. Never return Firebase UIDs except the opaque IDs needed for authorized navigation.

## Authorization and privacy

1. Verify the Firebase ID token in authentication middleware.
2. Require `reports.read` (or `*`) for overview and the category permission for each detailed route. Require `reports.export` in addition to the category permission for server exports.
3. Resolve permissions on the server for every request. Do not trust a role, permission, scholar ID, or cohort ID supplied by the browser.
4. Return only display name and operational email in scholar results. Exclude auth claims, token metadata, security state, private profile fields, and raw audit payloads.
5. Write an audit event for exports with actor, category, normalized filters, row count, and correlation ID—never the CSV contents.

Use `401` for missing/expired authentication, `403` for insufficient permission, `404` only for an unavailable route/resource, `422` for filter validation, `429` for protected expensive queries, and `500` with a correlation ID for generation failures.

## Aggregation plan (no N+1 reads)

Build each result from aggregate queries, batched reads, or denormalized summaries. Never fetch a page of scholars and then query assignments, attempts, readiness, and enrollments once per row.

Authoritative inputs should be confirmed against the backend's actual collection names:

- Firebase Auth/users: identity and enabled status; Firestore user profile: minimized display fields.
- enrollments/cohorts/challenges: active participation and membership.
- learning packs/assignments/progress: assigned, started, completed, overdue, and completion.
- question attempts: attempt and correct counts. Correct-rate flags are review signals, not proof of bad content.
- readiness assessments: score, band, source, and assessment timestamp; never infer readiness unless the product has a documented rule.
- mentor assignments/check-ins: coverage and activity, without ranking mentors by scholar outcomes.
- content/reviews/questions: publication and review issues.
- audit events: recent operational activity only when its schema is stable.

For modest data, issue Firestore aggregate/count queries in parallel and batch document references with `getAll`. For production volume, update daily summary documents transactionally or through an idempotent event consumer:

```text
reportSnapshots/daily/{yyyy-MM-dd}
challengeReportSummaries/{challengeId}
cohortReportSummaries/{cohortId}
learningPackReportSummaries/{learningPackId}
```

Store `updatedAtUtc`, source watermark, numerator, and denominator—not just percentages. Merge only summary documents in the requested range. Return the oldest relevant watermark as report freshness. Scheduled rebuilding must be idempotent and able to backfill a date. Live writes and snapshot jobs must use the same metric definitions.

## Metric definitions to approve before implementation

- **Active scholar:** enrolled and enabled, with qualifying activity in the date range.
- **Completion rate:** completed assignments divided by assignments due/active in the range; return `null` for zero denominator.
- **Accuracy:** correct scored attempts divided by scored attempts; exclude unanswered/unscored attempts explicitly.
- **Overdue:** incomplete assignment whose due timestamp is before the request's effective end/now.
- **Readiness rate:** scholars in the existing `Ready` band divided by scholars with sufficient assessment data.
- **Risk/health:** omit until named, configurable thresholds and reason codes are approved. Return reason codes with any classification.

Do not invent average duration, comparisons, readiness, risk, mentor quality, or content conclusions when the source fields/rules do not exist.

## Firestore indexes and paging

Derive index definitions from real query plans. Expected composite index dimensions include activity/assignment timestamp plus challenge/cohort/status, enrollment cohort plus active status, attempt timestamp plus learning-pack/question, and review status plus updated timestamp. Deploy indexes before enabling a filter. Use stable cursor paging ordered by an allow-listed field and document ID tie-breaker. Enforce a cost/range/page-size ceiling and cache permission-safe aggregate overview responses briefly (for example, 1–5 minutes).

## CSV/export

For at most one browser page, the frontend quotes fields, emits a UTF-8 BOM, uses readable headers, and applies current filters. For larger exports, create an asynchronous job document with `queued`, `processing`, `completed`, or `failed`; store the artifact in private Cloud Storage; return a short-lived authorized download URL; expire both artifact and job; and re-check permission on download. Filenames should be category and date based, such as `scholar-progress-2026-07-27.csv`.

## Required backend tests

- unauthenticated `401`, unauthorized category/export `403`, and wildcard access;
- strict dates, reversed/range-limit validation, ID validation, sort allow-list, and page-size ceiling;
- correct zero-data wrappers and `null` rates for zero denominators;
- fixed aggregation fixtures for counts/rates, filters, cursor stability, and no duplicate rows;
- query/read-count assertion proving no per-row queries;
- export escaping, data minimization, current filters, job state transitions, and authorization on download;
- snapshot watermark/freshness, idempotent rebuild, and stale snapshot behavior;
- Problem Details fields and correlation IDs.

Run the backend's actual `typecheck`, production `build`, unit/integration tests, emulator tests, and Firestore index deployment validation. This frontend repository cannot run or attest to those checks.
