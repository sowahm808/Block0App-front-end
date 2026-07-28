# Whisper backend implementation guide

This guide describes the backend contract required by the existing Encouragement Center so that **Send consent request** actually delivers a Whisper. It assumes that WhisperWrap is hosted at:

```text
https://whisperwrap-backend.onrender.com
```

The browser should continue to call the Block0 API at `environment.apiBaseUrl`. Do **not** point the whole Angular application at WhisperWrap: all non-Whisper Block0 API calls would then go to the wrong service. Instead, add the endpoints below to the Block0 backend and have that trusted backend call WhisperWrap.

> The upstream WhisperWrap API could not be inspected from this repository. Confirm its paths, authentication scheme, request body, and response body from its OpenAPI document or source before implementing the adapter. Keep the frontend-facing contract below stable even if the upstream contract differs.

## 1. What the frontend already does

The send workflow is intentionally multi-step:

1. `POST /api/v1/whispers/generate` creates a canonical server-side record.
2. The sender reviews or regenerates the content.
3. `POST /api/v1/whispers/:id/confirm` freezes the content.
4. For `audio` or `text_audio`, the client requests a signed upload URL, uploads directly to object storage, and reports completion.
5. `POST /api/v1/whispers/:id/send-consent` requests delivery.
6. The recipient follows a secret link to `/unwrap/:token`, accepts, and then sees the content.

The Angular client sends its Block0 bearer token to protected Block0 endpoints. Public unwrap endpoints deliberately have no bearer token. Therefore, the backend must authenticate protected routes, enforce sender ownership, and treat the unwrap token itself as a secret bearer credential.

## 2. Recommended architecture

```text
Angular client
    |
    | Bearer <Block0 access token>
    v
Block0 API /api/v1/whispers/*
    |-- PostgreSQL: canonical whisper, recipient, state, events
    |-- Object storage: audio bytes
    |-- Queue/outbox worker: reliable delivery
    `-- server-to-server request --> WhisperWrap on Render
                                      (and/or its email/SMS providers)
```

Use the Block0 API as an anti-corruption layer:

- translate the stable frontend DTOs into WhisperWrap's actual DTOs;
- keep WhisperWrap credentials on the server only;
- authorize access using Block0 identities and permissions;
- own the consent token and lifecycle state;
- make sending idempotent and retryable without duplicate messages;
- return RFC 7807 errors rather than leaking provider errors.

If WhisperWrap already owns persistence, tokens, and delivery, the Block0 database can store an `upstreamWhisperId` and a local ownership projection. It must still enforce Block0 authorization and return the exact frontend contract.

## 3. Configuration

Add server-side environment variables (names are examples):

```dotenv
WHISPERWRAP_BASE_URL=https://whisperwrap-backend.onrender.com
WHISPERWRAP_API_KEY=replace-with-a-Render-secret
PUBLIC_APP_URL=https://your-frontend.example.com
WHISPER_TOKEN_PEPPER=at-least-32-random-bytes
WHISPER_AUDIO_BUCKET=block0-whispers
WHISPER_SEND_TIMEOUT_MS=10000
```

Requirements:

- remove the trailing slash from `WHISPERWRAP_BASE_URL` when composing URLs;
- never prefix a browser-returned upload URL or playback URL with this base URL;
- store all secrets in the backend host's secret manager, not Git or Angular environments;
- set `PUBLIC_APP_URL` to the deployed Angular origin so links use `https://.../unwrap/<token>`;
- allow the Angular origin in Block0 API CORS, including `Authorization`, `Content-Type`, and `X-Correlation-ID`;
- configure the object-store upload URL's CORS to allow `PUT` and the headers returned in `requiredHeaders`.

## 4. Data model and state machine

A minimal relational model is:

