import { CurrentUser } from '../models/roles';

export interface ApiError {
  status: number;
  message: string;
  correlationId?: string;
  validationErrors?: Record<string, string[]>;
}
export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}
export interface LoginRequest {
  email: string;
  password?: string;
  mfaCode?: string;
  firebaseIdToken?: string;
}
export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
  country: string;
  timeZone: string;
  primaryStudyDevice?: string | null;
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
}
export interface RegisterResponse {
  userId: string;
  email: string;
  emailVerificationLink: string | null;
}
export interface TokenResponse {
  accessToken: string;
  expiresUtc: string;
  refreshToken: string;
  refreshExpiresUtc: string;
  tokenType: string;
}
export type CurrentUserResponse = CurrentUser;

export interface LearningPackCapsule {
  id?: string;
  capsuleId?: string;
  externalId?: string;
  capsuleNumber?: number;
  sequence?: number;
  title: string;
  questionCount?: number;
  totalQuestions?: number;
  estimatedMinutes?: number;
  estimatedDurationMinutes?: number;
  status?: string;
  progressStatus?: string;
  completedAt?: string;
  completedAtUtc?: string;
  startUrl?: string;
  continueUrl?: string;
  activeAttemptId?: string;
  activeCapsuleAttemptId?: string;
}

export interface CapsuleStartResponse {
  capsuleAttemptId: string;
  capsuleId?: string;
  status?: string;
  resumeUrl?: string;
}

export interface LearningPack {
  id?: string;
  externalId?: string;
  code?: string;
  title: string;
  description?: string;
  topic?: string;
  objectivesSummary?: string;
  objectives?: string[];
  summary?: string;
  challengeId?: string;
  dayNumber?: number;
  audience?: string;
  status?: string;
  progressStatus?: string;
  availability?: string;
  availabilityStatus?: string;
  estimatedMinutes?: number;
  estimatedStudyMinutes?: number;
  capsuleCount?: number;
  totalCapsules?: number;
  completedCapsules?: number;
  questionCount?: number;
  totalQuestions?: number;
  completedQuestions?: number;
  questionsAnswered?: number;
  accuracy?: number;
  accuracyPercentage?: number;
  accuracyPermitted?: boolean;
  progress?: number;
  progressPercentage?: number;
  resources?: string[];
  continueUrl?: string;
  nextCapsuleUrl?: string;
  activeCapsuleUrl?: string;
  capsules?: LearningPackCapsule[];
}
export interface DashboardLearningPack extends LearningPack {
  progress?: number;
  readinessLevel?: string;
}
export type DashboardEnrollmentState = 'active' | 'not_enrolled' | 'not_started' | 'completed';

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
  dailyQuestionTarget?: number;
  completedDays?: number;
  academicScore?: number;
  engagementScore?: number;
  readinessLastUpdated?: string;
  teamName?: string;
  membersActiveToday?: number;
  teamDailyCompletion?: number;
  latestEncouragement?: string;
  rewardsEarned?: number;
  nextAvailableReward?: string;
  requiredCapsules?: string;
  scenarioAssignment?: string;
  rehearsalAssignment?: string;
  restDayInstructions?: string;
  recentActivity?: string[];
  enrollmentState?: DashboardEnrollmentState;
  startDate?: string;
  countdown?: string;
  preparationChecklist?: string[];
  completionMessage?: string;
  certificateStatus?: string;
  finalReadiness?: string;
  encouragementMessage?: string;
  continueUrl?: string;
  stale?: boolean;
}
export interface Choice {
  id: string;
  label: string;
  text: string;
}
export type AnswerChoiceDto = Choice;
export type QuestionAnswerType = 'single_answer' | 'multiple_select' | 'numeric' | 'short_response';
export interface CapsuleQuestion {
  attemptId: string;
  stem: string;
  choices: Choice[];
  questionNumber: number;
  capsuleProgress: string;
  answerType?: QuestionAnswerType;
  minSelections?: number;
  maxSelections?: number;
  unit?: string;
  maxLength?: number;
  figureUrl?: string;
  figureAlt?: string;
  tableHtml?: string;
  supportingMediaUrl?: string;
  markedForReview: boolean;
}
export type W1QuestionDto = CapsuleQuestion;
export interface QuestionSubmitRequest {
  choiceId?: string;
  choiceIds?: string[];
  numericAnswer?: number | string | null;
  shortAnswer?: string;
  elapsedMs: number;
  markedForReview: boolean;
  submittedAtUtc?: string;
}
export interface QuestionSubmitResponse {
  selectedChoiceId: string;
  selectedChoiceIds?: string[];
  correctChoiceId: string;
  correctChoiceIds?: string[];
  correct: boolean;
  correctRationale: string;
  incorrectRationales: Record<string, string>;
  reference?: string;
  referenceTitle?: string;
  referenceUrl?: string;
  memory: { highYieldFact: string; pearl: string; clinicalRelevance: string; examTrap: string; mnemonic?: string };
}
export type QuestionSubmitResult = QuestionSubmitResponse;
export interface CapsuleResume {
  capsuleAttemptId: string;
  title: string;
  summary?: string;
  learningPackTitle?: string;
  capsuleNumber?: number;
  sequence?: number;
  questionCount: number;
  completedQuestions: number;
  dailyTarget?: number;
  remainingSeconds?: number;
  timerRemainingSeconds?: number;
  timeRemainingSeconds?: number;
  elapsedSeconds?: number;
  timerElapsedSeconds?: number;
  nextQuestion?: CapsuleQuestion;
  complete: boolean;
}
export type CapsuleResumeDto = CapsuleResume;
export interface LearningPackImportRequest {
  sourceFileName?: string;
  learningPack: LearningPack;
  capsules: Array<{
    externalId: string;
    title: string;
    summary?: string;
    sequence: number;
    estimatedMinutes?: number;
    status?: string;
    questions: Array<{
      externalId: string;
      sequence: number;
      stem: string;
      choices: Choice[];
      explanation: QuestionSubmitResponse & { memory: QuestionSubmitResponse['memory'] };
    }>;
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

export interface TodayLearningPackDto {
  id?: string;
  packNumber: number;
  title: string;
  topic: string;
  capsuleCount: number;
  completedCapsules: number;
  status: string;
  continueUrl?: string;
}

export interface TodayChallengeDto {
  studyDay: number;
  phaseTitle: string;
  dailyTitle: string;
  encouragementMessage: string;
  administrativeAnnouncement: string;
  teamProgressMessage: string;
  targetCapsules: number;
  targetQuestions: number;
  targetStudyMinutes: number;
  completionPercentage: number;
  currentStreak: number;
  assignedLearningPacks: TodayLearningPackDto[];
  morningCheckInDone: boolean;
  eveningCheckInDone: boolean;
  continueUrl?: string;
  currentCapsuleUrl?: string;
  locked?: boolean;
  releaseAtUtc?: string;
  cohortTimeZone?: string;
}
