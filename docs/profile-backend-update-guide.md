# Profile backend update guide

This guide documents the `/profile` backend contract required by the Profile screen.

## Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/profile` | Return the signed-in user's profile header, editable preferences, and read-only account metadata. |
| `PUT` | `/profile` | Update editable text/select preferences. |
| `POST` | `/profile/image` | Upload and replace the user's profile image. |

All routes require the same authenticated session/JWT used by the rest of the app. Users may only access or mutate their own profile unless an administrative endpoint is added separately.

## `GET /profile` response

```json
{
  "userId": "usr_123",
  "displayName": "Avery Scholar",
  "email": "avery@example.com",
  "avatarUrl": "https://cdn.example.com/profiles/usr_123.webp",
  "firebaseProvider": "password",
  "scholarRole": "Scholar",
  "activeCohort": "Block Zero Ready - July 2026",
  "enrollmentDate": "2026-07-01T00:00:00Z",
  "timeZone": "America/New_York",
  "preferredStudyTime": "Evening",
  "primaryDevice": "LaptopDesktop"
}
```

### Field notes

- `displayName`, `email`, `firebaseProvider`, `scholarRole`, and `timeZone` are required strings.
- `avatarUrl`, `activeCohort`, `enrollmentDate`, `preferredStudyTime`, and `primaryDevice` may be `null` when not configured.
- `preferredStudyTime` must be one of `EarlyMorning`, `Morning`, `Afternoon`, `Evening`, or `LateNight`.
- `primaryDevice` must be one of `LaptopDesktop`, `Tablet`, or `Phone`.
- `timeZone` should be stored as an IANA time zone identifier such as `America/New_York`.
- `firebaseProvider` should expose the Firebase sign-in provider id or a friendly equivalent, for example `password`, `google.com`, or `microsoft.com`.

## `PUT /profile` request

```json
{
  "displayName": "Avery Scholar",
  "timeZone": "America/New_York",
  "preferredStudyTime": "Evening",
  "primaryDevice": "LaptopDesktop"
}
```

Return the updated profile using the same shape as `GET /profile`.

### Validation

- `displayName`: required, trim whitespace, maximum 120 characters.
- `timeZone`: required, valid IANA time zone.
- `preferredStudyTime`: nullable enum.
- `primaryDevice`: nullable enum.
- Ignore or reject read-only fields (`email`, `firebaseProvider`, `scholarRole`, `activeCohort`, `enrollmentDate`) if included by a client.

## `POST /profile/image` request

Accept `multipart/form-data` with a single `image` file field. Return the updated profile using the same shape as `GET /profile` after the image has been persisted and `avatarUrl` has been updated.

### Image validation

- Allowed MIME types: `image/png`, `image/jpeg`, and `image/webp`.
- Recommended maximum size: 5 MB.
- Recommended processing: strip metadata, normalize orientation, resize/crop to a square avatar, and write a cache-busted `avatarUrl`.

## Errors

Use the app's standard API error format with `status`, `message`, optional `correlationId`, and optional `validationErrors`. Return `400` for validation failures, `401` for missing/expired auth, `403` for cross-user access, and `413` for oversized images.
