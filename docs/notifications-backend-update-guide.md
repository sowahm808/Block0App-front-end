# Notifications Backend Update Guide

This guide defines the backend work needed for the frontend notification center at `/notifications` and notification preferences at `/notification-preferences`.

## Notification Center API

### `GET /notifications`

Return notifications for the authenticated user, newest first.

```json
{
  "notifications": [
    {
      "id": "notif_123",
      "type": "study",
      "title": "Continue today's capsule",
      "message": "You have one study activity remaining for today.",
      "createdAt": "2026-07-24T14:30:00.000Z",
      "readAt": null,
      "action": { "label": "Continue Study", "route": "/challenge" }
    }
  ]
}
```

Supported `type` values are `study`, `team`, `support`, `rewards`, `certificates`, and `system`. Supported action labels include `Continue Study`, `View Team`, `View Reward`, `View Certificate`, and `Open Support Request`.

### `POST /notifications/mark-all-read`

Mark every notification for the authenticated user as read. Return either `204 No Content` or a count payload.

```json
{ "markedRead": 8 }
```

## Notification Preferences API

### `GET /notification-preferences`

Return the authenticated user's channel and topic settings.

```json
{
  "preferences": {
    "inApp": true,
    "email": true,
    "push": false,
    "studyReminders": true,
    "teamActivity": true,
    "supportUpdates": true,
    "rewardUpdates": true,
    "certificateUpdates": true,
    "quietHours": {
      "enabled": false,
      "startTime": "21:00",
      "endTime": "07:00",
      "timeZone": "America/New_York"
    }
  }
}
```

### `PUT /notification-preferences`

Persist the same preference shape returned by `GET /notification-preferences`. Validate `startTime` and `endTime` as `HH:mm`, and store `timeZone` as a valid IANA time zone.

## Push Permission Contract

The browser permission prompt must be user initiated. The frontend will not call `Notification.requestPermission()` until the user clicks **Enable Push Notifications**. Backend push subscription endpoints can be added separately, but should only save a subscription after browser permission is granted.

## Implementation Notes

- Scope all reads and writes to the authenticated user.
- Keep notification records immutable except for read state fields such as `readAt`.
- Apply quiet hours before sending email or push notifications; in-app notifications should still be recorded.
- Consider pagination once notification history grows beyond the initial page.
