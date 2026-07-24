# Clinical Scenarios Backend Guide

This guide defines the backend contract needed by the scholar clinical scenario frontend routes:

- `GET /scenarios` for the Clinical Scenario List at `/scenarios`.
- `GET /scenarios/:scenarioId` for Clinical Scenario Details at `/scenarios/:scenarioId`.
- `POST /scenarios/:scenarioId/attempts` to create or resume an attempt.
- `GET /scenario-attempts/:attemptId` for the Scenario Attempt Screen at `/scenario-attempts/:attemptId`.
- `POST /scenario-attempts/:attemptId/answers` to submit the current answer and receive the next allowed question.
- `POST /scenario-attempts/:attemptId/submit` to submit the completed scenario after confirmation.
- `GET /scenario-attempts/:attemptId/review` for Scenario Review at `/scenario-attempts/:attemptId/review`.

## Authorization

All endpoints should require an authenticated Scholar unless an administrator/reviewer endpoint is added separately. The backend must ensure the attempt belongs to the current scholar before returning patient details, answers, scores, or review content.

## Scenario list response

Return summary metrics and filterable scenario cards.

```json
{
  "summary": {
    "availableScenarios": 12,
    "completedScenarios": 4,
    "currentDayTarget": 2,
    "averagePerformance": 82,
    "timedScenariosPending": 3
  },
  "scenarios": [
    {
      "id": "sepsis-triage",
      "title": "Febrile hypotension in the ED",
      "clinicalCategory": "Emergency Medicine",
      "clinicalDomain": "Infectious Disease",
      "difficulty": "Moderate",
      "questionCount": 6,
      "mode": "timed",
      "estimatedMinutes": 18,
      "status": "in_progress",
      "score": null,
      "scorePermitted": false,
      "activeAttemptId": "attempt-sepsis-1"
    }
  ]
}
```

Supported values: `status` is `not_started`, `in_progress`, or `completed`; `mode` is `timed` or `untimed`; `difficulty` should be a stable display label such as `Easy`, `Moderate`, or `Hard`.

## Scenario details response

Return the title, clinical domain, difficulty, estimated time, number of questions, mode, instructions, and attempt rules. Timed scenarios should set `mode: "timed"`; the frontend warns that the timer begins when Start Scenario is selected.

## Attempt response

The attempt payload should include header state, patient summary, vignette, accessible lab data, supporting media metadata, and the allowed question set. If `sequentialProgressionRequired` is true, only the current question should be returned or the frontend will only render the current question.

Each lab row needs `test`, `result`, `referenceRange`, and `abnormal`. Media rows should identify whether the item is an `image`, `diagram`, or `chart` and include accessible `title` and `description` text.

## Answer and submit behavior

`POST /scenario-attempts/:attemptId/answers` should persist the answer, update `saveStatus`, and return the next current question when sequential progression is required. `POST /scenario-attempts/:attemptId/submit` should finalize scoring only after the client confirmation action and should return the review route or attempt status.

## Review response

The review response must include overall score, questions correct, time taken, clinical domain performance, per-question scholar answer, correct answer, rationale, clinical reasoning explanation, and reference. Include `rehearsalAvailable` to enable Start Rehearsal.
