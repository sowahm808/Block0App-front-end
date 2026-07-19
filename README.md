# Mind Unlocking Academy — WhisperWrap Block Zero 21-Day Challenge

Production Angular frontend for the structured medical exam preparation challenge. The app uses standalone Angular, strict TypeScript, Angular Material, Tailwind, typed API services, role guards, in-memory access tokens, HttpOnly refresh-token cookie support, and lazy feature routing.

## Commands

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run e2e:smoke`

## API configuration

Set `src/app/environments/environment*.ts` values. Services must use `environment.apiBaseUrl`; no service should hard-code backend URLs. Production currently targets `https://block0app-back-end.onrender.com/api` and enables `apiWithCredentials` so HttpOnly auth cookies can be sent to the API origin.

## Security principles

Refresh tokens are not stored in browser storage. The auth interceptor only attaches credentials to the configured API origin and adds correlation IDs for support.

## Status

See `TODO.md` for phase completion and remaining work.
