# Business and Learning Content Operations Guide

This guide explains why the Block Zero app exists, what business problems it solves, how learning content should be uploaded into the database, and how the frontend, API, authentication, and learner workflows operate end to end.

## 1. Business needs

### Primary business goal

Mind Unlocking Academy uses the Block Zero 21-Day Challenge to turn medical exam preparation into a structured daily coaching product. The application needs to help scholars complete assigned learning, answer questions, review explanations safely, practice scenarios, check in with mentors, and provide administrators with enough visibility to run a cohort at scale.

### Stakeholder needs

| Stakeholder | Needs | App capabilities that support the need |
| --- | --- | --- |
| Scholars | Know what to do today, complete capsules, receive feedback, track readiness, and stay motivated. | Dashboard, daily challenge routes, learning packs, capsule attempts, Three Whisper question workflow, check-ins, rewards, certificates, notifications. |
| Mentors | Monitor scholar progress, identify risk, and guide learners before they fall behind. | Mentor-only route, team/readiness/report data, support requests, check-in signals. |
| Content reviewers | Review educational material before it reaches learners and prevent answer leakage. | Content-review route, typed API boundaries, question-attempt submission flow where correct answers are returned only after submission. |
| Administrators | Manage cohorts, content, auditability, and platform operations. | Admin route, audit route, reports APIs, role-based navigation and guards. |
| Support and operations | Investigate failures quickly without exposing secrets. | Correlation IDs, global error handling, typed API service layer, Firebase ID-token authentication. |

### Business requirements

1. **Role-aware learning delivery:** scholars, mentors, reviewers, and admins should see only the areas relevant to their roles and permissions.
2. **Secure learner identity:** user sessions should rely on Firebase-backed identity, backend-issued profile data, bearer tokens for API calls, and refresh behavior that does not persist refresh tokens in browser storage.
3. **Structured content progression:** learning packs should group capsules, capsules should contain ordered questions or learning tasks, and question explanations should unlock after the scholar submits an answer.
4. **Operational observability:** support teams need correlation IDs, error states, and API health signals to distinguish user, permission, and backend issues.
5. **Content scalability:** content upload should use predictable database records and import validation so cohorts can be launched without one-off manual database edits.

## 2. Recommended learning-content data model

The frontend already calls backend resources such as `/learning-packs`, `/capsules`, `/capsule-attempts/{capsuleAttemptId}/resume`, and `/capsule-attempts/{capsuleAttemptId}/question-attempts/{questionAttemptId}/submit`. The database should therefore keep authoring records separate from learner-attempt records.

### Authoring tables or collections

| Entity | Purpose | Important fields |
| --- | --- | --- |
| `learning_packs` | A themed collection assigned to a cohort, day, or readiness level. | `id`, `title`, `description`, `challengeId`, `dayNumber`, `audience`, `status`, `publishAtUtc`, `createdBy`, `reviewedBy`. |
| `capsules` | A short focused module inside a learning pack. | `id`, `learningPackId`, `title`, `summary`, `sequence`, `estimatedMinutes`, `dailyTarget`, `status`. |
| `questions` | The learner-facing W1 question stem and choices. | `id`, `capsuleId`, `sequence`, `stem`, `choices`, `figureUrl`, `tableHtml`, `supportingMediaUrl`, `tags`, `difficulty`. |
| `question_explanations` | Locked feedback shown only after submission. | `questionId`, `correctChoiceId`, `correctRationale`, `incorrectRationales`, `reference`, `memory.highYieldFact`, `memory.pearl`, `memory.clinicalRelevance`, `memory.examTrap`, `memory.mnemonic`. |
| `assignments` | Connects content to a scholar, team, cohort, or challenge day. | `id`, `targetType`, `targetId`, `learningPackId`, `startUtc`, `dueUtc`, `required`. |
| `content_reviews` | Review workflow and audit trail. | `id`, `entityType`, `entityId`, `status`, `reviewerId`, `notes`, `reviewedAtUtc`. |

