import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Observable, catchError, map, of, startWith, switchMap } from 'rxjs';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { RehearsalService } from './rehearsal.service';
import { RehearsalSummaryDto } from './rehearsal.models';

interface ApiState<T> { status: 'loading' | 'loaded' | 'error'; data?: T; message?: string }

@Component({
  selector: 'b0-rehearsal-summary',
  standalone: true,
  imports: [AsyncPipe, RouterLink, MatButtonModule, MatCardModule, PageHeaderComponent, LoadingSkeletonComponent, ErrorStateComponent],
  template: `<section class="grid gap-5" aria-labelledby="rehearsal-summary-title">
    <b0-page-header titleId="rehearsal-summary-title" title="Rehearsal Summary" description="Review what improved and choose the next readiness action." />
    @if (state$ | async; as state) {
      @if (state.status === 'loading') { <b0-loading-skeleton [rows]="5" label="Loading rehearsal summary" /> }
      @else if (state.status === 'error') { <b0-error-state title="Summary unavailable" [message]="state.message || 'Unable to load rehearsal summary.'" /> }
      @else if (state.data; as summary) {
        <mat-card class="grid gap-5 p-5 sm:p-6">
          <div>
            <p class="m-0 text-sm font-black uppercase tracking-[0.18em] text-[var(--b0-primary)]">Session completed</p>
            <h2 class="m-0 mt-2 text-2xl font-black">Rehearsal complete</h2>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            @for (item of metrics(summary); track item.label) {
              <div class="rounded-2xl border border-[var(--b0-border)] bg-[var(--b0-surface)] p-4"><p class="m-0 text-sm font-bold text-[var(--b0-text-muted)]">{{ item.label }}</p><p class="m-0 mt-2 text-3xl font-black">{{ item.value }}</p></div>
            }
          </div>
          <div class="rounded-2xl border border-[var(--b0-border)] p-4">
            <h3 class="m-0 text-xl font-black">Remaining weak topics</h3>
            @if (summary.remainingWeakTopics.length) {
              <ul class="mb-0 mt-3 grid gap-2">@for (topic of summary.remainingWeakTopics; track topic) { <li>{{ topic }}</li> }</ul>
            } @else { <p class="mb-0 mt-2 text-[var(--b0-text-muted)]">No weak topics remain from this session.</p> }
          </div>
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
            <p class="m-0 text-sm font-black uppercase tracking-[0.16em]">Suggested next action</p>
            <p class="m-0 mt-1 font-bold">{{ summary.suggestedNextAction }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a mat-raised-button color="primary" routerLink="/rehearsal">Return to Rehearsal</a>
            <a mat-stroked-button routerLink="/readiness">View Readiness</a>
            <a mat-stroked-button routerLink="/dashboard">Continue Review</a>
          </div>
        </mat-card>
      }
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RehearsalSummaryPage {
  #route = inject(ActivatedRoute);
  #service = inject(RehearsalService);

  readonly state$: Observable<ApiState<RehearsalSummaryDto>> = this.#route.paramMap.pipe(
    map((params) => params.get('attemptId') ?? ''),
    switchMap((attemptId) => this.#service.summary(attemptId).pipe(
      map((result) => ({ status: 'loaded', data: result }) satisfies ApiState<RehearsalSummaryDto>),
      startWith({ status: 'loading' } satisfies ApiState<RehearsalSummaryDto>),
      catchError((error: unknown) => of({ status: 'error', message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.' } satisfies ApiState<RehearsalSummaryDto>)),
    )),
  );

  metrics(summary: RehearsalSummaryDto) {
    return [
      { label: 'Questions reviewed', value: summary.questionsReviewed },
      { label: 'Improved answers', value: summary.improvedAnswers },
      { label: 'Memory pearls reviewed', value: summary.memoryPearlsReviewed },
      { label: 'Remaining weak topics', value: summary.remainingWeakTopics.length },
    ];
  }
}