```sql
create table whispers (
  id uuid primary key,
  sender_id uuid not null,
  upstream_whisper_id text,
  recipient_type text not null check (recipient_type in ('internal', 'external')),
  recipient_user_id uuid,
  recipient_display_name text not null,
  recipient_email text,
  recipient_phone text,
  whisper_type text not null,
  wrap_style text not null,
  delivery_format text not null check (delivery_format in ('text', 'audio', 'text_audio')),
  sender_intent text not null,
  content jsonb,
  status text not null,
  confirmed_at timestamptz,
  audio_object_key text,
  audio_ready boolean not null default false,
  token_hash text unique,
  token_expires_at timestamptz,
  accepted_at timestamptz,
  opened_at timestamptz,
  listened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table whisper_delivery_attempts (
  id uuid primary key,
  whisper_id uuid not null references whispers(id),
  idempotency_key text not null unique,
  channel text not null check (channel in ('email', 'sms', 'in_app')),
  status text not null check (status in ('pending', 'succeeded', 'failed')),
  provider_message_id text,
  safe_message text,
  attempt_count integer not null default 0,
  next_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Valid state transitions should be enforced atomically:

```text
draft/generated -> generated (regenerate or edit)
generated       -> generated + confirmedAt (confirm)
confirmed       -> consent_sent (at least one channel accepted delivery)
consent_sent    -> accepted -> opened -> listened
any send state  -> failed (all requested channels fail permanently)
```

The public API also derives `expired`, `revoked`, and `not_found` without exposing which token was once valid. Do not permit edits, regeneration, or audio replacement after delivery begins.

## 5. Required frontend-facing endpoints

All response fields use camel case and ISO-8601 UTC timestamps. Protected endpoints require:

```http
Authorization: Bearer <Block0 access token>
X-Correlation-ID: <uuid>
```

### Create and review

| Method  | Path                              | Purpose                                                                          |
| ------- | --------------------------------- | -------------------------------------------------------------------------------- |
| `POST`  | `/api/v1/whispers/generate`       | Validate recipient, ask WhisperWrap to generate, persist, return `WhisperRecord` |
| `GET`   | `/api/v1/whispers`                | List only the authenticated sender's records                                     |
| `GET`   | `/api/v1/whispers/:id`            | Read an owned record                                                             |
| `PATCH` | `/api/v1/whispers/:id/content`    | Replace editable generated content                                               |
| `POST`  | `/api/v1/whispers/:id/regenerate` | Replace editable content via WhisperWrap                                         |
| `POST`  | `/api/v1/whispers/:id/confirm`    | Atomically set `confirmedAt`                                                     |

Example generate request:

```json
{
  "recipientType": "external",
  "externalRecipient": {
    "name": "Ada Example",
    "preferredAddressName": "Ada",
    "gender": "female",
    "email": "ada@example.com"
  },
  "recipientName": "Ada Example",
  "preferredAddressName": "Ada",
  "recipientGender": "female",
  "whisperType": "encouragement",
  "wrapStyle": "warm",
  "deliveryFormat": "text",
  "senderIntent": "Encourage Ada before her examination"
}
```

Example generated content inside the returned record:

```json
{
  "title": "You are not alone",
  "message": "Your preparation matters, and you can take the next step with courage.",
  "scriptureReference": "Isaiah 41:10",
  "scriptureText": "A licensed or approved translation excerpt, or an empty string",
  "shortPrayer": "May you have peace, clarity, and strength today."
}
```

Validate string lengths, supported enum values, recipient contact details, and authorization on the server. Do not trust duplicated display fields or an internal `recipientMuaUserId`; resolve internal recipient details from Block0's user database.

### Audio

`POST /api/v1/whispers/:id/audio-upload-url` accepts:

```json
{ "fileName": "message.webm", "mimeType": "audio/webm", "sizeBytes": 481223 }
```

It returns:

```json
{
  "uploadUrl": "https://object-store.example/signed-put-url",
  "uploadId": "opaque-one-use-id",
  "expiresAt": "2026-07-28T14:00:00Z",
  "requiredHeaders": { "Content-Type": "audio/webm" }
}
```

`POST /api/v1/whispers/:id/audio-upload-complete` accepts:

```json
{ "uploadId": "opaque-one-use-id", "sizeBytes": 481223, "mimeType": "audio/webm" }
```

Before returning `audioReady: true`, issue an object-store `HEAD` request and verify ownership, object key, byte count, content type, expiry, and one-use upload ID. Independently enforce the frontend's current 15 MiB limit and accepted MIME types (`audio/mpeg`, `audio/mp4`, `audio/webm`, `audio/wav`). Malware/content scanning can leave the upload pending until accepted.

### Send consent (the endpoint that enables the button)

`POST /api/v1/whispers/:id/send-consent` has an empty JSON body. It must:

1. authenticate the sender and require `whispers.create`;
2. load the record with `sender_id = authenticatedUser.id`;
3. require `confirmedAt`, and require `audioReady` for non-text delivery;
4. generate 32 random bytes for a public token, return the raw token only in the delivery URL, and store only `HMAC-SHA-256(pepper, token)`;
5. create a channel-specific outbox/delivery row with deterministic idempotency key `<whisperId>:consent:<channel>`;
6. commit the token and outbox rows before contacting an external provider;
7. let a worker call WhisperWrap and record each provider result;
8. return real channel statuses—never report success merely because work was queued or an HTTP call was attempted.

Response:

```json
{
  "whisperId": "0a87b038-ff9c-4b35-b499-38f0bd2dbbe7",
  "status": "consent_sent",
  "results": [
    { "channel": "email", "status": "succeeded", "message": "Consent request sent." },
    { "channel": "sms", "status": "failed", "message": "SMS delivery was unavailable.", "retrySupported": true }
  ]
}
```

The subsequent `GET /api/v1/whispers/:id` must include the same `deliveryResults`, because the sent page reloads that record. For an asynchronous worker, either wait briefly for terminal provider results or return `pending`; do not return `succeeded` until the provider accepts the message. A repeated request must reuse the token/idempotency keys and must not deliver duplicates.

### Public unwrap

| Method | Path                                             | Behavior                                                  |
| ------ | ------------------------------------------------ | --------------------------------------------------------- |
| `GET`  | `/api/v1/public/whispers/unwrap/:token`          | Return consent state only; no content before acceptance   |
| `POST` | `/api/v1/public/whispers/unwrap/:token/accept`   | Record consent atomically and return content/playback URL |
| `POST` | `/api/v1/public/whispers/unwrap/:token/listened` | Idempotently set the first listened timestamp             |

Before acceptance, return only:

```json
{ "state": "consent_required", "recipientDisplayName": "Ada" }
```

After acceptance:

```json
{
  "state": "accepted",
  "recipientDisplayName": "Ada",
  "content": {
    "title": "You are not alone",
    "message": "Your preparation matters, and you can take the next step with courage.",
    "scriptureReference": "Isaiah 41:10",
    "scriptureText": "",
    "shortPrayer": "May you have peace, clarity, and strength today."
  },
  "audioPlaybackUrl": "https://object-store.example/short-lived-signed-get-url"
}
```

Hash the presented token before lookup using a constant-time comparison. Apply IP/token rate limits, never log the raw URL/token, use short-lived signed playback URLs, add `Cache-Control: no-store` and `Referrer-Policy: no-referrer`, and return the same safe not-found shape for invalid or revoked tokens.

## 6. WhisperWrap adapter example

Keep all guessed upstream details in one adapter. Replace `/whispers` and the payload mapping below with the hosted service's documented contract.

```ts
type UpstreamSendResult = {
  id: string;
  deliveries: Array<{ channel: 'email' | 'sms' | 'in_app'; accepted: boolean; messageId?: string }>;
};

