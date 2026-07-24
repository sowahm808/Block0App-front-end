# W1-W3 capsule backend update guide

This guide documents backend changes required by the audited frontend W1 Challenge, W2 Correct Answer, and W3 Remember This flow.

## Resume payload

`GET /api/v1/capsule-attempts/:capsuleAttemptId/resume` should continue returning the capsule attempt plus `nextQuestion`. The frontend hides answer-protection fields before display, so do not include correct answers or rationales on W1.

`nextQuestion` should include:

- `attemptId`, `questionNumber`, `capsuleProgress`, `stem`, `markedForReview`
- `choices: [{ id, label, text }]` for single-answer and multiple-select questions
- `answerType`: `single_answer`, `multiple_select`, `numeric`, or `short_response`
- `minSelections` and `maxSelections` for constrained multiple-select questions
- `unit` for numeric questions when a unit should be displayed
- `maxLength` for short-response questions
- `figureUrl` and optional `figureAlt` for supporting images
- `tableHtml` for sanitized supporting tables
- `supportingMediaUrl` for optional media links

## Submit answer

The frontend posts once to:

`POST /api/v1/capsule-attempts/:capsuleAttemptId/question-attempts/:questionAttemptId/submit`

Expected body fields:

- `choiceId` for single-answer questions
- `choiceIds` for multiple-select questions
- `numericAnswer` for numeric-response questions
- `shortAnswer` for short-response questions
- `elapsedMs`
- `markedForReview`
- `submittedAtUtc`

Backend validation should reject duplicate submissions for the same `questionAttemptId`, require at least one selected choice, enforce multiple-select minimum and maximum selection counts, and validate numeric answers as finite numbers.

## Submission result

Return W2/W3 content only after accepting the submission:

- `correct`: boolean
- `selectedChoiceId` and optionally `selectedChoiceIds`
- `correctChoiceId` and optionally `correctChoiceIds`
- `correctRationale`
- `incorrectRationales`: map of option id/label to explanation
- `referenceTitle`
- `reference` source text
- `referenceUrl` optional external link
- `memory.highYieldFact`
- `memory.pearl`
- `memory.clinicalRelevance`
- `memory.examTrap`
- `memory.mnemonic` when available

## Memory acknowledgement

Add:

`POST /api/v1/question-attempts/:attemptId/acknowledge-memory`

This endpoint should mark the memory pearl as reviewed for the submitted question attempt. The frontend keeps **Next Question** disabled until the acknowledgement checkbox is checked and this request succeeds.

Recommended response: `204 No Content` or a small `{ acknowledged: true, acknowledgedAtUtc }` JSON payload.

## State protections

- Never expose correct answer data in W1 resume payloads.
- Make submission idempotent or return a clear duplicate-submission error once a question is already submitted.
- Do not allow memory acknowledgement before a successful submission.
- Do not advance to the next question until memory acknowledgement is stored.