### Learner-attempt tables or collections

| Entity | Purpose | Important fields |
| --- | --- | --- |
| `capsule_attempts` | One scholar's progress through a capsule. | `id`, `scholarId`, `capsuleId`, `startedAtUtc`, `completedAtUtc`, `completedQuestions`, `currentQuestionAttemptId`. |
| `question_attempts` | One scholar's answer attempt. | `id`, `capsuleAttemptId`, `questionId`, `choiceId`, `elapsedMs`, `markedForReview`, `submittedAtUtc`, `correct`. |
| `dashboard_snapshots` or computed view | Fast dashboard rendering. | `scholarId`, `currentChallenge`, `currentDay`, `questionsCompletedToday`, `overallCompletion`, `readinessLevel`, `continueUrl`. |

## 3. Upload workflow for learning content

Use the following process to upload content safely into the database.

### Step 1: Prepare an import file

Create a CSV or JSON file using stable external IDs so repeated imports are idempotent. JSON is preferred because choices, rationales, and memory fields are nested.

```json
{
  "learningPack": {
    "externalId": "bp-day-01-foundations",
    "title": "Block Zero Day 1 Foundations",
    "description": "Core concepts and baseline diagnostic practice.",
    "challengeId": "block-zero-21-day",
    "dayNumber": 1,
    "audience": "Scholar",
    "status": "draft"
  },
  "capsules": [
    {
      "externalId": "bp-day-01-capsule-01",
      "title": "High-yield diagnostic reasoning",
      "summary": "Practice identifying the key finding before choosing an answer.",
      "sequence": 1,
      "estimatedMinutes": 12,
      "questions": [
        {
          "externalId": "bp-day-01-q001",
          "sequence": 1,
          "stem": "Question stem shown before submission.",
          "choices": [
            { "id": "A", "label": "A", "text": "Choice A" },
            { "id": "B", "label": "B", "text": "Choice B" }
          ],
          "explanation": {
            "correctChoiceId": "A",
            "correctRationale": "Why A is correct.",
            "incorrectRationales": { "B": "Why B is incorrect." },
            "reference": "Internal content reference or citation.",
            "memory": {
              "highYieldFact": "One memorable fact.",
              "pearl": "Clinical pearl.",
              "clinicalRelevance": "Why this matters.",
              "examTrap": "Common trap.",
              "mnemonic": "Optional mnemonic."
            }
          }
        }
      ]
    }
  ]
}
```

### Step 2: Validate before writing

The import job should reject the file if any of these checks fail:

- Required fields are missing: pack title, capsule title, question stem, at least two choices, correct choice, and rationales.
- `correctChoiceId` is not one of the submitted choice IDs.
- Duplicate `externalId` values appear in the same file.
- A published learning pack contains draft or rejected capsules/questions.
- W1 payload fields contain W2/W3-only answer data such as `correctChoiceId`, `correctRationale`, or `incorrectRationales`.

### Step 3: Upsert authoring records

The backend import endpoint should run in a transaction or batch:

1. Upsert `learning_packs` by `externalId`.
2. Upsert child `capsules` by `externalId` and connect them to the learning pack.
3. Upsert `questions` by `externalId` and connect them to capsules.
4. Upsert `question_explanations` by `questionId`.
5. Create or update `content_reviews` with `status = draft` or `pending_review`.
6. Return an import summary with created, updated, skipped, and failed counts.

Recommended endpoint:

```http
POST /api/v1/admin/content/import-learning-pack
Authorization: Bearer <Firebase ID token>
Content-Type: application/json
```

Only administrator or content-review roles should be allowed to call this endpoint. The frontend already has role-specific admin and review areas, so the backend can expose this upload capability behind the existing admin or review route family.

### Step 4: Review and publish

A reviewer should approve imported content before it becomes visible to scholars:

