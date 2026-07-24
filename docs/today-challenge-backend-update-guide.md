# Today’s Challenge backend update guide

The frontend route `/challenge/today` now renders a purpose-built daily challenge screen from `GET /challenges/current/today`. Replace placeholder or dashboard-shaped payloads with the contract below so the screen can show the day header, announcement card, goal panel, assigned learning packs, check-in status, actions, and locked release state.

## Endpoint

```http
GET /challenges/current/today
Authorization: Bearer <access-token>
```

Return the current scholar’s cohort-adjusted daily challenge. The response should already be personalized for the authenticated scholar, including their pack progress, check-in completion, streak, and next study URL.

## Active day response

```json
{
  "studyDay": 5,
  "phaseTitle": "Knowledge Mastery",
  "dailyTitle": "High-yield cardiovascular foundations",
  "encouragementMessage": "You are building the habits that make exam day feel familiar.",
  "administrativeAnnouncement": "Live review starts at 7:00 PM cohort time.",
  "teamProgressMessage": "Team Delta is 68% complete for today.",
  "targetCapsules": 15,
  "targetQuestions": 60,
  "targetStudyMinutes": 90,
  "completionPercentage": 42,
  "currentStreak": 5,
  "morningCheckInDone": false,
  "eveningCheckInDone": false,
  "continueUrl": "/capsules/attempt-day-05-pack-12",
  "currentCapsuleUrl": "/capsules/attempt-day-05-pack-12-capsule-03",
  "locked": false,
  "assignedLearningPacks": [
    {
      "id": "lp_day_05_12",
      "packNumber": 12,
      "title": "Cardiovascular Pharmacology",
      "topic": "Antihypertensives and heart failure therapy",
      "capsuleCount": 5,
      "completedCapsules": 2,
      "status": "In progress",
      "continueUrl": "/learning-packs/lp_day_05_12"
    }
  ]
}
```

### Field notes

| Field | Requirement |
| --- | --- |
| `studyDay` | Integer challenge day used in the header (`Study Day 5`). |
| `phaseTitle` | Phase label appended to the header, for example `Knowledge Mastery`. |
| `dailyTitle` | Title shown in the announcement card. |
| `encouragementMessage` | Scholar-facing coaching copy. |
| `administrativeAnnouncement` | Operational announcement from admins or cohort staff. |
| `teamProgressMessage` | Short team progress summary. |
| `targetCapsules` | Daily capsule target. |
| `targetQuestions` | Daily question target. |
| `targetStudyMinutes` | Daily study time target in minutes. |
| `completionPercentage` | Number from `0` to `100`; frontend clamps out-of-range values defensively. |
| `currentStreak` | Current consecutive-day study/check-in streak. |
| `assignedLearningPacks[]` | Ordered packs for the day. |
| `assignedLearningPacks[].packNumber` | Display number for the pack card. |
| `assignedLearningPacks[].title` | Pack title. |
| `assignedLearningPacks[].topic` | Topic/subtitle. |
| `assignedLearningPacks[].capsuleCount` | Total capsules in the pack. |
| `assignedLearningPacks[].completedCapsules` | Scholar-specific completed capsules. |
| `assignedLearningPacks[].status` | Display label such as `Not started`, `In progress`, or `Complete`. |
| `assignedLearningPacks[].continueUrl` | Route for the pack button. |
| `morningCheckInDone` / `eveningCheckInDone` | Boolean completion status for daily check-ins. |
| `continueUrl` | Route used by the global “Start Today’s Study” action. |
| `currentCapsuleUrl` | Optional route that lets the frontend label the CTA as “Continue Current Capsule.” |

## Locked day response

When the scholar has access to the route but today’s content has not been released, still return `200 OK` with `locked: true`. Include release metadata so the frontend can explain when content opens.

```json
{
  "studyDay": 5,
  "phaseTitle": "Knowledge Mastery",
  "dailyTitle": "Day 5 content pending release",
  "encouragementMessage": "Today’s plan will unlock on the cohort schedule.",
  "administrativeAnnouncement": "Check back at the release time below.",
  "teamProgressMessage": "Team progress starts after release.",
  "targetCapsules": 0,
  "targetQuestions": 0,
  "targetStudyMinutes": 0,
  "completionPercentage": 0,
  "currentStreak": 4,
  "morningCheckInDone": false,
  "eveningCheckInDone": false,
  "assignedLearningPacks": [],
  "locked": true,
  "releaseAtUtc": "2026-07-24T13:00:00Z",
  "cohortTimeZone": "America/New_York"
}
```

## Backend implementation checklist

1. Resolve the authenticated scholar’s active enrollment and cohort.
2. Calculate the cohort-local challenge day and release window.
3. If unreleased, return the locked response with `releaseAtUtc` and `cohortTimeZone`.
4. If released, load the day plan, assigned learning packs, capsule totals, and scholar progress.
5. Derive `completionPercentage` from completed daily requirements, rounded to a whole number between `0` and `100`.
6. Resolve check-ins for the scholar and cohort-local date.
7. Resolve a stable `continueUrl` and, when applicable, `currentCapsuleUrl`.
8. Include admin/cohort announcement and team progress text; return empty strings only if no announcement exists.
9. Add contract tests for active and locked responses.
