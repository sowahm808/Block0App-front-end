# Registration backend contract

The front-end registration form now collects the complete onboarding payload below. Backend `/auth/register` implementations should accept, validate, persist/audit, and return validation errors for these fields consistently with the client-side checks.

| Field                     | JSON property           | Type           |    Required | Backend validation                                                                   |
| ------------------------- | ----------------------- | -------------- | ----------: | ------------------------------------------------------------------------------------ |
| Full name                 | `displayName`           | string         |         Yes | Trimmed length 2–100 characters                                                      |
| Email address             | `email`                 | string         |         Yes | Trim, lowercase, valid email format, unique account email                            |
| Password                  | `password`              | string         |         Yes | Minimum 8 characters; backend may enforce additional password policy                 |
| Confirm password          | N/A                     | string         | Client only | The client validates this before submit and does not send it                         |
| Country                   | `country`               | string         |         Yes | Must be one of the supported ISO 3166-1 alpha-2 country codes exposed by the product |
| Time zone                 | `timeZone`              | string         |         Yes | Must be a valid IANA time zone identifier, for example `America/New_York`            |
| Primary study device      | `primaryStudyDevice`    | string or null |          No | When present, must be `phone`, `tablet`, `laptop`, or `desktop`                      |
| Terms acceptance          | `acceptedTerms`         | boolean        |         Yes | Must be `true`; store acceptance timestamp/version if required for compliance        |
| Privacy policy acceptance | `acceptedPrivacyPolicy` | boolean        |         Yes | Must be `true`; store acceptance timestamp/version if required for compliance        |

## Example request

```json
{
  "displayName": "Dr Example",
  "email": "doctor@example.com",
  "password": "correct horse battery staple",
  "country": "US",
  "timeZone": "America/New_York",
  "primaryStudyDevice": "laptop",
  "acceptedTerms": true,
  "acceptedPrivacyPolicy": true
}
```

## Validation response guidance

Return field-level validation errors using the existing API validation error shape so the front end can surface backend failures. Suggested field names should match the JSON properties above: `displayName`, `email`, `password`, `country`, `timeZone`, `primaryStudyDevice`, `acceptedTerms`, and `acceptedPrivacyPolicy`.

If backend country support differs from the current front-end list, update `SUPPORTED_COUNTRIES` in `src/app/features/auth/auth.pages.ts` at the same time as the backend allowlist to keep validation behavior aligned.
