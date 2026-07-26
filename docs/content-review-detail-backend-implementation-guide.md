# Content-review detail backend implementation guide

The frontend now treats the review document ID as an opaque route value and calls
`GET /api/v1/review/content/:reviewId`. This repository contains only the Angular client, so the backend endpoint could
not be implemented or verified here. Add the endpoint to the existing review router in the backend rather than creating
a second review route tree.

## Contract

Require the same `content.review` permission used by the queue. Look up the record by the review document's `id` (for
example, `review-LP01-C01-Q01`), not by `entityId`. A successful response may return the item directly or as `{ data:
item }`; returning the wrapper is recommended for consistency with the queue.

```http
GET /api/v1/review/content/review-LP01-C01-Q01
Authorization: Bearer <token>
Accept: application/json
```

```json
{
  "data": {
    "id": "review-LP01-C01-Q01",
    "entityType": "question",
    "entityId": "LP01-C01-Q01",
    "status": "draft",
    "title": "In the medical term cardiology...",
    "content": {
      "stem": "In the medical term cardiology...",
      "choices": [{ "id": "A", "label": "A", "text": "cardi" }],
      "explanation": {
        "correctChoiceId": "a",
        "correctRationale": "The root cardi means heart.",
        "memoryTip": "Cardi relates to the heart.",
        "reference": "Approved source citation"
      }
    }
  }
}
```

## Express implementation outline

Wire the parameter route after the queue handler but before a router wildcard. Reuse the backend's authentication,
permission middleware, repository, logger, and Problem Details helper names; the identifiers below are illustrative.

```ts
reviewRouter.get(
  '/content/:reviewId',
  requireAuthentication,
  requirePermission('content.review'),
  asyncHandler(async (req, res) => {
    const reviewId = req.params.reviewId?.trim();
    if (!reviewId) {
      return res.status(400).type('application/problem+json').json({
        type: 'https://api.example.com/problems/invalid-request',
        title: 'Invalid request',
        status: 400,
        detail: 'A review document ID is required.',
      });
    }

    // The framework has already URL-decoded req.params.reviewId. Validate length/format
    // according to the repository's opaque-ID rules; do not concatenate it into a query.
    const review = await contentReviewRepository.findByReviewId(reviewId);
    if (!review) {
      return res.status(404).type('application/problem+json').json({
        type: 'https://api.example.com/problems/content-review-not-found',
        title: 'Content review not found',
        status: 404,
        detail: `No content review exists for the supplied review ID.`,
        instance: req.originalUrl,
      });
    }

    return res.status(200).json({ data: review });
  }),
);
```

For Firestore, use a document lookup when the review ID is the document key (`collection.doc(reviewId).get()`). For a
relational store, use a parameterized `WHERE review_document_id = ?` query. In either case, map only the approved DTO
fields and do not expose internal moderation or audit data.

## Required backend tests

Add integration tests proving that an authorized request returns exactly one matching record; missing records return
`404` with `Content-Type: application/problem+json`; unauthenticated and unauthorized callers receive `401` and `403`;
encoded/invalid IDs cannot inject a query or escape the route; and the handler never delegates to the health endpoint.
Also assert both uppercase choice IDs and lowercase `correctChoiceId` survive serialization unchanged—the client handles
the case-insensitive comparison.

Finally, exercise the endpoint through the deployed reverse proxy to confirm `/api/v1/review/content/:reviewId` is sent
to Express rather than an SPA or health fallback, and include this path in API/OpenAPI documentation and monitoring.

## Reviewer decision endpoints

Implement these handlers in the same authenticated review router as the detail endpoint. The Angular `ApiService` adds
the `/api/v1` base path, so the client paths and public HTTP paths are:

| Decision        | Client path                                      | Public path                                             | Resulting status    | Notes    |
| --------------- | ------------------------------------------------ | ------------------------------------------------------- | ------------------- | -------- |
| Approve         | `POST /review/content/:reviewId/approve`         | `POST /api/v1/review/content/:reviewId/approve`         | `approved`          | Optional |
| Request changes | `POST /review/content/:reviewId/request-changes` | `POST /api/v1/review/content/:reviewId/request-changes` | `changes_requested` | Required |
| Reject          | `POST /review/content/:reviewId/reject`          | `POST /api/v1/review/content/:reviewId/reject`          | `rejected`          | Required |

All three accept JSON shaped as `{ "notes": "Reviewer comments" }` and return the updated `ContentReviewItem`, either
directly or in the existing `{ "data": item }` envelope. Do not introduce a parallel route contract if the backend
already provides equivalent action routes; update the frontend service to that established contract instead.

### Handler workflow

Each route must apply authentication and `requirePermission('content.review')`, validate the decoded `reviewId` using
the project's opaque-ID rules, and validate that `notes` is a string. Trim notes before persistence; reject blank notes
for `request-changes` and `reject`. Within one transaction:

1. Load the review record by review document ID and return `404` if it does not exist.
2. Validate the current-to-target status transition. Approved and rejected records are final unless the product has an
   explicit, separately authorized reopening workflow.
3. If optimistic concurrency is enabled, compare the expected version supplied using the project's existing mechanism
   (request DTO, `If-Match`, or ETag) and return `409` on mismatch.
4. Set `status` to the value in the table, persist `notes`, set `reviewerId` from the authenticated principal (never
   from request JSON), and set `reviewedAtUtc` to the server's current UTC timestamp.
5. Increment `version` when the model uses optimistic concurrency, save atomically, and return the stored record.

Approval changes only the review record. It must **not** publish or mutate the underlying learning-pack content unless
the existing domain workflow already defines that operation as part of approval. Review approval and publication
should otherwise remain separately authorized and auditable actions.

### Response and error contract

Use the API's normal Problem Details representation and preserve these semantics:

- `400` — malformed JSON, invalid/blank review ID, or a non-string notes value.
- `401` — missing or expired authentication.
- `403` — authenticated principal lacks `content.review`.
- `404` — no review document exists for `reviewId`.
- `409` — optimistic-concurrency version conflict.
- `422` — required notes are blank or the status transition is invalid.

Never fall through to, proxy to, or use the health endpoint as a fallback for any review route.

### Decision-route test checklist

Add integration tests for every action that verify permission enforcement, opaque ID validation, persistence, and the
returned DTO. Assert approve accepts empty notes; request-changes and reject reject whitespace-only notes with `422`;
the statuses are exactly `approved`, `changes_requested`, and `rejected`; `reviewerId` cannot be spoofed; timestamps are
UTC; versions increment and stale writes return `409` where applicable; final-state transitions are rejected; missing
records return `404`; and approval does not change the publication state of the underlying content. Include a routing
test proving these URLs are handled by the review router and never invoke the health handler.
