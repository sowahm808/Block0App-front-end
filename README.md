# Mind Unlocking Academy — WhisperWrap Block Zero 21-Day Challenge

Production Angular frontend for the structured medical exam preparation challenge. The app uses standalone Angular, strict TypeScript, Angular Material, Tailwind, typed API services, Firebase ID-token authentication, role guards, in-memory access tokens, HttpOnly refresh-session cookie support, and lazy feature routing.

## Commands

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run e2e:smoke`

## API configuration

Set `src/environments/environment*.ts` values. Services must use `environment.apiBaseUrl`; no service should hard-code backend URLs. Configure `environment.firebase.apiKey` for the Firebase Web API key used to exchange email/password credentials and backend-issued custom tokens for Firebase ID tokens. Production currently targets `https://block0app-back-end.onrender.com/api/v1`; enable `apiWithCredentials` only when the backend requires cross-origin refresh-session cookies.

## Security principles

Firebase refresh tokens are kept in memory only and are never written to browser storage. The auth interceptor attaches Firebase bearer ID tokens only to the configured API origin and adds correlation IDs for support.

## Status

See `TODO.md` for phase completion and remaining work.
