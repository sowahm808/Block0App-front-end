export type ScenarioStatus = 'not_started' | 'in_progress' | 'completed';
export type ScenarioMode = 'timed' | 'untimed';

export interface ScenarioSummary {
  availableScenarios: number;
  completedScenarios: number;
  currentDayTarget: number;
  averagePerformance: number;
  timedScenariosPending: number;
}

export interface ClinicalScenario {
  id: string;
  title: string;
  clinicalCategory: string;
  clinicalDomain: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  questionCount: number;
  mode: ScenarioMode;
  estimatedMinutes: number;
  status: ScenarioStatus;
  score?: number;
  scorePermitted?: boolean;
  activeAttemptId?: string;
}

export interface ScenarioDetail extends ClinicalScenario {
  instructions: string[];
  attemptRules: string[];
}

export interface PatientSummary {
  age: string;
  sexOrGender?: string;
  presentingComplaint: string;
  vitalSigns: string[];
  relevantHistory: string[];
}

export interface LabResult {
  test: string;
  result: string;
  referenceRange: string;
  abnormal: boolean;
}

export interface SupportingMedia {
  type: 'image' | 'diagram' | 'chart';
  title: string;
  description: string;
  url?: string;
}

export interface ScenarioQuestion {
  id: string;
  stem: string;
  choices: string[];
  selectedAnswer?: string;
  scholarAnswer?: string;
  correctAnswer?: string;
  rationale?: string;
  clinicalReasoningExplanation?: string;
  reference?: string;
  correct?: boolean;
}

export interface ScenarioAttempt {
  id: string;
  scenarioTitle: string;
  mode: ScenarioMode;
  timerLabel: string;
  currentQuestionIndex: number;
  questionCount: number;
  saveStatus: string;
  sequentialProgressionRequired: boolean;
  patientSummary: PatientSummary;
  clinicalVignette: string;
  labResults: LabResult[];
  supportingMedia: SupportingMedia[];
  questions: ScenarioQuestion[];
}

export interface ScenarioReview {
  attemptId: string;
  overallScore: number;
  questionsCorrect: number;
  questionCount: number;
  timeTaken: string;
  clinicalDomainPerformance: { domain: string; score: number }[];
  rehearsalAvailable: boolean;
  questions: Required<
    Pick<
      ScenarioQuestion,
      'id' | 'stem' | 'scholarAnswer' | 'correctAnswer' | 'rationale' | 'clinicalReasoningExplanation' | 'reference'
    >
  >[];
}
