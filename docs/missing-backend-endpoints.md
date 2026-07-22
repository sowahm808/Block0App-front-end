# Missing backend endpoint report

The new feature-specific pages call backend-only `/api/v1` endpoints through `environment.apiBaseUrl`. Unsupported mutations remain disabled in the UI shell and must not write directly to Firestore or persist local-only success state.

| Frontend page | Required action | Method | Route | Required role | Permission | Request DTO | Response DTO | Production impact | Current UI behavior |
|---|---|---:|---|---|---|---|---|---|---|
| Announcements admin | Save/publish announcements | POST/PUT | `/api/v1/admin/announcements` | Administrator | `admin.announcements.manage` | Announcement draft | Announcement status | Cannot manage scheduled announcements | Disabled action with endpoint-unavailable explanation |
| Enrollment admin | Create, transfer, bulk import enrollments | POST/PUT | `/api/v1/admin/enrollments` | Administrator | `admin.enrollments.manage` | Enrollment or CSV preview DTO | Cursor page/import result | Cannot safely manage enrollment operations | Disabled action; no Firestore writes |
| Rewards admin | CRUD reward rules | GET/POST/PUT | `/api/v1/admin/rewards` | Administrator | `admin.rewards.manage` | Reward rule DTO | Reward rule/status DTO | Rules cannot be administered | Disabled action with clear explanation |
| Certificates admin | Revoke/regenerate/search certificates | GET/POST | `/api/v1/admin/certificates` | Administrator | `admin.certificates.manage` | Search/revoke DTO | Certificate audit/status DTO | Certificate operations require backend | Disabled action; no eligibility overrides |
| AI administration | Review/summarize/generate through backend | POST | `/api/v1/ai/*` | Administrator | `admin.ai.manage` | Prompt/action DTO | Safety-reviewed AI result | AI actions unavailable without backend provider bridge | Error state; no direct provider calls |
| System settings | Read non-secret settings | GET | `/api/v1/admin/system-settings` | Administrator | `admin.system.read` | None | Sanitized settings DTO | Settings visibility depends on backend sanitization | Read-only unavailable state |
| Feature flags | Persist feature flags | GET/POST/PUT | `/api/v1/admin/feature-flags` | Administrator | `admin.flags.manage` | Feature flag DTO | Persisted flag DTO | Flags cannot be authoritative | Disabled action; authorization still server-side |
