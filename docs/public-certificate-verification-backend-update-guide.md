# Public Certificate Verification Backend Update Guide

## Route and endpoint

Frontend route: `GET /certificate/verify/:verificationCode`

Backend API endpoint expected by the frontend:

```http
GET /public/certificates/verify/{verificationCode}
```

The endpoint must be public and must not require scholar authentication.

## Request

| Field              | Type   | Required | Validation                                                 |
| ------------------ | ------ | -------- | ---------------------------------------------------------- |
| `verificationCode` | string | Yes      | 1-500 characters; letters, numbers, and dashes recommended |

## Successful valid response

Return HTTP `200` with only public certificate fields:

```json
{
  "status": "valid",
  "scholarDisplayName": "Jordan P.",
  "challengeName": "Block Zero Ready Challenge",
  "issueDate": "2026-07-24",
  "certificateNumber": "B0-2026-000123",
  "issuingOrganization": "Mind Unlocking Academy",
  "correlationId": "01J4..."
}
```

## Revoked response

Return HTTP `200` with status `revoked`. Include `revocationDate` only when it is publicly permitted by policy and law.

```json
{
  "status": "revoked",
  "scholarDisplayName": "Jordan P.",
  "challengeName": "Block Zero Ready Challenge",
  "issueDate": "2026-07-24",
  "certificateNumber": "B0-2026-000123",
  "issuingOrganization": "Mind Unlocking Academy",
  "revocationDate": "2026-08-10",
  "correlationId": "01J4..."
}
```

## Invalid response

Preferred response is HTTP `200` with a normalized invalid result:

```json
{
  "status": "invalid",
  "correlationId": "01J4..."
}
```

HTTP `404` is also supported by the frontend and is displayed as: `No valid certificate was found for this verification code.`

## Privacy requirements

Do not expose private scholar data from this endpoint. Never return:

- Email address
- Phone number
- Date of birth
- Full legal name when a separate public display name exists
- Account ID, user ID, enrollment ID, team ID, mentor ID, or cohort internals
- Grades, readiness signals, check-in data, accommodations, support notes, or audit metadata
- Revocation reasons unless explicitly approved for public display

Return only the public display name and certificate metadata required for verification.

## Error contract

For API failures, return a human-readable message and a correlation ID either in the JSON body or the `x-correlation-id` response header.

```json
{
  "message": "Unable to verify this certificate right now.",
  "correlationId": "01J4..."
}
```

Frontend mappings:

| HTTP status | Frontend message                                                                  |
| ----------- | --------------------------------------------------------------------------------- |
| `404`       | `No valid certificate was found for this verification code.`                      |
| `409`       | `This action has already been completed. The latest information has been loaded.` |
| `412`       | `This record was updated elsewhere. Reload it before continuing.`                 |
| `429`       | `Too many requests were submitted. Please wait and try again.`                    |
| network/`0` | `You are offline. Some information may be unavailable.`                           |

## Operational recommendations

- Rate-limit by IP and verification code to protect public lookups.
- Log all verification attempts with correlation IDs, but avoid logging sensitive scholar data.
- Normalize verification codes server-side by trimming whitespace and applying the canonical casing rules used at issuance.
- Confirm revoked certificates cannot be cached as valid after revocation.
- Add automated tests for valid, invalid, revoked-with-date, revoked-without-date, rate-limited, and backend-error cases.
