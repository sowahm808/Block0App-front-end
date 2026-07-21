import { QuestionSubmitResult, W1QuestionDto } from '../../../core/api/api.types';
export type WhisperState = 'Challenge' | 'Submitting' | 'CorrectAnswer' | 'MemoryPearl' | 'Completed';
export interface QuestionMachine {
  state: WhisperState;
  question: W1QuestionDto;
  selectedChoiceId?: string;
  result?: QuestionSubmitResult;
  startedAt: number;
  submittedAtUtc?: string;
  markedForReview: boolean;
}
export function selectAnswer(m: QuestionMachine, choiceId: string): QuestionMachine {
  if (m.state !== 'Challenge') return m;
  return { ...m, selectedChoiceId: choiceId };
}
export function markForReview(m: QuestionMachine, marked: boolean): QuestionMachine {
  if (m.state === 'Completed') return m;
  return { ...m, markedForReview: marked };
}
export function beginSubmit(m: QuestionMachine, submittedAtUtc = new Date().toISOString()): QuestionMachine {
  if (m.state !== 'Challenge' || !m.selectedChoiceId) throw new Error('Answer required before submission');
  return { ...m, state: 'Submitting', submittedAtUtc };
}
export function showCorrectAnswer(m: QuestionMachine, result: QuestionSubmitResult): QuestionMachine {
  if (m.state !== 'Submitting') throw new Error('Submission result is only valid while submitting');
  return { ...m, state: 'CorrectAnswer', result };
}
export function showMemoryPearl(m: QuestionMachine): QuestionMachine {
  if (m.state !== 'CorrectAnswer') throw new Error('W3 must follow W2');
  return { ...m, state: 'MemoryPearl' };
}
export function completeQuestion(m: QuestionMachine): QuestionMachine {
  if (m.state !== 'MemoryPearl') throw new Error('Learner must acknowledge W3 before completion');
  return { ...m, state: 'Completed' };
}
export function elapsedMs(m: QuestionMachine, now = Date.now()) {
  return Math.max(0, now - m.startedAt);
}
