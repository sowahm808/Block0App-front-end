# Capsule Completion Screen Backend Update Guide

## Frontend audit

The Angular capsule route is `GET /capsules/:capsuleAttemptId` and renders `CapsulePage`. The page calls `GET /api/v1/capsule-attempts/:capsuleAttemptId/resume` through `CapsuleService.resume()` and switches to the completion screen when the response has `complete: true`.

The completion screen now displays:

- Completion summary
  - Capsule completed
  - Questions answered
  - Correct answers
  - Completion time
  - Questions marked for review
- Pack progress
- Daily goal progress
- Buttons
  - Start Next Capsule
  - Return to Learning Pack
  - End Study Session
  - View Today’s Progress
- Reward notification, when earned:
  - `You earned a raffle entry for completing today’s capsule target.`

## Endpoint to update

Update `GET /api/v1/capsule-attempts/:capsuleAttemptId/resume` so completed attempts return the existing capsule resume envelope plus completion metadata.

When `complete` is `true`, omit `nextQuestion` and include the fields below.

```json
{
  "capsuleAttemptId": "attempt_123",
  "title": "Chest Pain Triage",
  "learningPackTitle": "Day 1 Foundations",
  "learningPackId": "pack_day_1",
  "capsuleNumber": 2,
  "questionCount": 4,
  "completedQuestions": 4,
  "correctAnswers": 3,
  "completionTimeSeconds": 612,
  "completedAtUtc": "2026-07-24T15:42:31Z",
  "markedForReviewCount": 1,
  "packProgress": {
    "completedCapsules": 2,
    "totalCapsules": 6,
    "progressPercentage": 33
  },
  "dailyGoalProgress": {
    "completedCapsules": 2,
    "targetCapsules": 2,
    "progressPercentage": 100
  },
  "reward": {
    "earnedRaffleEntry": true,
    "raffleEntriesAwarded": 1,
    "message": "You earned a raffle entry for completing today’s capsule target."
  },
  "nextCapsuleUrl": "/capsules/start/capsule_3",
  "learningPackUrl": "/learning-packs/pack_day_1",
  "todayProgressUrl": "/dashboard",
  "endSessionUrl": "/dashboard",
  "complete": true
}
```

## Field requirements

| Field | Required when complete? | Frontend behavior |
| --- | --- | --- |
| `questionCount` | Yes | Denominator for questions and accuracy summary. |
| `completedQuestions` | Yes | Shows questions answered. Should equal `questionCount` for completed attempts. |
| `correctAnswers` | Recommended | Shows `correctAnswers/questionCount`; otherwise frontend shows `Pending`. |
| `completionTimeSeconds` | Recommended | Shows formatted `m:ss`; fallback uses elapsed timer fields; otherwise `Not tracked`. |
| `completedAtUtc` | Recommended | Shows completion date; otherwise `Done`. |
| `markedForReviewCount` | Recommended | Shows marked-review count; fallback is `0`. |
| `packProgress.completedCapsules` | Recommended | Shows completed capsules in the pack. |
| `packProgress.totalCapsules` | Recommended | Shows total capsules in the pack. |
| `packProgress.progressPercentage` | Optional | Used directly when provided; otherwise computed from completed/total. |
| `dailyGoalProgress.completedCapsules` | Recommended | Shows completed daily capsules. |
| `dailyGoalProgress.targetCapsules` | Recommended | Shows daily capsule target. |
| `dailyGoalProgress.progressPercentage` | Optional | Used directly when provided; otherwise computed from completed/target. |
| `reward.earnedRaffleEntry` | Required for reward banner | When `true`, displays reward notification. |
| `reward.message` | Optional | Overrides default raffle-entry text. |
| `nextCapsuleUrl` | Recommended if another capsule is available | Enables `Start Next Capsule`; if absent/null, the button is disabled. |
| `learningPackUrl` or `learningPackId` | Recommended | Drives `Return to Learning Pack`; fallback is `/learning-packs`. |
| `todayProgressUrl` | Optional | Drives `View Today’s Progress`; fallback is `/dashboard`. |
| `endSessionUrl` | Optional | Drives `End Study Session`; fallback is `/dashboard`. |

## Completion logic

- Mark the capsule attempt complete only after the final question has a submitted answer and W3 memory acknowledgement has been recorded.
- Persist `completedAtUtc` once and return the same timestamp on later resume calls.
- Count `markedForReviewCount` from the submitted question-attempt records, not only the final question.
- Award the raffle entry idempotently. If the same completed attempt is resumed again, return the already-earned reward state without creating another entry.
- Set `reward.earnedRaffleEntry` only when completing this capsule satisfies today’s capsule target.

## Start Next Capsule behavior

The existing frontend button calls `POST /api/v1/capsule-attempts/:capsuleAttemptId/next` and then resumes the current route. Backend options:

1. If the next capsule should open in the same attempt flow, return the next resumable capsule attempt from the next resume call.
2. If the backend uses separate capsule attempt ids, return a redirect/resume URL from `next` or keep `nextCapsuleUrl` populated for a future frontend navigation enhancement.

For the current implementation, keep `POST /next` idempotent and safe to call when the current capsule is complete.

## Validation checklist

- Completed resume payload has `complete: true` and no `nextQuestion`.
- The summary counts are scoped to the completed capsule attempt.
- Pack progress is scoped to the learning pack that owns the capsule.
- Daily goal progress is scoped to the scholar’s current local day/time zone.
- Raffle entries are awarded at most once per eligible daily target completion.
