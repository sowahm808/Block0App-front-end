import { CurrentUser } from '../models/roles';

export interface ApiError {
  status: number;
  message: string;
  correlationId?: string;
  validationErrors?: Record<string, string[]>;
}
export interface LoginCredentials { email: string; password: string; mfaCode?: string; }
export interface LoginRequest { email: string; password?: string; mfaCode?: string; firebaseIdToken?: string; }
export interface RegisterRequest { displayName: string; email: string; password: string; }
export interface RegisterResponse { userId: string; email: string; emailVerificationLink: string | null; }
export interface TokenResponse { accessToken: string; expiresUtc: string; refreshToken: string; refreshExpiresUtc: string; tokenType: string; }
export type CurrentUserResponse = CurrentUser;

export interface LearningPack {
  id?: string;
  externalId?: string;
  title: string;
  description?: string;
  challengeId?: string;
  dayNumber?: number;
  audience?: string;
  status?: string;
  estimatedMinutes?: number;
  capsuleCount?: number;
  questionCount?: number;
  resources?: string[];
  continueUrl?: string;
}
export interface DashboardLearningPack extends LearningPack { progress?: number; readinessLevel?: string; }
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
  assignedLearningPacks?: Array<string | DashboardLearningPack>;
  dailyCapsuleGoal?: number;
  encouragementMessage?: string;
  continueUrl?: string;
  stale?: boolean;
}
export interface Choice { id: string; label: string; text: string; }
export type AnswerChoiceDto = Choice;
export interface CapsuleQuestion {
  attemptId: string;
  stem: string;
  choices: Choice[];
  questionNumber: number;
  capsuleProgress: string;
  figureUrl?: string;
  tableHtml?: string;
  supportingMediaUrl?: string;
  markedForReview: boolean;
}
export type W1QuestionDto = CapsuleQuestion;
export interface QuestionSubmitRequest { choiceId: string; elapsedMs: number; markedForReview: boolean; submittedAtUtc?: string; }
export interface QuestionSubmitResponse {
  selectedChoiceId: string;
  correctChoiceId: string;
  correct: boolean;
  correctRationale: string;
  incorrectRationales: Record<string, string>;
  reference?: string;
  memory: { highYieldFact: string; pearl: string; clinicalRelevance: string; examTrap: string; mnemonic?: string };
}
export type QuestionSubmitResult = QuestionSubmitResponse;
export interface CapsuleResume {
  capsuleAttemptId: string;
  title: string;
  summary?: string;
  learningPackTitle?: string;
  questionCount: number;
  completedQuestions: number;
  dailyTarget?: number;
  nextQuestion?: CapsuleQuestion;
  complete: boolean;
}
export type CapsuleResumeDto = CapsuleResume;
export interface LearningPackImportRequest {
  sourceFileName?: string;
  learningPack: LearningPack;
  capsules: Array<{
    externalId: string; title: string; summary?: string; sequence: number; estimatedMinutes?: number; status?: string;
    questions: Array<{ externalId: string; sequence: number; stem: string; choices: Choice[]; explanation: QuestionSubmitResponse & { memory: QuestionSubmitResponse['memory'] } }>;
  }>;
}
export interface LearningPackImportSummary {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  validationErrors?: Array<string | { path?: string; message: string }>;
  contentIds?: Record<string, string | string[]>;
  importedBy?: string;
  importedAt?: string;
  sourceFileName?: string;
}
