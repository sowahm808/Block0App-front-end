# Rehearsal backend update guide

This guide defines the API contract needed by the `/rehearsal`, `/rehearsal/:attemptId`, and `/rehearsal/:attemptId/summary` frontend routes.

## Overview endpoint

`GET /rehearsals/available`

Returns summary cards and available rehearsal sessions.

```json
{
  "summary": {
    "missedQuestions": 8,
    "markedQuestions": 3,
    "weakTopics": 2,
    "memoryPearlsDue": 5
  },
  "sessions": [
    {
      "id": "session_weak_cardio",
      "attemptId": "attempt_123",
      "title": "Cardiology weak-topic refresh",
      "questionCount": 12,
      "estimatedMinutes": 18,
      "selectionReasons": ["previously_incorrect", "weak_topic"],
      "status": "in_progress"
    }
  ]
}
```

Supported `selectionReasons` values are `previously_incorrect`, `marked_for_review`, `weak_topic`, `not_reviewed_recently`, `memory_pearl_refresh`, and `assigned_by_administrator`.

## Start rehearsal

`POST /rehearsals/{sessionId}/start`

Creates or resumes a rehearsal attempt for the selected available session.

```json
{
  "attemptId": "attempt_123",
  "resumeUrl": "/rehearsal/attempt_123"
}
```

## Resume rehearsal attempt

`GET /rehearsal-attempts/{attemptId}`

Returns the current W1/W2/W3-compatible question payload and rehearsal progress metadata.

```json
{
  "attemptId": "attempt_123",
  "title": "Cardiology weak-topic refresh",
  "currentQuestion": 4,
  "totalQuestions": 12,
  "reviewCategoryCounts": {
    "previously_incorrect": 6,
    "marked_for_review": 2,
    "weak_topic": 4
  },
  "nextQuestion": {
    "attemptId": "question_attempt_456",
    "stem": "A patient presents with...",
    "choices": [
      { "id": "a", "label": "A", "text": "Choice text" }
    ],
    "questionNumber": 4,
    "capsuleProgress": "Question 4 of 12",
    "markedForReview": true,
    "selectionReasons": ["previously_incorrect", "marked_for_review"],
    "reviewCategory": "previously_incorrect",
    "topic": "Cardiology"
  }
}
```

The `nextQuestion` object should reuse the same safe learner-facing fields used by capsule W1 questions. Do not include protected answer keys, correct rationales, or incorrect rationales before answer submission.

## Submit answer

`POST /rehearsal-attempts/{attemptId}/questions/{questionAttemptId}/submit`

Request body matches the capsule question submit contract.

```json
{
  "choiceId": "a",
  "elapsedMs": 24000,
  "markedForReview": true,
  "submittedAtUtc": "2026-07-24T12:00:00Z"
}
```

Response body matches the W2/W3 `QuestionSubmitResult` contract, including correctness, rationales, reference, and memory-pearl fields.

## Acknowledge memory pearl

`POST /rehearsal-attempts/{attemptId}/questions/{questionAttemptId}/memory-pearl/acknowledge`

Records W3 memory-pearl review. Return `204 No Content` or an empty JSON object.

## Advance attempt

`POST /rehearsal-attempts/{attemptId}/next`

Advances to the next rehearsal item after W3 acknowledgement. Return `204 No Content`; the frontend reloads the attempt afterward. If no questions remain, return `404` or `409` and ensure the summary endpoint is available.

## Summary endpoint

`GET /rehearsal-attempts/{attemptId}/summary`

Returns session completion metrics and the recommended next action.

```json
{
  "attemptId": "attempt_123",
  "completedAtUtc": "2026-07-24T12:30:00Z",
  "questionsReviewed": 12,
  "improvedAnswers": 7,
  "remainingWeakTopics": ["Valvular murmurs", "Shock management"],
  "memoryPearlsReviewed": 12,
  "suggestedNextAction": "View readiness, then continue review on remaining weak topics."
}
```
