# Capsule Study Backend Update Guide

## Frontend route

The study screen is served at `GET /capsules/:capsuleAttemptId` in the Angular app. The `capsuleAttemptId` route parameter is passed to the backend resume endpoint and is the only identifier the frontend needs to render the session.

## Required resume endpoint

Implement or update `GET /api/v1/capsule-attempts/:capsuleAttemptId/resume`.

### Success response

Return the active state for the authenticated learner's attempt:

```json
{
  "capsuleAttemptId": "attempt_123",
  "title": "Cardiac preload and afterload",
  "learningPackTitle": "Cardiovascular Physiology",
  "capsuleNumber": 2,
  "questionCount": 4,
  "completedQuestions": 1,
  "remainingSeconds": 510,
  "nextQuestion": {
    "attemptId": "question_attempt_456",
    "stem": "A patient has...",
    "choices": [{ "id": "choice_a", "label": "A", "text": "Increase venous return" }],
    "questionNumber": 2,
    "capsuleProgress": "2 of 4",
    "markedForReview": false
  },
  "complete": false
}
```

### Field notes

- `learningPackTitle` is shown as the header title.
- `capsuleNumber` is shown beside the capsule title. `sequence` is accepted as a fallback, but `capsuleNumber` is preferred.
- `questionCount` should be `4` for the standard capsule workflow.
- `completedQuestions` drives the progress bar.
- `nextQuestion.questionNumber` and `questionCount` render question progress such as `2 of 4`.
- `remainingSeconds` drives the timer. The frontend also accepts `timerRemainingSeconds`, `timeRemainingSeconds`, `elapsedSeconds`, or `timerElapsedSeconds` as fallbacks.
- `nextQuestion.markedForReview` drives the header review indicator and initializes the W1 checkbox.
- Do not include answer keys, rationales, explanations, or memory pearls on `nextQuestion` before submission. The frontend sanitizes accidental `correctChoiceId`, `correctRationale`, `incorrectRationales`, and `explanation` fields as a defense-in-depth measure.

## Submit endpoint

Implement or update `POST /api/v1/capsule-attempts/:capsuleAttemptId/question-attempts/:questionAttemptId/submit`.

### Request

```json
{
  "choiceId": "choice_a",
  "elapsedMs": 42000,
  "markedForReview": true,
  "submittedAtUtc": "2026-07-24T12:34:56.000Z"
}
```

### Success response

```json
{
  "selectedChoiceId": "choice_a",
  "correctChoiceId": "choice_c",
  "correct": false,
  "correctRationale": "Choice C is correct because...",
  "incorrectRationales": {
    "choice_a": "Choice A is incorrect because..."
  },
  "reference": "First Aid 2026, Cardiovascular Physiology",
  "memory": {
    "highYieldFact": "Preload increases with venous return.",
    "pearl": "Think of preload as ventricular stretch before contraction.",
    "clinicalRelevance": "Fluid resuscitation can increase preload.",
    "examTrap": "Do not confuse preload with afterload.",
    "mnemonic": "Pre = before pump"
  }
}
```

## Next-question endpoint

Implement or update `POST /api/v1/capsule-attempts/:capsuleAttemptId/next`.

- After W3 acknowledgement, return or prepare the next question in the same attempt.
- If more questions remain, the next resume call should return `complete: false` with the next W1 question.
- If all four questions are complete, the next resume call should return `complete: true` and omit `nextQuestion`.

## Validation and authorization rules

- Only the authenticated scholar who owns the attempt may resume or submit it.
- A submitted question attempt is immutable; reject duplicate submissions with `409 Conflict` unless the body is an idempotent replay of the stored answer.
- Validate that `choiceId` belongs to the question attempt.
- Persist `markedForReview` with the submitted answer for rehearsal and review flows.
- Persist elapsed time from `elapsedMs`; prefer server-side clocks for authoritative attempt start/end timestamps.
- Return `404 Not Found` when the attempt does not exist or is not visible to the learner.
- Return `410 Gone` or `409 Conflict` when an attempt is closed and cannot be resumed.

## Frontend behavior to support

The screen transitions through the three-whisper workflow:

1. **W1 — Challenge:** learner selects an answer and can mark the question for review.
2. **W2 — Correct Answer:** learner sees correctness, rationales, and reference after submission.
3. **W3 — Remember This:** learner reads the memory pearl, then advances to the next question.

The backend should keep each step recoverable. If the learner refreshes after submitting but before W3 acknowledgement, return enough state to avoid requiring a second answer submission or exposing a different question prematurely.
