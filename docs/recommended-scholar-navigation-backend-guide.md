# Recommended Scholar Navigation Backend Guide

This guide audits the recommended Scholar navigation tree and maps each frontend route to the backend contract needed to keep the experience consistent.

## Navigation tree

```text
Dashboard
├── Today’s Challenge
├── Learning Packs
│   └── Learning Pack Detail
│       └── Capsule Attempt
├── Clinical Scenarios
│   └── Scenario Attempt
├── Rehearsal
├── Check-Ins
│   ├── Morning
│   ├── Evening
│   └── History
├── My Team
│   └── Support Requests
├── Readiness
├── Rewards
│   └── Raffle Entries
├── Certificates
├── Notifications
├── Profile
└── Settings
```

## Route-to-endpoint audit

| Navigation item      | Frontend route                                               | Primary backend endpoint(s)                                                                                                                                          | Existing detailed guide                                                                                                                       |
| -------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard            | `/dashboard`                                                 | `GET /dashboard`                                                                                                                                                     | `docs/scholar-dashboard-backend-update-guide.md`                                                                                              |
| Today’s Challenge    | `/challenge/today`                                           | `GET /challenges/current/today`                                                                                                                                      | `docs/today-challenge-backend-update-guide.md`                                                                                                |
| Learning Packs       | `/learning-packs`                                            | `GET /learning-packs`                                                                                                                                                | `docs/learning-packs-backend-update-guide.md`                                                                                                 |
| Learning Pack Detail | `/learning-packs/:packId`                                    | `GET /learning-packs/{packId}`                                                                                                                                       | `docs/learning-packs-backend-update-guide.md`                                                                                                 |
| Capsule Attempt      | `/capsules/:capsuleId/start`, `/capsule-attempts/:attemptId` | `POST /capsules/{capsuleId}/start`, `GET /capsule-attempts/{attemptId}`, `POST /capsule-attempts/{attemptId}/answers`, `POST /capsule-attempts/{attemptId}/complete` | `docs/capsule-start-backend-update-guide.md`, `docs/capsule-study-backend-update-guide.md`, `docs/capsule-completion-backend-update-guide.md` |
| Clinical Scenarios   | `/scenarios`                                                 | `GET /scenarios`                                                                                                                                                     | `docs/clinical-scenarios-backend-guide.md`                                                                                                    |
| Scenario Attempt     | `/scenario-attempts/:attemptId`                              | `GET /scenario-attempts/{attemptId}`, `POST /scenario-attempts/{attemptId}/answers`, `POST /scenario-attempts/{attemptId}/complete`                                  | `docs/clinical-scenarios-backend-guide.md`                                                                                                    |
| Rehearsal            | `/rehearsal`                                                 | `GET /rehearsals/available`                                                                                                                                          | `docs/rehearsal-backend-update-guide.md`                                                                                                      |
| Check-Ins            | `/check-ins`                                                 | Entrypoint for morning/evening check-in state                                                                                                                        | `docs/morning-check-in-backend-update-guide.md`, `docs/evening-check-in-backend-update-guide.md`                                              |
| Morning              | `/check-ins/morning`                                         | `GET /check-ins/morning/today`, `POST /check-ins/morning`                                                                                                            | `docs/morning-check-in-backend-update-guide.md`                                                                                               |
| Evening              | `/check-ins/evening`                                         | `GET /check-ins/evening/today`, `POST /check-ins/evening`                                                                                                            | `docs/evening-check-in-backend-update-guide.md`                                                                                               |
| History              | `/check-ins/history`                                         | `GET /check-ins/history`                                                                                                                                             | `docs/check-in-history-backend-update-guide.md`                                                                                               |
| My Team              | `/team`                                                      | `GET /team`                                                                                                                                                          | `docs/team-support-backend-update-guide.md`                                                                                                   |
| Support Requests     | `/team/support`, `/team/support/:requestId`                  | `GET /support-requests/mine`, `POST /support-requests`, `GET /support-requests/mine/{requestId}`                                                                     | `docs/team-support-backend-update-guide.md`                                                                                                   |
| Readiness            | `/readiness`                                                 | `GET /readiness/current`                                                                                                                                             | `docs/readiness-dashboard-backend-update-guide.md`                                                                                            |
| Rewards              | `/rewards`                                                   | `GET /rewards`                                                                                                                                                       | `docs/rewards-backend-update-guide.md`                                                                                                        |
| Raffle Entries       | `/raffle-entries`                                            | `GET /raffle-entries`                                                                                                                                                | `docs/raffle-entries-backend-update-guide.md`                                                                                                 |
| Certificates         | `/certificates`                                              | `GET /certificates`, `POST /certificates/generate`                                                                                                                   | `docs/certificates-backend-update-guide.md`                                                                                                   |
| Notifications        | `/notifications`                                             | `GET /notifications`                                                                                                                                                 | `docs/notifications-backend-update-guide.md`                                                                                                  |
| Profile              | `/profile`                                                   | `GET /profile`, profile update endpoints as implemented                                                                                                              | `docs/profile-backend-update-guide.md`                                                                                                        |
| Settings             | `/settings`                                                  | `GET /profile`, profile/preferences update endpoints as implemented                                                                                                  | `docs/scholar-settings-backend-update-guide.md`                                                                                               |

## Backend implementation expectations

1. Protect every Scholar navigation endpoint with authenticated Scholar authorization unless a route-specific guide explicitly marks the endpoint public.
2. Scope all records to the signed-in scholar, cohort, and active challenge enrollment. Never accept a scholar ID from the client for these routes unless the endpoint is explicitly mentor/admin scoped.
3. Return stable identifiers used by child routes: `packId`, `capsuleId`, `attemptId`, `scenarioId`, `requestId`, certificate verification codes, and notification IDs.
4. Include route-driving URLs or enough IDs for the frontend to construct them. For example, learning pack detail responses should expose capsule start/review actions, and scenario responses should expose attempt creation/resume targets.
5. Use `401` for unauthenticated requests, `403` for authenticated users without Scholar access, `404` for records not owned by the scholar or not found, `409` for invalid state transitions, and `422` for validation errors.
6. Keep list endpoints usable in empty states by returning `200 OK` with empty arrays plus summary metadata rather than treating no activity as an error.
7. Align date-sensitive payloads to the scholar cohort timezone, especially Today’s Challenge, check-ins, rewards, readiness, and certificates.
8. Keep notification, profile, and settings responses lightweight enough for frequent navigation entry from the shell.

## Audit notes

- The primary Scholar sidebar now mirrors the recommended tree and removes the standalone Capsules link from top-level navigation because capsule work is reached through Learning Pack Detail and attempt flows.
- Child links are included in navigation metadata for backend/QA traceability. Dynamic child routes such as `:packId` and `:attemptId` are not intended as direct generic sidebar targets without a concrete record ID.
- Existing detailed backend guides remain the source of truth for payload shapes. This document is the cross-feature index for route coverage and implementation sequencing.
