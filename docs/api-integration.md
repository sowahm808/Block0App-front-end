# API Integration Guide

All API calls go through typed services backed by `ApiService` and `environment.apiBaseUrl`. Authentication uses backend auth endpoints under the configured `/api/v1` base URL. The login page exchanges email/password credentials with Firebase Identity Toolkit, then sends `{ email, password, mfaCode, firebaseIdToken }` to `POST /auth/login` for backend token issuance and hydrates the app profile from `GET /auth/me`. Registration sends `{ displayName, email, password }` to `POST /auth/register`; the backend owns Firebase/Firestore user persistence and returns `{ userId, email, emailVerificationLink }`. W1 question payloads must never include correct-answer data before `POST /api/question-attempts/{attemptId}/submit` returns W2/W3 details.

## Environment settings

`environment.apiBaseUrl` is the base URL used by all typed API services. `environment.apiWithCredentials` controls whether requests include browser credentials, which is required only when backend refresh-session cookies are cross-origin. `environment.firebase.apiKey` must be set to the Firebase Web API key; the Identity Toolkit and Secure Token URLs should normally stay on the Google defaults.
