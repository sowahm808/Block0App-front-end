import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { ThreeWhisperComponent } from '../questions/components/three-whisper.component';
import { QuestionSubmitRequest } from '../../core/api/api.types';
import { ToastService } from '../../core/feedback/toast.service';
import { RehearsalProgressComponent } from './rehearsal-progress.component';
import { RehearsalReasonBadgeComponent } from './rehearsal-reason-badge.component';
import { RehearsalService } from './rehearsal.service';
import { RehearsalAttemptDto } from './rehearsal.models';

@Component({
  selector: 'b0-rehearsal-session',
  standalone: true,
  imports: [AsyncPipe, RouterLink, MatButtonModule, PageHeaderComponent, LoadingSkeletonComponent, ErrorStateComponent, ThreeWhisperComponent, RehearsalProgressComponent, RehearsalReasonBadgeComponent],
  template: `<section class="grid gap-5" aria-labelledby="rehearsal-session-title">
    @if (vm$ | async; as vm) {
      @if (vm.loading) { <b0-loading-skeleton [rows]="6" label="Loading rehearsal question" /> }
      @else if (vm.error) { <b0-error-state title="Rehearsal session unavailable" message="We could not resume this rehearsal session." /> }
      @else if (vm.data; as attempt) {
        <b0-page-header titleId="rehearsal-session-title" title="Rehearsal Session" [description]="attempt.title" eyebrow="W1 · W2 · W3 review" />
        <b0-rehearsal-progress [currentQuestion]="attempt.currentQuestion" [totalQuestions]="attempt.totalQuestions" [reviewCategoryCounts]="attempt.reviewCategoryCounts" />
        @if (attempt.nextQuestion; as question) {
          <div class="rounded-3xl border border-[var(--b0-border)] bg-white p-4 shadow-sm">
            <p class="m-0 mb-2 text-sm font-black uppercase tracking-[0.16em] text-[var(--b0-text-muted)]">Why this question was selected</p>
            <div class="flex flex-wrap gap-2">
              @for (reason of reasons(attempt); track reason) { <b0-rehearsal-reason-badge [reason]="reason" /> }
            </div>
          </div>
          <b0-three-whisper #whisper [question]="question" (submitAnswer)="submit(attempt, $event, whisper)" (acknowledgeMemory)="acknowledgeMemory($event.attemptId, whisper)" />
        } @else {
          <div class="rounded-3xl border border-[var(--b0-border)] bg-white p-5 shadow-sm">
            <h2 class="m-0 text-2xl font-black">Session completed</h2>
            <p class="text-[var(--b0-text-muted)]">All rehearsal questions have been reviewed.</p>
            <a mat-raised-button color="primary" [routerLink]="['/rehearsal', attempt.attemptId, 'summary']">View Summary</a>
          </div>
        }
      }
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RehearsalSessionPage {
  @ViewChild('whisper') whisper?: ThreeWhisperComponent;
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #service = inject(RehearsalService);
  #toast = inject(ToastService);
  busy = signal(false);
  #refresh$ = new BehaviorSubject<void>(undefined);

  vm$ = combineLatest([this.#route.paramMap.pipe(map((params) => params.get('attemptId') ?? '')), this.#refresh$]).pipe(
    switchMap(([id]) => this.#service.resume(id).pipe(map((data) => ({ id, data, loading: false, error: null })))),
    catchError((error) => of({ id: '', data: null, loading: false, error })),
    startWith({ id: '', data: null, loading: true, error: null }),
  );

  reasons(attempt: RehearsalAttemptDto) {
    return attempt.nextQuestion?.selectionReasons?.length
      ? attempt.nextQuestion.selectionReasons
      : [attempt.nextQuestion?.reviewCategory ?? 'weak_topic'];
  }

  submit(attempt: RehearsalAttemptDto, body: QuestionSubmitRequest, whisper: ThreeWhisperComponent) {
    if (!attempt.nextQuestion) return;
    this.busy.set(true);
    this.#service.submitQuestion(attempt.attemptId, attempt.nextQuestion.attemptId, body).subscribe({
      next: (result) => { this.busy.set(false); whisper.applyResult(result); },
      error: () => { this.busy.set(false); this.#toast.error('Could not submit rehearsal answer.'); },
    });
  }

  acknowledgeMemory(questionAttemptId: string, whisper: ThreeWhisperComponent) {
    const attemptId = this.#route.snapshot.paramMap.get('attemptId') ?? '';
    this.busy.set(true);
    this.#service.acknowledgeMemory(attemptId, questionAttemptId).subscribe({
      next: () => {
        whisper.completeAcknowledgement();
        this.#service.next(attemptId).subscribe({ next: () => { this.busy.set(false); this.#refresh$.next(); }, error: () => this.#router.navigate(['/rehearsal', attemptId, 'summary']) });
      },
      error: () => { this.busy.set(false); whisper.failAcknowledgement(); this.#toast.error('Could not acknowledge the memory pearl.'); },
    });
  }
}
