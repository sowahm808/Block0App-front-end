# Capsule Start Backend Update Guide

## Endpoint

Implement `POST /api/v1/capsules/:capsuleId/start` for starts triggered from the learning-pack detail page.

## Request contract

- Path parameter: `capsuleId` is the stable capsule identifier returned in learning-pack capsule rows.
- Body: `{}`; no user answer data is sent when starting.
- Header: `Idempotency-Key` is required. Treat repeated requests with the same authenticated user, capsule id, and key as the same start request.

## Success response

Return `200 OK` or `201 Created` with:

```json
{
  "capsuleAttemptId": "attempt_123",
  "capsuleId": "capsule_3",
  "status": "active",
  "resumeUrl": "/capsules/attempt_123"
}
```

`capsuleAttemptId` is required. `resumeUrl` is optional; if omitted, the frontend navigates to `/capsules/{capsuleAttemptId}`.

## Active attempt behavior

If the learner already has an active attempt for the capsule, do not create a duplicate attempt. Return `409 Conflict` with one of these fields so the frontend can resume it:

```json
{
  "message": "You already have an active attempt.",
  "capsuleAttemptId": "attempt_123"
}
```

or

```json
{
  "message": "You already have an active attempt.",
  "activeAttemptId": "attempt_123"
}
```

The frontend also supports `continueUrl`, `activeAttemptId`, or `activeCapsuleAttemptId` on learning-pack capsule rows for capsules whose status is `in_progress` or `active`.

## Learning-pack detail data

Each capsule row should include enough metadata for the start dialog and resume fallback:

- `id` or `capsuleId` or `externalId`
- `sequence` or `capsuleNumber`
- `title`
- `questionCount` or `totalQuestions` (expected value: 4)
- `estimatedMinutes` when available
- `status` or `progressStatus`
- `continueUrl`, `activeAttemptId`, or `activeCapsuleAttemptId` when an attempt is active

## Business rules

- Each capsule contains four questions.
- Submitted answers cannot be changed after submission.
- Each question proceeds through W1, W2, and W3 in the existing attempt flow.
- Authorization must ensure the learner can access the parent learning pack and capsule before starting or resuming an attempt.
