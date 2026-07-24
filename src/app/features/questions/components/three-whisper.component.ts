import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { QuestionSubmitRequest, QuestionSubmitResult, W1QuestionDto } from '../../../core/api/api.types';
import {
  QuestionMachine,
  beginSubmit,
  completeQuestion,
  elapsedMs,
  markForReview,
  selectAnswer,
  showCorrectAnswer,
  showMemoryPearl,
} from '../state/question-state-machine';
@Component({
  selector: 'b0-three-whisper',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatRadioModule],
  template: `@if (machine(); as m) {
    <article
      class="mx-auto max-w-4xl rounded-3xl bg-white p-4 shadow sm:p-6"
      [attr.aria-busy]="m.state === 'Submitting'"
    >
      <div class="sr-only" aria-live="assertive">{{ announcement() }}</div>

      @if (m.state === 'Challenge' || m.state === 'Submitting') {
        <section aria-labelledby="w1-title" class="grid gap-4">
          <div>
            <p class="m-0 text-sm font-black uppercase tracking-[0.18em] text-[var(--b0-primary)]">W1 — Challenge</p>
            <p class="m-0 mt-2 text-sm font-bold text-[var(--b0-text-muted)]">
              Question {{ m.question.questionNumber }} • {{ m.question.capsuleProgress }}
            </p>
            <h1 id="w1-title" class="mt-3 text-2xl font-semibold">{{ m.question.stem }}</h1>
          </div>

          @if (m.question.figureUrl) {
            <figure class="m-0">
              <img
                class="max-h-[28rem] w-full rounded-2xl border object-contain"
                [src]="m.question.figureUrl"
                [alt]="m.question.figureAlt || 'Supporting image for the question'"
              />
            </figure>
          }
          @if (m.question.tableHtml) {
            <div
              class="overflow-auto rounded-2xl border p-3"
              aria-label="Supporting table"
              [innerHTML]="m.question.tableHtml"
            ></div>
          }
          @if (m.question.supportingMediaUrl) {
            <a
              class="font-bold text-[var(--b0-primary)]"
              [href]="m.question.supportingMediaUrl"
              target="_blank"
              rel="noopener"
              >Open supporting media</a
            >
          }

          <div class="rounded-2xl border border-[var(--b0-border)] p-4">
            <h2 class="m-0 text-lg font-black">Answer choices</h2>
            @if (isMultipleSelect(m.question)) {
              <p class="text-sm text-[var(--b0-text-muted)]">Select {{ selectionRequirementLabel(m.question) }}.</p>
              @for (c of m.question.choices; track c.id) {
                <mat-checkbox
                  class="block py-2"
                  [checked]="selectedChoiceIds().includes(c.id)"
                  (change)="toggleChoice(c.id, $event.checked)"
                  [disabled]="m.state === 'Submitting'"
                >
                  <strong>{{ c.label }}.</strong> {{ c.text }}
                </mat-checkbox>
              }
            } @else if (isNumeric(m.question)) {
              <label class="mt-3 block font-bold" for="numeric-answer">Numeric response</label>
              <div class="mt-2 flex flex-wrap items-center gap-3">
                <input
                  id="numeric-answer"
                  class="rounded-xl border border-[var(--b0-border)] px-3 py-2"
                  type="number"
                  [ngModel]="numericAnswer()"
                  (ngModelChange)="numericAnswer.set($event)"
                  [disabled]="m.state === 'Submitting'"
                />
                @if (m.question.unit) {
                  <span class="font-bold">{{ m.question.unit }}</span>
                }
              </div>
            } @else if (isShortResponse(m.question)) {
              <label class="mt-3 block font-bold" for="short-answer">Short response</label>
              <input
                id="short-answer"
                class="mt-2 w-full rounded-xl border border-[var(--b0-border)] px-3 py-2"
                type="text"
                [maxlength]="m.question.maxLength || 280"
                [ngModel]="shortAnswer()"
                (ngModelChange)="shortAnswer.set($event)"
                [disabled]="m.state === 'Submitting'"
              />
              <p class="m-0 mt-1 text-sm text-[var(--b0-text-muted)]">
                {{ shortAnswer().length }} / {{ m.question.maxLength || 280 }} characters
              </p>
            } @else {
              <mat-radio-group
                [value]="m.selectedChoiceId"
                (change)="choose($event.value)"
                [disabled]="m.state === 'Submitting'"
              >
                @for (c of m.question.choices; track c.id) {
                  <mat-radio-button class="block py-2" [value]="c.id"
                    ><strong>{{ c.label }}.</strong> {{ c.text }}</mat-radio-button
                  >
                }
              </mat-radio-group>
            }
            @if (validationMessage()) {
              <p class="m-0 mt-3 font-bold text-red-700" role="alert">{{ validationMessage() }}</p>
            }
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              mat-raised-button
              color="primary"
              type="button"
              [disabled]="m.state === 'Submitting'"
              (click)="openSubmitDialog()"
            >
              Submit Answer
            </button>
            <button
              mat-stroked-button
              type="button"
              (click)="setMarked(!m.markedForReview)"
              [disabled]="m.state === 'Submitting'"
            >
              {{ m.markedForReview ? 'Unmark Review' : 'Mark for Review' }}
            </button>
            <a mat-stroked-button href="/dashboard">Exit Capsule</a>
          </div>
        </section>
      }

      @if (confirmingSubmit()) {
        <div
          class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-dialog-title"
        >
          <div class="max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h2 id="submit-dialog-title" class="m-0 text-2xl font-black">Submit this answer?</h2>
            <p class="mt-3 text-[var(--b0-text-muted)]">Your answer cannot be changed after submission.</p>
            <div class="mt-5 flex justify-end gap-3">
              <button mat-button type="button" (click)="confirmingSubmit.set(false)">Go Back</button
              ><button mat-raised-button color="primary" type="button" (click)="submitRequested()">Submit</button>
            </div>
          </div>
        </div>
      }

      @if (m.state === 'CorrectAnswer' && m.result) {
        <section aria-labelledby="w2-title" class="grid gap-3">
          <p class="m-0 text-sm font-black uppercase tracking-[0.18em] text-[var(--b0-primary)]">W2 — Correct Answer</p>
          <h2 id="w2-title" class="m-0 text-2xl font-black">{{ m.result.correct ? 'Correct' : 'Incorrect' }}</h2>
          <p><strong>Selected answer:</strong> {{ selectedAnswerLabel(m) }}</p>
          <p><strong>Correct answer:</strong> {{ correctAnswerLabel(m) }}</p>
          <p><strong>Why it is right:</strong> {{ m.result.correctRationale }}</p>
          <h3 class="m-0 text-xl font-black">Incorrect-answer explanations</h3>
          <ul class="grid gap-2">
            @for (item of incorrectRationaleEntries(m.result); track item[0]) {
              <li>
                <strong>{{ optionLabel(m.question, item[0]) }}:</strong> {{ item[1] }}
              </li>
            }
          </ul>
          @if (m.result.reference) {
            <p>
              <strong>Reference:</strong> {{ m.result.referenceTitle || 'Reference' }} — {{ m.result.reference }}
              @if (m.result.referenceUrl) {
                <a [href]="m.result.referenceUrl" target="_blank" rel="noopener">Source link</a>
              }
            </p>
          }
          <button mat-raised-button color="primary" type="button" (click)="toMemory()">
            Continue to Remember This
          </button>
        </section>
      }
      @if (m.state === 'MemoryPearl' && m.result) {
        <section aria-labelledby="w3-title" class="grid gap-3">
          <p class="m-0 text-sm font-black uppercase tracking-[0.18em] text-[var(--b0-primary)]">W3 — Remember This</p>
          <h2 id="w3-title" class="m-0 text-2xl font-black">Memory pearl</h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl border p-3">
              <strong>High-yield fact</strong>
              <p>{{ m.result.memory.highYieldFact }}</p>
            </div>
            <div class="rounded-2xl border p-3">
              <strong>Memory pearl</strong>
              <p>{{ m.result.memory.pearl }}</p>
            </div>
            <div class="rounded-2xl border p-3">
              <strong>Clinical relevance</strong>
              <p>{{ m.result.memory.clinicalRelevance }}</p>
            </div>
            <div class="rounded-2xl border p-3">
              <strong>Exam trap</strong>
              <p>{{ m.result.memory.examTrap }}</p>
            </div>
            @if (m.result.memory.mnemonic) {
              <div class="rounded-2xl border p-3">
                <strong>Mnemonic</strong>
                <p>{{ m.result.memory.mnemonic }}</p>
              </div>
            }
          </div>
          <mat-checkbox [checked]="memoryReviewed()" (change)="memoryReviewed.set($event.checked)"
            >I have reviewed this memory pearl</mat-checkbox
          >
          <button
            mat-raised-button
            color="primary"
            type="button"
            [disabled]="!memoryReviewed() || acknowledgingMemory()"
            (click)="ack()"
          >
            {{ acknowledgingMemory() ? 'Saving…' : 'Next Question' }}
          </button>
        </section>
      }
    </article>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreeWhisperComponent implements OnChanges {
  question = input.required<W1QuestionDto>();
  submitAnswer = output<QuestionSubmitRequest>();
  acknowledgeMemory = output<{ attemptId: string }>();
  machine = signal<QuestionMachine | undefined>(undefined);
  confirmingSubmit = signal(false);
  validationMessage = signal('');
  selectedChoiceIds = signal<string[]>([]);
  numericAnswer = signal<number | string | null>(null);
  shortAnswer = signal('');
  memoryReviewed = signal(false);
  acknowledgingMemory = signal(false);
  announcement = signal('');

  ngOnChanges(changes: SimpleChanges) {
    const previousAttemptId = changes['question']?.previousValue?.attemptId;
    const currentAttemptId = this.question().attemptId;
    if ('question' in changes && previousAttemptId !== currentAttemptId) {
      this.machine.set({
        state: 'Challenge',
        question: this.question(),
        startedAt: Date.now(),
        markedForReview: this.question().markedForReview,
      });
      this.confirmingSubmit.set(false);
      this.validationMessage.set('');
      this.selectedChoiceIds.set([]);
      this.numericAnswer.set(null);
      this.shortAnswer.set('');
      this.memoryReviewed.set(false);
      this.acknowledgingMemory.set(false);
      this.announcement.set('');
    }
  }
  choose(id: string) {
    this.validationMessage.set('');
    this.machine.update((m) => (m ? selectAnswer(m, id) : m));
  }
  toggleChoice(id: string, checked: boolean) {
    this.validationMessage.set('');
    this.selectedChoiceIds.update((ids) => (checked ? [...ids, id] : ids.filter((choiceId) => choiceId !== id)));
  }
  setMarked(marked: boolean) {
    this.machine.update((m) => (m ? markForReview(m, marked) : m));
  }
  openSubmitDialog() {
    if (this.validate()) this.confirmingSubmit.set(true);
  }
  submitRequested() {
    const m = this.machine();
    if (!m || !this.validate()) return;
    const submittedAtUtc = new Date().toISOString();
    this.confirmingSubmit.set(false);
    this.machine.set(beginSubmit({ ...m, selectedChoiceId: this.primaryAnswerValue(m.question) }, submittedAtUtc));
    this.submitAnswer.emit({
      choiceId: this.primaryAnswerValue(m.question),
      choiceIds: this.selectedChoiceIds(),
      numericAnswer: this.numericAnswer(),
      shortAnswer: this.shortAnswer().trim(),
      elapsedMs: elapsedMs(m),
      markedForReview: m.markedForReview,
      submittedAtUtc,
    });
  }
  applyResult(r: QuestionSubmitResult) {
    const m = this.machine();
    if (m) {
      this.machine.set(showCorrectAnswer(m, r));
      this.announcement.set(
        r.correct
          ? 'Your answer was correct.'
          : `Your answer was incorrect. The correct answer is option ${r.correctChoiceId}.`,
      );
    }
  }
  toMemory() {
    const m = this.machine();
    if (m) this.machine.set(showMemoryPearl(m));
  }
  ack() {
    const m = this.machine();
    if (m && this.memoryReviewed()) {
      this.acknowledgingMemory.set(true);
      this.acknowledgeMemory.emit({ attemptId: m.question.attemptId });
    }
  }
  completeAcknowledgement() {
    const m = this.machine();
    this.acknowledgingMemory.set(false);
    if (m) this.machine.set(completeQuestion(m));
  }
  failAcknowledgement() {
    this.acknowledgingMemory.set(false);
  }
  validate() {
    const q = this.question();
    if (this.isMultipleSelect(q)) {
      const count = this.selectedChoiceIds().length;
      const min = q.minSelections ?? 1;
      const max = q.maxSelections;
      if (count < min) return this.invalid(`Select at least ${min} answer${min === 1 ? '' : 's'}.`);
      if (max && count > max) return this.invalid(`Select no more than ${max} answers.`);
    } else if (this.isNumeric(q)) {
      const value = Number(this.numericAnswer());
      if (this.numericAnswer() === null || this.numericAnswer() === '' || Number.isNaN(value))
        return this.invalid('Numeric value must be valid.');
    } else if (this.isShortResponse(q)) {
      if (!this.shortAnswer().trim()) return this.invalid('Enter a response before submitting.');
    } else if (!this.machine()?.selectedChoiceId) return this.invalid('At least one answer must be selected.');
    this.validationMessage.set('');
    return true;
  }
  invalid(message: string) {
    this.validationMessage.set(message);
    return false;
  }
  isMultipleSelect(q: W1QuestionDto) {
    return q.answerType === 'multiple_select';
  }
  isNumeric(q: W1QuestionDto) {
    return q.answerType === 'numeric';
  }
  isShortResponse(q: W1QuestionDto) {
    return q.answerType === 'short_response';
  }
  primaryAnswerValue(q: W1QuestionDto) {
    return this.isMultipleSelect(q)
      ? this.selectedChoiceIds()[0]
      : this.isNumeric(q)
        ? String(this.numericAnswer())
        : this.isShortResponse(q)
          ? this.shortAnswer().trim()
          : (this.machine()?.selectedChoiceId ?? '');
  }
  selectionRequirementLabel(q: W1QuestionDto) {
    return q.minSelections && q.maxSelections
      ? `${q.minSelections} to ${q.maxSelections} answers`
      : q.minSelections
        ? `at least ${q.minSelections} answers`
        : q.maxSelections
          ? `up to ${q.maxSelections} answers`
          : 'all that apply';
  }
  incorrectRationaleEntries(result: QuestionSubmitResult) {
    return Object.entries(result.incorrectRationales ?? {});
  }
  optionLabel(q: W1QuestionDto, id: string) {
    const choice = q.choices.find((c) => c.id === id || c.label === id);
    return choice ? `Option ${choice.label}` : `Option ${id}`;
  }
  selectedAnswerLabel(m: QuestionMachine) {
    return (
      m.result?.selectedChoiceIds?.map((id) => this.optionLabel(m.question, id)).join(', ') ||
      this.optionLabel(m.question, m.result?.selectedChoiceId ?? '')
    );
  }
  correctAnswerLabel(m: QuestionMachine) {
    return (
      m.result?.correctChoiceIds?.map((id) => this.optionLabel(m.question, id)).join(', ') ||
      this.optionLabel(m.question, m.result?.correctChoiceId ?? '')
    );
  }
}
