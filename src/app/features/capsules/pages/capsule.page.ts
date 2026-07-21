import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BehaviorSubject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../../shared/ui/loading-skeleton/loading-skeleton.component';
import { ToastService } from '../../../core/feedback/toast.service';
import { CapsuleResumeDto, QuestionSubmitRequest } from '../../../core/api/api.types';
import { ThreeWhisperComponent } from '../../questions/components/three-whisper.component';
import { CapsuleService } from '../capsule.service';

export function sanitizeCapsuleResume(capsule: CapsuleResumeDto): CapsuleResumeDto {
  if (!capsule.nextQuestion) return capsule;
  const {
    correctChoiceId: _correctChoiceId,
    correctRationale: _correctRationale,
    incorrectRationales: _incorrectRationales,
    explanation: _explanation,
    ...question
  } = capsule.nextQuestion as CapsuleResumeDto['nextQuestion'] & Record<string, unknown>;
  return { ...capsule, nextQuestion: question as CapsuleResumeDto['nextQuestion'] };
}

@Component({
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    PageHeaderComponent,
    ErrorStateComponent,
    LoadingSkeletonComponent,
    ThreeWhisperComponent,
  ],
  template: `<section class="grid gap-5" aria-labelledby="capsule-title">
    @if (vm$ | async; as vm) {
      <b0-page-header
        titleId="capsule-title"
        [title]="vm.data?.title || 'Learning capsule'"
        [description]="vm.data?.learningPackTitle || 'Complete all four questions through W1, W2, and W3.'"
        eyebrow="Daily study session"
      />
      @if (vm.loading) {
        <b0-loading-skeleton [rows]="6" label="Loading capsule" />
      } @else if (vm.error) {
        <b0-error-state title="Capsule unavailable" message="We could not resume this capsule attempt yet." />
      } @else if (vm.data; as capsule) {
        <mat-card class="p-4 sm:p-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="m-0 text-sm font-bold text-[var(--b0-text-muted)]">
                {{ capsule.completedQuestions }} / {{ capsule.questionCount }} questions complete
              </p>
              <h2 class="m-0 text-xl font-black">Four-question capsule workflow</h2>
            </div>
            <a mat-stroked-button routerLink="/dashboard">End session</a>
          </div>
          <mat-progress-bar class="mt-4" [value]="progress(capsule)" aria-label="Capsule progress" />
        </mat-card>
        @if (capsule.complete) {
          <mat-card class="grid gap-3 p-4 sm:p-6">
            <h2 class="m-0 text-2xl font-black">Capsule complete</h2>
            <p class="m-0 text-[var(--b0-text-muted)]">Progress has been updated automatically.</p>
            <button mat-raised-button color="primary" type="button" (click)="loadNextCapsule()" [disabled]="busy()">
              {{ busy() ? 'Requesting…' : 'Request next capsule' }}
            </button>
          </mat-card>
        } @else if (capsule.nextQuestion) {
          <b0-three-whisper
            #whisper
            [question]="capsule.nextQuestion"
            (submitAnswer)="submit(capsule, $event, whisper)"
            (completed)="loadNextQuestion()"
          />
        }
      }
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapsulePage {
  @ViewChild('whisper') whisper?: ThreeWhisperComponent;
  #route = inject(ActivatedRoute);
  #capsules = inject(CapsuleService);
  #toast = inject(ToastService);
  busy = signal(false);
  #refresh$ = new BehaviorSubject<void>(undefined);

  vm$ = combineLatest([
    this.#route.paramMap.pipe(map((params) => params.get('capsuleAttemptId') ?? params.get('id') ?? '')),
    this.#refresh$,
  ]).pipe(
    switchMap(([id]) => this.#capsules.resume(id).pipe(map((data) => ({ id, data: sanitizeCapsuleResume(data), loading: false, error: null })))),
    catchError((error) => of({ id: '', data: null, loading: false, error })),
    startWith({ id: '', data: null, loading: true, error: null }),
  );

  progress(capsule: CapsuleResumeDto) {
    return capsule.questionCount ? (capsule.completedQuestions / capsule.questionCount) * 100 : 0;
  }

  submit(capsule: CapsuleResumeDto, body: QuestionSubmitRequest, whisper: ThreeWhisperComponent) {
    if (!capsule.nextQuestion) return;
    this.busy.set(true);
    this.#capsules.submitQuestion(capsule.capsuleAttemptId, capsule.nextQuestion.attemptId, body).subscribe({
      next: (result) => {
        this.busy.set(false);
        whisper.applyResult(result);
      },
      error: () => {
        this.busy.set(false);
        this.#toast.error('Could not submit answer.');
      },
    });
  }

  loadNextQuestion() {
    const id = this.#route.snapshot.paramMap.get('capsuleAttemptId') ?? this.#route.snapshot.paramMap.get('id') ?? '';
    this.busy.set(true);
    this.#capsules.next(id).subscribe({
      next: () => {
        this.busy.set(false);
        this.#refresh$.next();
      },
      error: () => {
        this.busy.set(false);
        this.#toast.error('Could not load the next question.');
      },
    });
  }

  loadNextCapsule() {
    this.loadNextQuestion();
  }
}
