import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { BehaviorSubject, Observable, catchError, map, of, startWith, switchMap } from 'rxjs';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { RehearsalCardComponent } from './rehearsal-card.component';
import { RehearsalService } from './rehearsal.service';
import { RehearsalOverviewDto } from './rehearsal.models';

interface ApiState<T> { status: 'loading' | 'loaded' | 'empty' | 'error'; data?: T; message?: string }

@Component({
  selector: 'b0-rehearsal-overview',
  standalone: true,
  imports: [AsyncPipe, MatCardModule, PageHeaderComponent, LoadingSkeletonComponent, EmptyStateComponent, ErrorStateComponent, RehearsalCardComponent],
  template: `<section class="grid gap-5" aria-labelledby="rehearsal-title">
    <b0-page-header titleId="rehearsal-title" title="Rehearsal and Review" description="Target missed questions, marked items, weak topics, and due memory pearls before readiness review." />
    @if (state$ | async; as state) {
      @if (state.status === 'loading') { <b0-loading-skeleton [rows]="6" label="Loading rehearsal sessions" /> }
      @else if (state.status === 'error') { <b0-error-state title="Rehearsal unavailable" [message]="state.message || 'Unable to load rehearsal sessions.'" (retry)="reload()" /> }
      @else if (state.status === 'empty') { <b0-empty-state title="No rehearsal sessions available" message="You have no missed, marked, weak-topic, or memory-pearl review items due right now." /> }
      @else if (state.data; as data) {
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Rehearsal summary cards">
          @for (card of summaryCards(data); track card.label) {
            <mat-card class="p-4"><p class="m-0 text-sm font-bold text-[var(--b0-text-muted)]">{{ card.label }}</p><p class="m-0 mt-2 text-3xl font-black">{{ card.value }}</p></mat-card>
          }
        </div>
        <section class="grid gap-4" aria-labelledby="available-rehearsals-title">
          <h2 id="available-rehearsals-title" class="m-0 text-2xl font-black">Available rehearsal sessions</h2>
          @for (session of data.sessions; track session.id) { <b0-rehearsal-card [session]="session" (start)="start($event)" /> }
        </section>
      }
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RehearsalOverviewPage {
  #service = inject(RehearsalService);
  #router = inject(Router);
  #refresh$ = new BehaviorSubject<void>(undefined);

  readonly state$: Observable<ApiState<RehearsalOverviewDto>> = this.#refresh$.pipe(
    switchMap(() => this.#service.overview().pipe(
      map((result) => ({ status: result?.sessions?.length ? 'loaded' : 'empty', data: result }) satisfies ApiState<RehearsalOverviewDto>),
      startWith({ status: 'loading' } satisfies ApiState<RehearsalOverviewDto>),
      catchError((error: unknown) => of({ status: 'error', message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.' } satisfies ApiState<RehearsalOverviewDto>)),
    )),
  );

  summaryCards(data: RehearsalOverviewDto) {
    return [
      { label: 'Missed questions', value: data.summary.missedQuestions },
      { label: 'Marked questions', value: data.summary.markedQuestions },
      { label: 'Weak topics', value: data.summary.weakTopics },
      { label: 'Memory pearls due', value: data.summary.memoryPearlsDue },
    ];
  }

  start(sessionId: string) {
    this.#service.start(sessionId).subscribe((result) => this.#router.navigateByUrl(result.resumeUrl ?? `/rehearsal/${result.attemptId}`));
  }

  reload() { this.#refresh$.next(); }
}
