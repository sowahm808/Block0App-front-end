import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { QuestionSubmitResult, W1QuestionDto } from '../../../core/api/api.types';
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
  imports: [MatButtonModule, MatCheckboxModule, MatRadioModule],
  template: `@if (machine(); as m) {
    <article class="mx-auto max-w-3xl rounded bg-white p-4 shadow" aria-live="polite">
      <p>Question {{ m.question.questionNumber }} • {{ m.question.capsuleProgress }}</p>
      <h1 class="text-2xl font-semibold">{{ m.question.stem }}</h1>
      @if (m.question.figureUrl) {
        <img class="my-4 rounded border" [src]="m.question.figureUrl" alt="Question figure" />
      }
      @if (m.question.tableHtml) {
        <div class="my-4 overflow-auto rounded border p-3" [innerHTML]="m.question.tableHtml"></div>
      }
      @if (m.question.supportingMediaUrl) {
        <a
          class="my-3 block font-bold text-[var(--b0-primary)]"
          [href]="m.question.supportingMediaUrl"
          target="_blank"
          rel="noopener"
          >Open supporting media</a
        >
      }
      @if (m.state === 'Challenge' || m.state === 'Submitting') {
        <mat-radio-group [value]="m.selectedChoiceId" (change)="choose($event.value)">
          @for (c of m.question.choices; track c.id) {
            <mat-radio-button class="block py-2" [value]="c.id"
              ><strong>{{ c.label }}.</strong> {{ c.text }}</mat-radio-button
            >
          }</mat-radio-group
        ><mat-checkbox class="my-3 block" [checked]="m.markedForReview" (change)="setMarked($event.checked)"
          >Mark for review</mat-checkbox
        ><button
          mat-raised-button
          color="primary"
          [disabled]="!m.selectedChoiceId || m.state === 'Submitting'"
          (click)="submitRequested()"
        >
          Submit final answer
        </button>
      }
      @if (m.state === 'CorrectAnswer' && m.result) {
        <h2>W2 — Correct Answer</h2>
        <p>Your answer: {{ m.result.selectedChoiceId }}</p>
        <p>Correct answer: {{ m.result.correctChoiceId }}</p>
        <p>{{ m.result.correctRationale }}</p>
        <h3>Why the other choices are incorrect</h3>
        <ul>
          @for (item of incorrectRationaleEntries(m.result); track item[0]) {
            <li>
              <strong>{{ item[0] }}:</strong> {{ item[1] }}
            </li>
          }
        </ul>
        @if (m.result.reference) {
          <p><strong>Reference:</strong> {{ m.result.reference }}</p>
        }
        <button mat-raised-button (click)="toMemory()">Continue to W3</button>
      }
      @if (m.state === 'MemoryPearl' && m.result) {
        <h2>W3 — Remember This</h2>
        <p>{{ m.result.memory.highYieldFact }}</p>
        <p>{{ m.result.memory.pearl }}</p>
        <p>{{ m.result.memory.clinicalRelevance }}</p>
        <p>{{ m.result.memory.examTrap }}</p>
        @if (m.result.memory.mnemonic) {
          <p><strong>Mnemonic:</strong> {{ m.result.memory.mnemonic }}</p>
        }
        <button mat-raised-button color="primary" (click)="ack()">Acknowledge and continue</button>
      }
    </article>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreeWhisperComponent {
  question = input.required<W1QuestionDto>();
  submitAnswer = output<{ choiceId: string; elapsedMs: number; markedForReview: boolean; submittedAtUtc: string }>();
  completed = output<void>();
  machine = signal<QuestionMachine | undefined>(undefined);
  ngOnInit() {
    this.machine.set({ state: 'Challenge', question: this.question(), startedAt: Date.now(), markedForReview: false });
  }
  choose(id: string) {
    this.machine.update((m) => (m ? selectAnswer(m, id) : m));
  }
  setMarked(marked: boolean) {
    this.machine.update((m) => (m ? markForReview(m, marked) : m));
  }
  submitRequested() {
    const m = this.machine();
    if (!m || !confirm('Submit this answer? You cannot change it later.')) return;
    const submittedAtUtc = new Date().toISOString();
    this.machine.set(beginSubmit(m, submittedAtUtc));
    this.submitAnswer.emit({
      choiceId: m.selectedChoiceId!,
      elapsedMs: elapsedMs(m),
      markedForReview: m.markedForReview,
      submittedAtUtc,
    });
  }
  applyResult(r: QuestionSubmitResult) {
    const m = this.machine();
    if (m) this.machine.set(showCorrectAnswer(m, r));
  }
  toMemory() {
    const m = this.machine();
    if (m) this.machine.set(showMemoryPearl(m));
  }
  ack() {
    const m = this.machine();
    if (m) {
      this.machine.set(completeQuestion(m));
      this.completed.emit();
    }
  }
  incorrectRationaleEntries(result: QuestionSubmitResult) {
    return Object.entries(result.incorrectRationales);
  }
}
