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
