# Authentication Backend Implementation Guide

This guide covers the backend contracts needed by the frontend email verification and password reset flows.

## Email verification resynchronization

### `POST /api/v1/auth/firebase/resync`

Used by `/verify-email` after the learner clicks **I Have Verified My Email**.

1. Frontend reloads the active Firebase user.
2. Frontend verifies `emailVerified === true`.
3. Frontend force-refreshes the Firebase ID token.
4. Frontend posts the fresh token to this endpoint.
5. Backend verifies the Firebase ID token with the Firebase Admin SDK, updates the local user email verification state, and returns normal backend tokens.

Request:

```json
{
  "firebaseIdToken": "fresh Firebase ID token"
}
```

Response: same DTO as `/auth/login` and `/auth/refresh`.

```json
{
  "accessToken": "backend JWT",
  "expiresUtc": "2026-07-23T12:00:00Z",
  "refreshToken": "opaque refresh token",
  "refreshExpiresUtc": "2026-08-22T12:00:00Z",
  "tokenType": "Bearer"
}
```

Required backend behavior:

- Validate the Firebase token signature, issuer, audience, expiration, and revocation status.
- Require `email_verified` to be true before marking the backend user verified.
- Match users by Firebase UID first, then normalized email only where account linking rules allow it.
- Return `401` when the token is invalid or expired.
- Return `403` when the Firebase email is still unverified.
- Return `423` or `403` for disabled accounts.
- Include standard rate-limit headers when throttled.

## Resend verification email

The frontend sends verification emails through Firebase for the currently signed-in Firebase user and disables the resend button for 60 seconds after a successful send. Backend-owned resend endpoints are optional, but if implemented they should enforce server-side limits as well.

Recommended backend endpoint if server-side resend is required:

### `POST /api/v1/auth/email-verification/resend`

Request:

```json
{
  "email": "learner@example.com"
}
```

Response: `204 No Content` for both existing and non-existing addresses to avoid account enumeration.

Rate limiting:

- Per account and per IP.
- Return `429 Too Many Requests` with `Retry-After` when the limit is exceeded.
- Do not reveal whether the email exists.

## Forgot password

### `POST /api/v1/auth/forgot-password`

Used by `/forgot-password`.

Request:

```json
{
  "email": "learner@example.com"
}
```

Response: `204 No Content` regardless of whether an account exists.

Required backend behavior:

- Normalize email addresses before lookup.
- Never reveal whether the email belongs to an account.
- If the account exists and is allowed to reset passwords, create a single-use, short-lived reset token and send the reset email.
- Throttle per email and per IP.
- Log suspicious reset volume without exposing details in the response.

Frontend success copy is intentionally neutral:

> If an account exists for this email address, a reset link has been sent.
