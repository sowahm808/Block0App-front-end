# Raffle Entries Backend Update Guide

## Frontend route

The scholar raffle entries screen is available at `GET /raffle-entries` in the Angular app and expects an authenticated Scholar user. The frontend calls the backend `GET /raffle-entries` endpoint when the route loads.

## Required response shape

Return either a raw array of raffle entries or an object containing a `summary` and an `entries` or `items` array. The object form is preferred because it powers the route summary cards.

```json
{
  "summary": {
    "totalActiveEntries": 3,
    "currentRaffle": "July Scholar Momentum Drawing",
    "drawingDate": "2026-07-31",
    "rulesUrl": "/rewards/raffle-rules"
  },
  "entries": [
    {
      "id": "entry-123",
      "entryReason": "Completed today’s capsule target",
      "dateEarned": "2026-07-24",
      "sourceActivity": "Capsule Completion",
      "raffleName": "July Scholar Momentum Drawing",
      "status": "active"
    }
  ]
}
```

## Field contract

### Summary

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `totalActiveEntries` | number | Yes | Count only entries with `active` status for the current drawing. |
| `currentRaffle` | string | Yes | Learner-facing raffle name. Use `No active raffle` only when no drawing is configured. |
| `drawingDate` | ISO date string or display string | Yes | Date displayed in the summary card. Prefer `YYYY-MM-DD` for consistency. |
| `rulesUrl` | string | Yes | Link to raffle rules. It can be an app route or an absolute URL. |

### Entry card

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Stable unique entry identifier. |
| `entryReason` | string | Yes | Short explanation of why the scholar earned the entry. |
| `dateEarned` | ISO date string | Yes | Date the eligible activity awarded the entry. |
| `sourceActivity` | string | Yes | Activity or workflow that produced the entry, such as `Capsule Completion`. |
| `raffleName` | string | Yes | Raffle this entry belongs to. |
| `status` | enum | Yes | One of `active`, `drawn`, `expired`, or `void`. |

## Empty and error states

Return `200 OK` with an empty `entries` array when the scholar has not earned entries yet. Return standard authenticated API errors (`401`, `403`) for missing or invalid scholar access, and use `5xx` only for unexpected backend failures.

## Business rule reminder

Raffle entries provide eligibility for a drawing. They do not guarantee a prize. Backend award logic should be idempotent so repeated completion or retry events do not create duplicate entries for the same eligible activity.
