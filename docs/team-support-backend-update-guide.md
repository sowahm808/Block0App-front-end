# Team Dashboard and Support Requests Backend Update Guide

This guide defines the backend contract needed by the frontend routes `/team` and `/team/support`.

## Privacy requirements

The team dashboard response must be privacy-filtered before it reaches the client. Do not include:

- Answers or answer selections.
- Scores, percentages tied to assessment performance, or rankings.
- Confidence ratings.
- Detailed weaknesses, missed objectives, or remediation details.
- Private support descriptions, mentor notes, or sensitive support details.

Only expose the help-request indicator when the requesting scholar is authorized to see that a teammate has asked for help.

## `GET /teams`

Return the signed-in scholar's team dashboard. The frontend accepts either the object below or an envelope that contains the member array in `items`, but the object form is preferred.

```json
{
  "teamName": "Team Nightingale",
  "cohort": "July 2026",
  "mentor": "Avery Smith",
  "progress": "On track",
  "membersActiveToday": "4 active today",
  "teamTargetCompleted": "75% complete",
  "totalStreakDays": "42 days",
  "encouragementActivity": "8 encouragements this week",
  "members": [
    {
      "id": "usr_123",
      "displayName": "Jordan Lee",
      "avatarUrl": "https://cdn.example.com/avatar.jpg",
      "completedToday": true,
      "studyStreak": 9,
      "participation": "Active today",
      "helpRequest": "Help requested"
    }
  ]
}
```

### Allowed member values

- `displayName`: required.
- `avatarUrl`: optional; frontend falls back to initials.
- `completedToday`: boolean.
- `studyStreak`: number of days.
- `participation`: `Active today`, `Recently active`, or `Needs check-in`.
- `helpRequest`: `Help requested`, `No help request`, or omit/return `Hidden` when the viewer is not authorized.

## Team member actions

Create endpoints for privacy-safe teammate actions. Recommended shape:

- `POST /teams/members/{memberId}/encouragements`
- `POST /teams/members/{memberId}/check-ins`
- `POST /teams/members/{memberId}/celebrations`

Payloads should accept only the fields shown in the UI:

```json
{ "messageTemplate": "Keep going", "optionalNote": "Proud of your consistency." }
```

```json
{ "message": "Checking in to see how today is going." }
```

```json
{ "achievement": "Streak milestone", "optionalMessage": "Great work." }
```

Reject or redact payload content that includes answers, scores, confidence ratings, detailed weaknesses, or private support details.

## `POST /support-requests`

Create a support request for the signed-in scholar.

Required fields:

- `category`: `Academic`, `Technical`, `Motivation`, `Time management`, `Challenge access`, `Personal`, or `Other`.
- `subject`: non-empty text.
- `description`: non-empty textarea content.
- `urgency`: `Low`, `Normal`, or `High`.

Optional fields:

- `preferredResponseMethod`.
- `allowMentorContact`: boolean.

Do not use emergency or crisis terminology in validation messages unless the product has a defined escalation protocol.

## `GET /support-requests/mine`

Return the signed-in scholar's support requests.

```json
{
  "items": [
    {
      "id": "sr_123",
      "subject": "Need help opening today's challenge",
      "category": "Technical",
      "submittedDate": "2026-07-24T12:00:00Z",
      "status": "Submitted",
      "assignedMentor": "Avery Smith",
      "lastUpdate": "2026-07-24T12:00:00Z"
    }
  ]
}
```

Status values must be one of:

- `Submitted`
- `Assigned`
- `In Progress`
- `Waiting for Scholar`
- `Resolved`
- `Closed`

The frontend displays `Submitted`, `Assigned`, `In Progress`, and `Waiting for Scholar` in the Open Requests tab, and `Resolved` or `Closed` in the Resolved Requests tab.
