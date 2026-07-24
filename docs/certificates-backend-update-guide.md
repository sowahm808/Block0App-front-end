# Certificates Backend Update Guide

## Frontend route

The scholar certificates screen is available at `/certificates` in the Angular app and is guarded for authenticated Scholar users. The page reads certificate readiness with `GET /certificates`, requests certificate creation with `POST /certificates/generate`, links PDF downloads, and opens public verification pages.

## Required endpoints

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/certificates` | Return the scholar eligibility checklist, generation state, and existing certificate if one has been issued. |
| `POST` | `/certificates/generate` | Generate the scholar certificate once all eligibility items are complete. |
| `GET` | `/certificates/{certificateNumber}/pdf` | Return the generated PDF file. |
| `GET` | `/public/certificates/verify/{verificationCode}` | Return public verification data for the existing verification route. |

## `GET /certificates` response shape

Return `200 OK` with the full certificate status object. The frontend accepts `requirements`, `checklist`, or `items`, but `requirements` is preferred.

```json
{
  "eligible": true,
  "generationState": "generated",
  "generationMessage": "Certificate is ready to download.",
  "requirements": [
    {
      "id": "knowledge_questions",
      "label": "Required knowledge questions",
      "status": "complete",
      "progressCurrent": 24,
      "progressTarget": 24,
      "eligible": true
    }
  ],
  "certificate": {
    "scholarName": "Avery Johnson",
    "challengeName": "Block Zero 3-Week CNA Challenge",
    "certificateNumber": "B0-2026-000123",
    "issueDate": "2026-07-24",
    "verificationCode": "B0V-7K9Q2P",
    "status": "active",
    "downloadUrl": "/certificates/B0-2026-000123/pdf",
    "verificationUrl": "/certificate/verify/B0V-7K9Q2P"
  }
}
```

## Eligibility checklist contract

Return one record for each required item below. Each item displays its completion status, numeric progress, and eligible state.

| Requirement `id` | Label | Suggested source of truth |
| ---------------- | ----- | ------------------------- |
| `knowledge_questions` | Required knowledge questions | Required knowledge-question completion count. |
| `clinical_scenarios` | Required clinical scenarios | Required clinical scenario completion count. |
| `rehearsal_completion` | Rehearsal completion | Final rehearsal completion record. |
| `w3_acknowledgements` | W3 acknowledgements | Week 3 acknowledgement submissions. |
| `required_check_ins` | Required check-ins | Morning/evening required check-in count. |
| `final_readiness_check` | Final readiness check | Final readiness assessment completion. |

### Checklist fields

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `id` | string | Yes | Stable machine key. Use the IDs listed above. |
| `label` | string | Yes | Learner-facing checklist label. |
| `status` | enum | Yes | One of `complete`, `incomplete`, or `in_progress`. |
| `progressCurrent` | number | Yes | Current completed amount. |
| `progressTarget` | number | Yes | Required amount. Use `1` for boolean requirements. |
| `eligible` | boolean | Yes | Whether this item satisfies certificate eligibility. |

## Generation behavior

`POST /certificates/generate` should:

1. Recompute all eligibility server-side. Do not trust client eligibility.
2. Return `403 Forbidden` or `409 Conflict` if any required checklist item is not eligible.
3. Be idempotent. If a certificate already exists, return the existing certificate rather than issuing a duplicate.
4. Create a unique `certificateNumber` and `verificationCode`.
5. Persist `issueDate`, `status`, scholar identity, challenge identity, and PDF artifact metadata.
6. Return `200 OK` with the current certificate or `202 Accepted` if asynchronous PDF generation is queued.

Example synchronous response:

```json
{
  "generationState": "generated",
  "certificate": {
    "scholarName": "Avery Johnson",
    "challengeName": "Block Zero 3-Week CNA Challenge",
    "certificateNumber": "B0-2026-000123",
    "issueDate": "2026-07-24",
    "verificationCode": "B0V-7K9Q2P",
    "status": "active",
    "downloadUrl": "/certificates/B0-2026-000123/pdf",
    "verificationUrl": "/certificate/verify/B0V-7K9Q2P"
  }
}
```

## Certificate card fields

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `scholarName` | string | Yes | Name printed on the certificate card and PDF. |
| `challengeName` | string | Yes | Challenge/program name. |
| `certificateNumber` | string | Yes | Human-readable unique certificate number. |
| `issueDate` | ISO date string | Yes | Date certificate was issued. |
| `verificationCode` | string | Yes | Public verification lookup code. |
| `status` | enum | Yes | Recommended values: `active`, `pending`, `revoked`, `expired`. |
| `downloadUrl` | string | No | Absolute or app-relative PDF URL. If omitted, the frontend falls back to `/api/certificates/{certificateNumber}/pdf`. |
| `verificationUrl` | string | No | Public verification URL. If omitted, the frontend falls back to `/certificate/verify/{verificationCode}`. |

## Empty and error states

Return `200 OK` with all six checklist items even when the scholar has no progress yet. Use `401`/`403` for authentication and authorization failures. Use `409 Conflict` for generation attempts before eligibility is met, and reserve `5xx` responses for unexpected backend failures.
