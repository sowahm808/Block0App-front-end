import { inject, Injectable } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { ClinicalScenario, ScenarioAttempt, ScenarioDetail, ScenarioReview, ScenarioSummary } from './scenario.models';

const sampleScenarios: ClinicalScenario[] = [
  {
    id: 'sepsis-triage',
    title: 'Febrile hypotension in the ED',
    clinicalCategory: 'Emergency Medicine',
    clinicalDomain: 'Infectious Disease',
    difficulty: 'Moderate',
    questionCount: 6,
    mode: 'timed',
    estimatedMinutes: 18,
    status: 'in_progress',
    activeAttemptId: 'attempt-sepsis-1',
  },
  {
    id: 'chest-pain',
    title: 'Chest pain after a long flight',
    clinicalCategory: 'Internal Medicine',
    clinicalDomain: 'Cardiopulmonary',
    difficulty: 'Hard',
    questionCount: 8,
    mode: 'untimed',
    estimatedMinutes: 25,
    status: 'completed',
    score: 88,
    scorePermitted: true,
    activeAttemptId: 'attempt-chest-1',
  },
  {
    id: 'pediatric-wheeze',
    title: 'Toddler with acute wheeze',
    clinicalCategory: 'Pediatrics',
    clinicalDomain: 'Pulmonology',
    difficulty: 'Easy',
    questionCount: 5,
    mode: 'timed',
    estimatedMinutes: 15,
    status: 'not_started',
  },
];

@Injectable({ providedIn: 'root' })
export class ScenarioDataService {
  #api = inject(ApiService);

  list() {
    return this.#api
      .get<{ summary?: ScenarioSummary; scenarios?: ClinicalScenario[] }>('/scenarios')
      .pipe(catchError(() => of(this.fallbackList())));
  }
  detail(id: string) {
    return this.#api.get<ScenarioDetail>(`/scenarios/${id}`).pipe(catchError(() => of(this.fallbackDetail(id))));
  }
  attempt(id: string) {
    return this.#api
      .get<ScenarioAttempt>(`/scenario-attempts/${id}`)
      .pipe(catchError(() => of(this.fallbackAttempt(id))));
  }
  review(id: string) {
    return this.#api
      .get<ScenarioReview>(`/scenario-attempts/${id}/review`)
      .pipe(catchError(() => of(this.fallbackReview(id))));
  }
  startAttempt(id: string) {
    return this.#api.post<{ attemptId: string }>(`/scenarios/${id}/attempts`, {}).pipe(
      map((r) => r.attemptId),
      catchError(() => of(`attempt-${id}`)),
    );
  }

  fallbackList() {
    return {
      summary: {
        availableScenarios: 12,
        completedScenarios: 4,
        currentDayTarget: 2,
        averagePerformance: 82,
        timedScenariosPending: 3,
      },
      scenarios: sampleScenarios,
    };
  }
  fallbackDetail(id: string): ScenarioDetail {
    const s = sampleScenarios.find((x) => x.id === id) ?? sampleScenarios[0];
    return {
      ...s,
      instructions: [
        'Read the patient summary, vignette, labs, and media before answering.',
        'Select the best answer for each question and submit to continue.',
      ],
      attemptRules: [
        'Sequential scenarios may reveal one question at a time.',
        'Completed scenarios may show scores only when backend permissions allow review.',
      ],
    };
  }
  fallbackAttempt(id: string): ScenarioAttempt {
    return {
      id,
      scenarioTitle: 'Febrile hypotension in the ED',
      mode: 'timed',
      timerLabel: '17:42 remaining',
      currentQuestionIndex: 0,
      questionCount: 3,
      saveStatus: 'Saved moments ago',
      sequentialProgressionRequired: true,
      patientSummary: {
        age: '67 years',
        sexOrGender: 'Female',
        presentingComplaint: 'Fever, confusion, and dizziness',
        vitalSigns: ['T 39.2°C', 'HR 118', 'BP 86/52', 'RR 24', 'SpO₂ 94% RA'],
        relevantHistory: ['Diabetes mellitus', 'Recent urinary symptoms', 'Takes lisinopril and metformin'],
      },
      clinicalVignette:
        'A 67-year-old presents with fever, altered mental status, and hypotension after three days of dysuria. She is lethargic but arousable.',
      labResults: [
        { test: 'WBC', result: '18.5 x10⁹/L', referenceRange: '4.0–11.0', abnormal: true },
        { test: 'Lactate', result: '4.1 mmol/L', referenceRange: '<2.0', abnormal: true },
        { test: 'Creatinine', result: '1.8 mg/dL', referenceRange: '0.6–1.2', abnormal: true },
      ],
      supportingMedia: [
        {
          type: 'chart',
          title: 'Sepsis bundle timeline',
          description: 'Chart showing fluids, cultures, antibiotics, and vasopressor checkpoints.',
        },
      ],
      questions: [
        {
          id: 'q1',
          stem: 'What is the most appropriate immediate management priority?',
          choices: [
            'Order outpatient urine culture',
            'Give broad-spectrum antibiotics and IV crystalloid resuscitation',
            'Discharge with oral antibiotics',
            'Delay treatment until imaging confirms source',
          ],
        },
        {
          id: 'q2',
          stem: 'Which finding most strongly supports septic shock physiology?',
          choices: [
            'Mild pyuria',
            'Elevated lactate with persistent hypotension',
            'Low-grade fever',
            'Normal oxygen saturation',
          ],
        },
        {
          id: 'q3',
          stem: 'What reassessment is required after initial fluid resuscitation?',
          choices: [
            'Repeat volume status and tissue perfusion assessment',
            'Routine clinic follow-up',
            'Screening colonoscopy',
            'No reassessment if fever improves',
          ],
        },
      ],
    };
  }
  fallbackReview(id: string): ScenarioReview {
    return {
      attemptId: id,
      overallScore: 67,
      questionsCorrect: 2,
      questionCount: 3,
      timeTaken: '16 min 24 sec',
      rehearsalAvailable: true,
      clinicalDomainPerformance: [
        { domain: 'Sepsis recognition', score: 75 },
        { domain: 'Initial resuscitation', score: 60 },
      ],
      questions: [
        {
          id: 'q1',
          stem: 'What is the most appropriate immediate management priority?',
          scholarAnswer: 'Broad-spectrum antibiotics and fluids',
          correctAnswer: 'Give broad-spectrum antibiotics and IV crystalloid resuscitation',
          rationale: 'Hypotension, fever, leukocytosis, and elevated lactate require immediate sepsis management.',
          clinicalReasoningExplanation:
            'Treat suspected septic shock before waiting for confirmatory imaging because delay increases mortality.',
          reference: 'Surviving Sepsis Campaign adult guidelines',
        },
      ],
    };
  }
}
