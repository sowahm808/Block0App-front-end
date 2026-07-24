# Rewards Backend Update Guide

## Frontend route

The scholar rewards screen is available at `GET /rewards` in the Angular app and expects an authenticated Scholar user. The frontend calls the backend `GET /rewards` endpoint when the route loads.

## Required response shape

Return either a raw array of rewards or an object containing `rewards` or `items`.

```json
{
  "rewards": [
    {
      "id": "badge-week-1",
      "name": "Week 1 Momentum Badge",
      "description": "Complete the first seven daily challenge activities.",
      "type": "digital_badge",
      "earnedDate": "2026-07-08",
      "progressCurrent": 7,
      "progressTarget": 7,
      "eligibilityRequirement": "Finish every scheduled Week 1 activity.",
      "status": "earned"
    }
  ]
}
```

## Field contract

| Field                    | Type                    | Required | Notes                                                                                              |
| ------------------------ | ----------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `id`                     | string                  | Yes      | Stable unique reward identifier.                                                                   |
| `name`                   | string                  | Yes      | Display name shown on each reward card.                                                            |
| `description`            | string                  | Yes      | Short learner-facing explanation.                                                                  |
| `type`                   | enum                    | Yes      | One of `digital_badge`, `recognition`, `raffle_entry`, `certificate_milestone`, `physical_reward`. |
| `earnedDate`             | ISO date string or null | Yes      | Use `null` until earned.                                                                           |
| `progressCurrent`        | number                  | Yes      | Current progress toward eligibility.                                                               |
| `progressTarget`         | number                  | Yes      | Target required for eligibility. Use a positive integer when possible.                             |
| `eligibilityRequirement` | string                  | Yes      | Clear rule explaining how the scholar qualifies.                                                   |
| `status`                 | enum                    | Yes      | One of `earned`, `in_progress`, `locked`.                                                          |

## Filtering behavior

The frontend provides client-side tabs for `Earned`, `In Progress`, and `All Rewards`. The backend can return the full scholar reward set in one response. If server-side filtering is added later, preserve the full response contract and add optional query parameters such as `?status=earned`.

## Empty and error states

Return `200 OK` with an empty array when no rewards are configured. Return standard authenticated API errors (`401`, `403`) for missing or invalid scholar access, and use `5xx` only for unexpected backend failures.
