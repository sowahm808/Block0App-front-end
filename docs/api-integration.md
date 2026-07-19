# API Integration Guide

All API calls go through typed services backed by `ApiService` and `environment.apiBaseUrl`. W1 question payloads must never include correct-answer data before `POST /api/question-attempts/{attemptId}/submit` returns W2/W3 details.


## Environment settings

`environment.apiBaseUrl` is the base URL used by all typed API services. `environment.apiWithCredentials` controls whether requests include browser credentials, which is required for cross-origin HttpOnly refresh-token cookies in production.
