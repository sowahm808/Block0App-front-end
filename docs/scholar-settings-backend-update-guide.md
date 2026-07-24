# Scholar settings backend update guide

This guide documents the backend work needed to persist and activate the `/settings` scholar settings experience.

## Frontend status

The frontend now renders five settings tabs without requiring backend data:

- Appearance: light theme, dark theme, system theme, reduced motion, and text-size preference.
- Accessibility: high contrast, larger text, reduce animation, screen-reader optimization, and keyboard-navigation help.
- Study preferences: preferred study time, default daily goal, reminder timing, show timer, and confirmation before answer submission.
- Privacy: privacy policy link, data-use summary, and a disabled download-data request action until backend support exists.
- Account support: support topic and message fields with disabled submission until backend support exists.

## Recommended routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/settings` | Return the authenticated scholar's current settings and backend capability flags. |
| `PUT` | `/settings` | Persist editable appearance, accessibility, and study preferences. |
| `GET` | `/settings/data-use-summary` | Return the scholar-facing summary of how account and learning data is used. |
| `POST` | `/settings/data-export-requests` | Request a downloadable account data export. Only expose when supported. |
| `POST` | `/settings/account-support-requests` | Create an account-support request from the settings page. |

All routes require the app's standard authenticated scholar session or JWT. Users may only read or mutate their own settings unless an administrative endpoint is added separately.

## `GET /settings` response

```json
{
  "appearance": {
    "theme": "System",
    "reducedMotion": false,
    "textSize": "Standard"
  },
  "accessibility": {
    "highContrast": false,
    "largerText": false,
    "reduceAnimation": false,
    "screenReaderOptimization": false,
    "keyboardNavigationHelp": true
  },
  "studyPreferences": {
    "preferredStudyTime": "Evening",
    "defaultDailyGoal": 25,
    "reminderTiming": "ThirtyMinutesBefore",
    "showTimer": true,
    "confirmBeforeAnswerSubmission": true
  },
  "privacy": {
    "dataUseSummary": "Block Zero uses profile, study activity, readiness, reward, and support data to personalize learning and operate cohorts.",
    "supportsDataExportRequests": false
  },
  "capabilities": {
    "canRequestDataExport": false,
    "canCreateAccountSupportRequest": false
  },
  "updatedAt": "2026-07-24T00:00:00Z"
}
```

### Enum values

- `appearance.theme`: `Light`, `Dark`, or `System`.
- `appearance.textSize`: `Standard`, `Large`, or `ExtraLarge`.
- `studyPreferences.preferredStudyTime`: `EarlyMorning`, `Morning`, `Afternoon`, `Evening`, or `LateNight`.
- `studyPreferences.reminderTiming`: `None`, `FifteenMinutesBefore`, `ThirtyMinutesBefore`, `OneHourBefore`, or `EveningBefore`.

## `PUT /settings` request

```json
{
  "appearance": {
    "theme": "System",
    "reducedMotion": false,
    "textSize": "Standard"
  },
  "accessibility": {
    "highContrast": false,
    "largerText": false,
    "reduceAnimation": false,
    "screenReaderOptimization": false,
    "keyboardNavigationHelp": true
  },
  "studyPreferences": {
    "preferredStudyTime": "Evening",
    "defaultDailyGoal": 25,
    "reminderTiming": "ThirtyMinutesBefore",
    "showTimer": true,
    "confirmBeforeAnswerSubmission": true
  }
}
```

Return the full updated `GET /settings` shape after persistence.

### Validation

- Reject unknown enum values with `400` validation errors.
- `defaultDailyGoal` must be an integer between `1` and `200`.
- Booleans should default server-side when omitted by older clients.
- Apply authorization before reading or writing settings so scholars cannot access another user's preferences.

## `GET /settings/data-use-summary`

Return a plain summary that can be displayed inside the Privacy tab.

```json
{
  "summary": "Block Zero uses profile, study activity, readiness, reward, and support data to personalize learning, operate cohorts, issue certificates, and improve support workflows.",
  "updatedAt": "2026-07-24T00:00:00Z"
}
```

## `POST /settings/data-export-requests`

Expose this route only when the backend can queue or generate account data exports. When unavailable, keep `capabilities.canRequestDataExport` set to `false` so the frontend keeps the action disabled.

Request body may be empty:

```json
{}
```

Recommended response:

```json
{
  "requestId": "der_123",
  "status": "Queued",
  "requestedAt": "2026-07-24T00:00:00Z",
  "estimatedCompletionAt": "2026-07-27T00:00:00Z"
}
```

Rate-limit this endpoint and avoid creating duplicate pending requests for the same user.

## `POST /settings/account-support-requests`

```json
{
  "topic": "AccountAccess",
  "message": "I need help updating my sign-in method."
}
```

### Support topic enum values

- `AccountAccess`
- `CohortOrProgress`
- `PrivacyOrData`
- `TechnicalIssue`

Recommended response:

```json
{
  "requestId": "asr_123",
  "status": "Open",
  "createdAt": "2026-07-24T00:00:00Z"
}
```

Validation requirements:

- `topic` is required and must be a known enum value.
- `message` is required after trimming and should be capped at 2,000 characters.
- Sanitize message content before storing or rendering it in staff tools.

## Error handling

Use the app's standard API error format with `status`, `message`, optional `correlationId`, and optional `validationErrors`. Return `400` for validation failures, `401` for missing or expired auth, `403` for cross-user access, `404` for unavailable optional capabilities, `409` for duplicate pending data export requests, and `429` for rate limits.
