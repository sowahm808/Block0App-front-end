import { W1QuestionDto } from '../../core/api/api.types';

export type RehearsalReason =
  | 'previously_incorrect'
  | 'marked_for_review'
  | 'weak_topic'
  | 'not_reviewed_recently'
  | 'memory_pearl_refresh'
  | 'assigned_by_administrator'
  | string;

export interface RehearsalSummaryCounts {
  missedQuestions: number;
  markedQuestions: number;
  weakTopics: number;
  memoryPearlsDue: number;
}

export interface RehearsalSessionCard {
  id: string;
  attemptId?: string;
  title: string;
  questionCount: number;
  estimatedMinutes: number;
  selectionReasons: RehearsalReason[];
  status: 'not_started' | 'in_progress' | 'completed' | string;
  completedAtUtc?: string;
}

export interface RehearsalOverviewDto {
  summary: RehearsalSummaryCounts;
  sessions: RehearsalSessionCard[];
}

export interface RehearsalQuestion extends W1QuestionDto {
  selectionReasons?: RehearsalReason[];
  reviewCategory?: RehearsalReason;
  topic?: string;
}

export interface RehearsalAttemptDto {
  attemptId: string;
  title: string;
  currentQuestion: number;
  totalQuestions: number;
  reviewCategoryCounts: Record<string, number>;
  nextQuestion?: RehearsalQuestion;
  completedQuestions?: number;
  complete?: boolean;
}

export interface RehearsalSummaryDto {
  attemptId: string;
  completedAtUtc?: string;
  questionsReviewed: number;
  improvedAnswers: number;
  remainingWeakTopics: string[];
  memoryPearlsReviewed: number;
  suggestedNextAction: string;
}
