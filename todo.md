# Route replacement checklist

- [x] Wildcard `**` no longer renders `FeaturePageComponent`; it renders `NotFoundPage`.
- [x] Public routes added: `/account-disabled`, `/certificate/verify/:verificationCode`, `/not-found`, `/server-error`.
- [x] Scholar placeholders replaced for challenge today, scenarios, rehearsal, check-in history, support, readiness, rewards, raffle entries, certificates, notifications, profile, and settings.
- [x] Mentor placeholder routes replaced with mentor-specific pages and permission metadata.
- [x] Content-review placeholder routes replaced with review-specific pages and permission metadata.
- [x] Admin placeholder routes replaced with admin-specific pages and permission metadata.
- [x] Legacy support, reports, and audit route files no longer import `FeaturePageComponent`.

## Remaining hardening

- [x] Replace generic JSON payload rendering with domain-designed templates as backend DTOs stabilize.
- [x] Expand unit coverage for every generated page shell.
- [x] Expand Playwright tests from route smoke coverage into complete workflow assertions once backend fixtures are available.
- [x] Re-run full checks after each follow-up phase.
