# Scholar Dashboard Backend Update Guide

This guide describes the backend contract needed by the `/dashboard` scholar dashboard. The frontend remains backward compatible with the existing response, but the richer dashboard is most useful when the API supplies the optional fields below.

## Endpoint

- `GET /dashboard`
- Authenticated scholar-only endpoint.
- Return the active challenge dashboard for the current user.

## Enrollment states

Set `enrollmentState` to drive the dashboard empty states:

| State | When to return | Required companion fields |
| --- | --- | --- |
| `active` | Scholar is enrolled and the challenge is currently in progress. | Standard dashboard fields. |
| `not_enrolled` | Scholar has no active enrollment. | No extra fields required; frontend shows Contact Support. |
| `not_started` | Enrollment exists but start date is in the future. | `startDate`, `countdown`, `preparationChecklist`. |
| `completed` | Scholar completed the challenge. | `completionMessage`, `certificateStatus`, `finalReadiness`. |

If `enrollmentState` is omitted, the frontend treats the payload as `active`.

## Recommended response shape

```json
{
  "scholarName": "Michael",
  "currentChallenge": "Block Zero Challenge",
  "currentDay": 5,
  "dailyTarget": 15,
  "dailyQuestionTarget": 60,
  "capsulesCompletedToday": 8,
  "questionsCompletedToday": 32,
  "overallCompletion": 42,
  "completedDays": 4,
  "currentStreak": 5,
  "readinessLevel": "On Track",
  "academicScore": 84,
  "engagementScore": 91,
  "readinessLastUpdated": "2026-07-24T12:30:00Z",
  "morningCheckInDone": true,
  "eveningCheckInDone": false,
  "teamName": "Team Alpha",
  "membersActiveToday": 7,
  "teamDailyCompletion": 68,
  "latestEncouragement": "Keep your streak alive today!",
  "rewardsEarned": 2,
  "raffleEntries": 6,
  "nextAvailableReward": "Consistency badge after evening check-in",
  "assignedLearningPacks": [
    { "externalId": "pack-day-5", "title": "Cardiology Foundations" }
  ],
  "requiredCapsules": "Complete capsules 9–15 from Cardiology Foundations",
  "scenarioAssignment": "Chest pain triage scenario",
  "rehearsalAssignment": "Review missed cardiovascular questions",
  "restDayInstructions": null,
  "recentActivity": [
    "Capsule completed: ECG Basics",
    "Reward earned: Daily Target Starter",
    "Teammate encouragement: Ana cheered your streak",
    "Readiness update: On Track",
    "Support response: Your schedule request was resolved"
  ],
  "continueUrl": "/capsules/current"
}
```

## Field notes

- Keep percentages as whole numbers from `0` to `100`.
- `dailyTarget` is the capsule target; `dailyQuestionTarget` is the question target.
- `assignedLearningPacks` may be strings or objects with `title` and `externalId`.
- `continueUrl` may be a full in-app path such as `/capsules/current` or a capsule identifier.
- Use ISO-8601 UTC strings for `readinessLastUpdated` so the frontend can format it later if needed.
- `restDayInstructions` should be omitted or `null` on normal study days.
- `recentActivity` should be newest first and should include activity across capsule completion, rewards, teammate encouragement, readiness, and support when available.

## Backward compatibility

The frontend falls back to these existing fields when newer fields are absent:

- `knowledgeAccuracy` for `academicScore`.
- `scenarioPerformance` for `engagementScore`.
- `teamActivity` for `latestEncouragement`.
- Derived completed days from `currentDay - 1`.
- Derived remaining capsules from `dailyTarget - capsulesCompletedToday`.

## Backend checklist

1. Add or extend a dashboard application query that joins enrollment, challenge day, check-ins, readiness, team activity, rewards, and activity feed data.
2. Return `not_enrolled` before querying challenge-day data when no active enrollment exists.
3. Return `not_started` when the active enrollment has a future start date.
4. Return `completed` after the final challenge completion status is recorded.
5. Add tests for all four enrollment states and the active sample response.
6. Ensure authorization prevents scholars from reading other scholars' dashboard data.
