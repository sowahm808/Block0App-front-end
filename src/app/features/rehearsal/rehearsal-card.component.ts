import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { RehearsalSessionCard } from './rehearsal.models';
import { RehearsalReasonBadgeComponent } from './rehearsal-reason-badge.component';

@Component({
  selector: 'b0-rehearsal-card',
  standalone: true,
  imports: [RouterLink, MatButtonModule, RehearsalReasonBadgeComponent],
  template: `<article class="grid gap-4 rounded-3xl border border-[var(--b0-border)] bg-white p-5 shadow-sm">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="m-0 text-xl font-black">{{ session().title }}</h2>
        <p class="m-0 mt-1 text-sm font-bold text-[var(--b0-text-muted)]">
          {{ session().questionCount }} questions · {{ session().estimatedMinutes }} min estimated duration
        </p>
      </div>
      <span class="rounded-full bg-[var(--b0-surface)] px-3 py-2 text-sm font-black">{{ statusLabel() }}</span>
    </div>
    <div>
      <p class="m-0 mb-2 text-sm font-black uppercase tracking-[0.16em] text-[var(--b0-text-muted)]">Selection reasons</p>
      <div class="flex flex-wrap gap-2">
        @for (reason of session().selectionReasons; track reason) { <b0-rehearsal-reason-badge [reason]="reason" /> }
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      @if (session().status === 'completed') {
        <a mat-raised-button color="primary" [routerLink]="['/rehearsal', attemptId(), 'summary']">View Completed Session</a>
      } @else if (session().status === 'in_progress') {
        <a mat-raised-button color="primary" [routerLink]="['/rehearsal', attemptId()]">Resume Rehearsal</a>
      } @else {
        <button mat-raised-button color="primary" type="button" (click)="start.emit(session().id)">Start Rehearsal</button>
      }
    </div>
  </article>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RehearsalCardComponent {
  session = input.required<RehearsalSessionCard>();
  start = output<string>();

  attemptId() {
    return this.session().attemptId ?? this.session().id;
  }

  statusLabel() {
    return this.session().status.replace(/[_-]/g, ' ');
  }
}
