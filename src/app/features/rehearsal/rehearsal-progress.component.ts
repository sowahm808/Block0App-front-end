import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'b0-rehearsal-progress',
  standalone: true,
  imports: [KeyValuePipe, MatProgressBarModule],
  template: `<section class="rounded-3xl border border-[var(--b0-border)] bg-white p-4 shadow-sm" aria-label="Rehearsal progress">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="m-0 text-sm font-bold text-[var(--b0-text-muted)]">Current question</p>
        <p class="m-0 text-2xl font-black">{{ currentQuestion() }} of {{ totalQuestions() }}</p>
      </div>
      <p class="m-0 text-sm font-bold text-[var(--b0-text-muted)]">Review category count</p>
    </div>
    <mat-progress-bar class="mt-3" [value]="percent()" aria-label="Question progress" />
    <div class="mt-4 flex flex-wrap gap-2">
      @for (item of reviewCategoryCounts() | keyvalue; track item.key) {
        <span class="rounded-full bg-[var(--b0-surface)] px-3 py-2 text-sm font-bold">{{ categoryLabel(item.key) }}: {{ item.value }}</span>
      }
    </div>
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RehearsalProgressComponent {
  currentQuestion = input(1);
  totalQuestions = input(1);
  reviewCategoryCounts = input<Record<string, number>>({});

  percent() {
    return this.totalQuestions() ? (this.currentQuestion() / this.totalQuestions()) * 100 : 0;
  }

  categoryLabel(key: string) {
    return key.replace(/[_-]/g, ' ');
  }
}