1. Reviewer opens the content-review workspace.
2. Backend returns pending packs from `/admin/content` or a dedicated review endpoint.
3. Reviewer verifies stems, choices, rationales, references, media links, and answer-key separation.
4. Reviewer changes status to `approved`.
5. Admin publishes the learning pack by setting `status = published` and `publishAtUtc`.

### Step 5: Assign to learners

Create `assignments` for a cohort, team, or individual scholar. The dashboard can then compute `assignedLearningPacks`, daily goals, and the learner's `continueUrl`.

## 4. How the app works end to end

### 1. Boot and configuration

The Angular app starts from `src/main.ts`, loads `app.config.ts`, and uses environment-specific API configuration. All feature services should rely on `environment.apiBaseUrl` through the shared API service rather than hard-coded backend URLs.

### 2. Authentication

1. A guest opens the landing, login, or registration route.
2. Login exchanges email/password with Firebase Identity Toolkit.
3. The app sends login data plus the Firebase ID token to the backend `/auth/login` endpoint.
4. The backend returns token/profile data and `/auth/me` hydrates the current user.
5. Protected routes run the auth guard, and role-specific routes run role guards.

### 3. Navigation and authorization

The shell displays navigation entries based on role and permission metadata. Scholar sections include dashboard, program, today, learning packs, scenarios, team, readiness, updates, and profile. Mentor, review, and admin areas are restricted by role.

### 4. Dashboard and assignments

After login, the dashboard fetches a typed dashboard DTO. It shows current challenge, day, goals, progress, readiness, announcements, assigned learning packs, and a continue URL that should point to the next capsule or task.

### 5. Learning packs and generic feature pages

The learning-packs route uses the shared feature page to call `/learning-packs`, display loading and error states, and render returned records. This makes the frontend ready for real backend data even while feature-specific UI is expanded.

### 6. Capsule question flow

1. Scholar opens `/capsules/{capsuleAttemptId}`.
2. Frontend calls `/capsule-attempts/{capsuleAttemptId}/resume`.
3. Backend returns capsule title, progress, and the next W1 question.
4. Scholar submits a choice to `/capsule-attempts/{capsuleAttemptId}/question-attempts/{questionAttemptId}/submit`.
5. Backend returns correctness, rationales, references, and memory prompts.
6. Scholar advances with `/capsule-attempts/{capsuleAttemptId}/next` until the capsule is complete.

### 7. Scenarios, rehearsal, check-ins, teams, rewards, and certificates

Additional feature routes call their matching typed CRUD service endpoints. These sections complete the business loop: practice, reflection, social accountability, readiness monitoring, recognition, and graduation proof.

### 8. Observability and support

The API layer should attach auth and correlation metadata to backend calls. Error UI should keep the app usable while giving support enough context to inspect backend logs.

## 5. Implementation suggestions

1. **Add a backend import command and admin endpoint** for the JSON schema above.
2. **Use idempotent `externalId` keys** so content operations can safely re-run imports.
3. **Store answer explanations separately** from question stems/choices to enforce delayed answer reveal.
4. **Add content-review status transitions**: `draft -> pending_review -> approved -> published -> archived`.
5. **Create seed data** for one complete learning pack, capsule, question, explanation, assignment, and capsule attempt so end-to-end smoke tests can validate the learner path.
6. **Add API contract tests** proving `/resume` never returns correct-answer fields and `/submit` does return W2/W3 feedback.
7. **Add an admin upload UI later** that calls the import endpoint, previews validation results, and shows created/updated/skipped counts.

## 6. Minimal acceptance checklist

- A published learning pack appears in `/learning-packs` for an assigned scholar.
- The dashboard includes the assigned pack and a `continueUrl` to the next capsule attempt.
- `/resume` returns W1 data only: stem, choices, media, progress, and review flag.
- `/submit` returns the answer key, rationales, reference, and memory prompts only after an answer is submitted.
- Role guards prevent scholars from opening admin or review tools.
- Import results are auditable by user, timestamp, source file, and content IDs.
