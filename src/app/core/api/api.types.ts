export interface ApiError {
  status: number;
  message: string;
  correlationId?: string;
  validationErrors?: Record<string, string[]>;
}
export interface LoginRequest {
  email: string;
  password: string;
}
export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
}
export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: import('../models/roles').CurrentUser;
}
export interface DashboardDto {
  scholarName: string;
  currentChallenge: string;
  currentDay: number;
  dailyTarget: number;
  questionsCompletedToday: number;
  capsulesCompletedToday: number;
  overallCompletion: number;
  knowledgeAccuracy: number;
  scenarioPerformance: number;
  currentStreak: number;
  morningCheckInDone: boolean;
  eveningCheckInDone: boolean;
  teamActivity: string;
  readinessLevel: string;
  raffleEntries: number;
  announcements: string[];
  continueUrl: string;
  stale?: boolean;
}
export interface AnswerChoiceDto {
  id: string;
  label: string;
  text: string;
}
export interface W1QuestionDto {
  attemptId: string;
  stem: string;
  choices: AnswerChoiceDto[];
  questionNumber: number;
  capsuleProgress: string;
  figureUrl?: string;
  tableHtml?: string;
  markedForReview: boolean;
}
export interface QuestionSubmitRequest {
  choiceId: string;
  elapsedMs: number;
  markedForReview: boolean;
}
export interface QuestionSubmitResult {
  selectedChoiceId: string;
  correctChoiceId: string;
  correct: boolean;
  correctRationale: string;
  incorrectRationales: Record<string, string>;
  reference?: string;
  memory: { highYieldFact: string; pearl: string; clinicalRelevance: string; examTrap: string; mnemonic?: string };
}
