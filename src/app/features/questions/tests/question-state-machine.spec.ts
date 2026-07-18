import { describe, expect, it } from 'vitest';
import {
  beginSubmit,
  completeQuestion,
  selectAnswer,
  showCorrectAnswer,
  showMemoryPearl,
  type QuestionMachine,
} from '../state/question-state-machine';
const machine: QuestionMachine = {
  state: 'Challenge',
  startedAt: 0,
  markedForReview: false,
  question: {
    attemptId: 'a1',
    stem: 'Stem',
    choices: [{ id: 'a', label: 'A', text: 'Choice' }],
    questionNumber: 1,
    capsuleProgress: '1/4',
    markedForReview: false,
  },
};
const result = {
  selectedChoiceId: 'a',
  correctChoiceId: 'b',
  correct: false,
  correctRationale: 'Because',
  incorrectRationales: { a: 'No' },
  memory: { highYieldFact: 'Fact', pearl: 'Pearl', clinicalRelevance: 'Relevant', examTrap: 'Trap' },
};
describe('Three Whisper state machine', () => {
  it('requires an answer before submitting', () => expect(() => beginSubmit(machine)).toThrow());
  it('enforces W1 to W2 to W3 order', () => {
    const selected = selectAnswer(machine, 'a');
    const submitting = beginSubmit(selected);
    const w2 = showCorrectAnswer(submitting, result);
    const w3 = showMemoryPearl(w2);
    expect(completeQuestion(w3).state).toBe('Completed');
  });
  it('prevents W3 before W2', () => expect(() => showMemoryPearl(machine)).toThrow());
});
