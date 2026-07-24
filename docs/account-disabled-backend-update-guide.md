# Account Disabled Backend Update Guide

This guide describes the backend behavior needed for the `/account-disabled` frontend route.

## Goal

When an account is disabled, suspended, locked, or otherwise restricted, the backend should send the user to `/account-disabled` with only safe, user-facing context. The page displays an access-restricted message, account email, an optional reference/correlation ID, support instructions, **Contact Support**, and **Sign Out** actions.

The backend must not expose internal suspension notes, investigation details, abuse signals, moderator comments, risk scores, or policy-enforcement metadata to this route.

## Redirect contract

Redirect restricted interactive users to:

```text
/account-disabled?email={urlEncodedEmail}&referenceId={urlEncodedReferenceId}
```

Accepted query keys for compatibility:

- Email: `email`, `accountEmail`, or `userEmail`
- Reference: `referenceId`, `correlationId`, `traceId`, or `requestId`

If either value is unavailable, omit it. The frontend will display `Not available`.

## Recommended API error contract

For API calls made by restricted accounts, return `423 Locked` where supported, or `403 Forbidden` where client or gateway infrastructure cannot preserve `423`.

Use a standard problem response with safe fields only:

```json
{
  "type": "https://api.blockzero.example/problems/account-disabled",
  "title": "Account access restricted",
  "status": 423,
  "detail": "This account cannot access Block Zero right now. Contact support for help.",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00"
}
```

Do not include fields such as `suspensionNotes`, `adminNotes`, `riskScore`, `abuseSignals`, `moderatorComments`, `evidence`, or detailed policy labels in public responses.

## Login and session handling

1. Normalize the email before account lookup.
2. Verify credentials or identity-provider tokens normally.
3. Check account status before issuing backend access or refresh tokens.
4. If access is restricted, do not issue new tokens.
5. Return `423`/`403` with a safe problem response or redirect browser flows to `/account-disabled`.
6. Include a trace/reference ID in logs and safe responses so support can correlate the event.
7. Allow logout endpoints to succeed or no-op for restricted users so clients can clear local sessions.

## Support workflow requirements

Support staff should be able to search by:

- Normalized account email
- Reference/correlation/trace ID
- Timestamp of the restriction response

The support tool can show internal notes to authorized staff, but those notes must remain server-side and must not be serialized to the frontend account-disabled route.

## Security and privacy checklist

- [ ] Disabled users cannot access learner, mentor, admin, or review APIs.
- [ ] Restricted API responses use safe user-facing wording only.
- [ ] Internal suspension notes are never returned to the browser.
- [ ] Reference IDs correlate to server logs without revealing enforcement details.
- [ ] Logout remains available even when access is restricted.
- [ ] Audit logs record status changes and support access to internal notes.