export class WhisperWrapClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async sendConsent(input: {
    idempotencyKey: string;
    recipient: { name: string; email?: string; phone?: string };
    consentUrl: string;
  }): Promise<UpstreamSendResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/whispers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': input.idempotencyKey,
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Log status, correlation ID, and a redacted body internally.
        throw new Error(`WhisperWrap request failed with ${response.status}`);
      }

      return (await response.json()) as UpstreamSendResult;
    } finally {
      clearTimeout(timeout);
    }
  }
}
```

Do not retry a non-idempotent upstream request unless WhisperWrap honors an idempotency key. Retry only transient `429`/`5xx`/network failures with bounded exponential backoff and jitter; honor `Retry-After`. Never send Block0's user bearer token upstream.

## 7. Error contract

Return `application/problem+json`:

```json
{
  "type": "https://api.example.com/problems/whisper-not-confirmed",
  "title": "Whisper is not ready",
  "status": 409,
  "detail": "Confirm the content before requesting delivery.",
  "code": "WHISPER_NOT_CONFIRMED",
  "traceId": "00-abcd..."
}
```

Recommended status mapping:

| Status        | Use                                                                          |
| ------------- | ---------------------------------------------------------------------------- |
| `400`         | malformed JSON or unsupported value                                          |
| `401`         | missing/invalid Block0 token on protected routes                             |
| `403`         | missing permission or entitlement                                            |
| `404`         | unknown/unowned whisper; do not reveal another sender's record               |
| `409`         | invalid lifecycle transition, missing confirmation/audio, duplicate conflict |
| `413` / `415` | audio too large / unsupported media type                                     |
| `422`         | field validation errors                                                      |
| `429`         | caller/provider throttled, with `Retry-After`                                |
| `502`         | WhisperWrap/provider rejected or returned an invalid response                |
| `503` / `504` | upstream unavailable / timed out                                             |

Include field errors as `errors: { "field": ["message"] }`. Keep provider credentials, raw provider bodies, recipient contact details, and tokens out of client errors and logs.

## 8. Authorization checklist

- Require `whispers.create` for generate, edit, regenerate, confirm, audio, and send.
- Require `whispers.read_own` for list/detail and always filter by `sender_id` in SQL.
- Validate organization/cohort context rather than accepting client-supplied organization IDs as authority.
- Restrict internal recipients to the sender's assigned users/team.
- Encrypt recipient email/phone and sensitive content at rest where supported.
- Add retention/deletion jobs for expired tokens, contact data, content, and audio.
- Audit generate, confirm, send, accept, revoke, and delete without recording content or raw tokens.
- Validate webhook signatures if provider webhooks update delivery status; make webhook processing idempotent.

## 9. Implementation order

1. Obtain WhisperWrap's OpenAPI/source contract and verify a health request from the Block0 backend host.
2. Implement the adapter with contract tests and a fake transport.
3. Add migrations, repositories, ownership checks, and lifecycle transactions.
4. Implement generate/list/get/edit/regenerate/confirm.
5. Implement signed audio upload and server-side completion verification.
6. Implement token hashing, public consent endpoints, expiry/revocation, and secure response headers.
7. Implement the transactional outbox, worker, idempotent upstream delivery, and status persistence.
8. Add structured redacted logs, correlation IDs, metrics, alerts, and dead-letter handling.
9. Run the end-to-end checks below in a staging environment with test recipients.
10. Set `features.encouragementCenter: true` in the production Angular environment only after the contract passes.

## 10. Verification

Use a real Block0 access token and a staging recipient you control:

```bash
export API=https://block0app-node-backend.onrender.com/api/v1
export TOKEN='<block0-access-token>'

# Generate; save the returned id.
curl -fsS "$API/whispers/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -H "X-Correlation-ID: $(uuidgen)" \
  --data @generate-whisper.json

export WHISPER_ID='<returned-id>'

curl -fsS -X POST "$API/whispers/$WHISPER_ID/confirm" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{}'

curl -fsS -X POST "$API/whispers/$WHISPER_ID/send-consent" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -H "X-Correlation-ID: $(uuidgen)" \
  --data '{}'

curl -fsS "$API/whispers/$WHISPER_ID" -H "Authorization: Bearer $TOKEN"
```

Also prove with automated tests that:

- another authenticated user receives `404` for the ID;
- sending before confirm, or before required audio, returns `409`;
- two concurrent send calls create one token and at most one delivery per channel;
- partial provider success is persisted and returned accurately;
- invalid, expired, and revoked public tokens do not reveal content;
- accepting and marking listened are idempotent under concurrency;
- logs and traces contain no bearer token, unwrap token, recipient contact, or message content;
- a WhisperWrap timeout does not lose the outbox item and retries do not duplicate delivery.

Once these checks pass, enable the production feature flag and monitor send latency, per-channel failure rate, outbox age, provider `429`/`5xx` rates, and unwrap acceptance failures.
