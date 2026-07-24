# Readiness Dashboard backend update guide

The frontend route `/readiness` now expects a scholar-scoped readiness payload from `GET /readiness/current`. The UI intentionally separates academic and engagement results so high engagement cannot visually conceal weak academic performance.

## Required endpoint

`GET /readiness/current`

Return the authenticated scholar's latest readiness calculation. Protect this endpoint with the same scholar authentication and authorization used by scenarios, rehearsal, check-ins, and team participation endpoints.

## Response contract

```json
{
  "readinessLevel": "Needs focused review",
  "academicScore": 58,
  "engagementScore": 91,
  "lastCalculatedAt": "2026-07-24T08:30:00Z",
  "formulaVersion": "readiness-v1.0.0",
  "academicComponents": {
    "knowledgeAccuracy": 62,
    "clinicalScenarioPerformance": 54,
    "rehearsalPerformance": 49,
    "topicCoverage": 71,
    "completion": 65
  },
  "engagementComponents": {
    "consistency": 94,
    "checkInParticipation": 88,
    "studyStreak": 100,
    "teamParticipation": 82
  },
  "improvementActions": [
    "Review cardiovascular questions",
    "Complete two pending scenarios",
    "Revisit marked questions",
    "Improve daily consistency"
  ]
}
```

## Field notes

- `readinessLevel`: human-readable level derived from academic readiness first, then engagement as secondary context.
- `academicScore`: integer or decimal from `0` to `100`. This should represent exam-preparation performance only.
- `engagementScore`: integer or decimal from `0` to `100`. This should represent participation and consistency only.
- `lastCalculatedAt`: ISO-8601 timestamp for the calculation shown to the scholar.
- `formulaVersion`: stable formula identifier for auditability and support troubleshooting.
- `academicComponents`: include all five keys: `knowledgeAccuracy`, `clinicalScenarioPerformance`, `rehearsalPerformance`, `topicCoverage`, and `completion`.
- `engagementComponents`: include all four keys: `consistency`, `checkInParticipation`, `studyStreak`, and `teamParticipation`.
- `improvementActions`: ordered, scholar-specific next steps. Prefer concrete actions over generic encouragement.

## Calculation guidance

1. Calculate academic and engagement scores independently.
2. Do not average engagement into the academic score.
3. Use academic weakness to drive the primary readiness level when academic performance is below the desired threshold.
4. Keep formula versions immutable once deployed; create a new version string when weights or thresholds change.
5. If there is not enough data, return an empty response or `204 No Content` so the frontend can show the empty state.

## Suggested data sources

- Knowledge accuracy: question attempt correctness by topic and recency.
- Clinical scenario performance: completed scenario attempt scores and critical-action completion.
- Rehearsal performance: missed-question review, weak-topic review, and memory-pearl outcomes.
- Topic coverage: required topic completion across the Block Zero curriculum.
- Completion: completion of assigned questions, scenarios, rehearsals, and learning tasks.
- Consistency: daily activity distribution over the readiness window.
- Check-in participation: submitted morning/evening check-ins divided by expected check-ins.
- Study streak: current and recent streak performance.
- Team participation: team posts, support requests, encouragement, or collaboration activity.

## UI safety requirement

The frontend displays academic score cards in blue and engagement score cards in green with separate component sections. Backend summaries, readiness levels, and generated improvement actions should follow the same rule: engagement may contextualize habits, but it must not hide, inflate, or re-label weak academic readiness.
