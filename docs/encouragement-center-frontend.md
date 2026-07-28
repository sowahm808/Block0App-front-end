# Encouragement Center frontend

## Architecture and routes

Encouragement Center is a lazy, standalone Angular feature inside the authenticated MUA shell. Protected routes are `/encouragement`, `/encouragement/create`, `/encouragement/review/:whisperId`, `/encouragement/sent/:whisperId`, and `/encouragement/:whisperId`. `/unwrap/:token` is deliberately registered before the shell and is public. Netlify's existing catch-all rewrite supports direct refreshes.

The backend is canonical: the browser never queries Firestore or persists whisper metadata, recipient events, or audio through Firebase SDKs. `WhisperApiService` composes typed `/whispers` and `/public/whispers` requests through MUA's existing `ApiService`. The supplied WhisperWrap deployment is `https://whisperwrap-backend.onrender.com`; production requires the MUA backend at `environment.apiBaseUrl` to proxy the documented `/api/v1` contract to that service. Pointing the entire MUA API base at WhisperWrap would break existing MUA features and is intentionally not done.

## Permissions

Routes use MUA permission guards: `whispers.create` for create/review and `whispers.read_own` for dashboard/detail/sent. Navigation uses the aggregate `whispers.access` grant. Scholar and Mentor defaults include the documented sender grants; administrators retain wildcard access. Content reviewers receive no default access. Backend authorization and sender ownership remain authoritative. Internal-recipient search must be supplied by a backend endpoint restricted to assigned scholars; no directory-wide endpoint was assumed.

## API contract and state

The client assumes the request paths and response types listed in the integration specification, rooted at MUA's `/api/v1`. IDs and public tokens are URL encoded. Non-idempotent operations are never automatically retried and controls lock while active. RFC 7807 status/code payloads map authentication, entitlement, validation, conflict, rate-limit, provider, expiration/revocation, and unavailable states to safe language while retaining a support trace ID.

Draft recovery is versioned in `sessionStorage`, scoped to the authenticated MUA user, and contains form text plus the backend whisper ID only. It contains no auth token, unwrap token, or audio. Corrupt, incompatible, cross-user, logged-out, and delivered drafts are removed.

## Audio and public unwrap security

Audio follows: request signed URL, PUT bytes to that third-party URL with progress, verify HTTP completion, then notify the backend. Accepted formats are MP3, MP4, WebM, and WAV with a 15 MB client ceiling; the backend remains authoritative. Consent sending stays disabled until required audio is complete.

Public unwrap calls are explicitly exempt from auth header attachment and 401 token refresh. The raw token is held only from the active route, URL encoded for requests, and never logged, persisted, or placed in analytics. A `noindex,nofollow,noarchive` meta tag is installed only for the token page. Content is text-bound rather than rendered as HTML. Acceptance uses its returned content without a redundant GET; listened is sent once when audio playback begins. No polling occurs. Reduced-motion CSS disables reveal motion.

## Configuration, tests, and rollout

`features.encouragementCenter` is typed and enabled in development and production. Visibility remains permission-based, so administrators/super administrators, mentors, and scholars with the documented role defaults or backend entitlement see the navigation entry. Configure the MUA backend proxy/CORS and provider test doubles before enabling provider-backed flows. Unit coverage includes validators and RFC 7807 mapping; repository typecheck, lint, unit, build, and Playwright suites provide integration checks. Backend contract tests must cover provider partial success, permission/ownership, signed URL expiry, audio readiness, and lifecycle conflicts without production Gemini, SendGrid, Twilio, or Firebase resources.
