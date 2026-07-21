# API Integration Guide

All API calls go through typed services backed by `ApiService` and `environment.apiBaseUrl`. Authentication uses Firebase ID tokens: the login page exchanges email/password credentials with Firebase Identity Toolkit, then sends `{ email, firebaseIdToken }` to `POST /auth/login` so the backend can associate the verified Firebase user with the app profile. Registration first creates the Firebase account with Identity Toolkit, then sends `{ displayName, email, firebaseIdToken }` to `POST /auth/register` so the backend can create the app profile from a verified Firebase user. W1 question payloads must never include correct-answer data before `POST /api/question-attempts/{attemptId}/submit` returns W2/W3 details.

## Environment settings

`environment.apiBaseUrl` is the base URL used by all typed API services. `environment.apiWithCredentials` controls whether requests include browser credentials, which is required only when backend refresh-session cookies are cross-origin. `environment.firebase.apiKey` must be set to the Firebase Web API key; the Identity Toolkit and Secure Token URLs should normally stay on the Google defaults.
