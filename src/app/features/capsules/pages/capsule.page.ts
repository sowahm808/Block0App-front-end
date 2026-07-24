import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule,
    PageHeaderComponent,
    ErrorStateComponent,
    LoadingSkeletonComponent,
    ThreeWhisperComponent,
  ],
  template: `<section class="grid gap-5" aria-labelledby="capsule-title">
    @if (vm$ | async; as vm) {
      @if (vm.loading) {
        <b0-loading-skeleton [rows]="6" label="Loading capsule" />
      } @else if (vm.error) {
        <b0-page-header
          titleId="capsule-title"
          title="Learning capsule"
          description="We could not resume this capsule attempt yet."
          eyebrow="Daily study session"
        />
        <b0-error-state title="Capsule unavailable" message="We could not resume this capsule attempt yet." />
      } @else if (vm.data; as capsule) {
        <header
          class="rounded-3xl border border-[var(--b0-border)] bg-white p-4 shadow-sm sm:p-6"
          aria-labelledby="capsule-title"
        >
          <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <p class="m-0 text-sm font-bold uppercase tracking-[0.2em] text-[var(--b0-primary)]">Capsule study</p>
              <h1 id="capsule-title" class="m-0 mt-2 text-2xl font-black text-[var(--b0-text)] sm:text-3xl">
                {{ capsule.learningPackTitle || 'Learning pack' }}
              </h1>
              <p class="m-0 mt-1 text-base font-semibold text-[var(--b0-text-muted)]">
                Capsule {{ capsuleNumber(capsule) }}: {{ capsule.title || 'Study capsule' }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center gap-2 rounded-full bg-[var(--b0-surface)] px-3 py-2 text-sm font-bold"
              >
                <mat-icon aria-hidden="true">quiz</mat-icon>
                {{ currentQuestionNumber(capsule) }} of {{ capsule.questionCount || 4 }}
              </span>
              <span
                class="inline-flex items-center gap-2 rounded-full bg-[var(--b0-surface)] px-3 py-2 text-sm font-bold"
              >
                <mat-icon aria-hidden="true">timer</mat-icon>
                {{ timerLabel(capsule) }}
              </span>
              <span [class]="reviewIndicatorClass(capsule)">
                <mat-icon aria-hidden="true">flag</mat-icon>
                {{ isMarkedForReview(capsule) ? 'Marked for review' : 'Not marked' }}
              </span>
              <a mat-stroked-button routerLink="/dashboard" aria-label="Exit capsule study session">Exit</a>
            </div>
          </div>
          <mat-progress-bar class="mt-5" [value]="progress(capsule)" aria-label="Capsule progress" />
          <p class="m-0 mt-2 text-sm text-[var(--b0-text-muted)]">
            Question progress: {{ currentQuestionNumber(capsule) }} of {{ capsule.questionCount || 4 }} ·
            {{ capsule.completedQuestions }} completed
          </p>
        </header>

        <main class="grid gap-4" aria-label="Capsule study workflow">
          <div class="grid gap-3 rounded-3xl border border-[var(--b0-border)] bg-white p-4 sm:grid-cols-3 sm:p-5">
            @for (step of whisperSteps(); track step.label) {
              <div class="rounded-2xl border border-[var(--b0-border)] p-3">
                <p class="m-0 text-sm font-black text-[var(--b0-primary)]">{{ step.label }}</p>
                <p class="m-0 mt-1 font-bold">{{ step.title }}</p>
                <p class="m-0 mt-1 text-sm text-[var(--b0-text-muted)]">{{ step.description }}</p>
              </div>
            }
          </div>

          @if (capsule.complete) {
            <mat-card class="grid gap-5 p-4 sm:p-6" aria-labelledby="capsule-complete-title">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p class="m-0 text-sm font-bold uppercase tracking-[0.2em] text-[var(--b0-primary)]">Completion summary</p>
                  <h2 id="capsule-complete-title" class="m-0 mt-1 text-2xl font-black">Capsule completed</h2>
                  <p class="m-0 mt-2 text-[var(--b0-text-muted)]">Progress has been updated automatically.</p>
                </div>
                @if (earnedRaffleEntry(capsule)) {
                  <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950" role="status">
                    <p class="m-0 text-sm font-black uppercase tracking-[0.16em]">Reward notification</p>
                    <p class="m-0 mt-1 font-bold">{{ rewardMessage(capsule) }}</p>
                  </div>
                }
              </div>

              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                @for (item of completionSummary(capsule); track item.label) {
                  <div class="rounded-2xl border border-[var(--b0-border)] bg-[var(--b0-surface)] p-4">
                    <p class="m-0 text-sm text-[var(--b0-text-muted)]">{{ item.label }}</p>
                    <p class="m-0 mt-1 text-2xl font-black">{{ item.value }}</p>
                  </div>
                }
              </div>

              <div class="grid gap-3 rounded-2xl border border-[var(--b0-border)] p-4 sm:grid-cols-2">
                <div>
                  <p class="m-0 text-sm font-bold text-[var(--b0-text-muted)]">Pack progress</p>
                  <p class="m-0 mt-1 text-xl font-black">{{ packProgressLabel(capsule) }}</p>
                  <mat-progress-bar class="mt-3" [value]="packProgressValue(capsule)" aria-label="Pack progress" />
                </div>
                <div>
                  <p class="m-0 text-sm font-bold text-[var(--b0-text-muted)]">Daily goal progress</p>
                  <p class="m-0 mt-1 text-xl font-black">{{ dailyGoalProgressLabel(capsule) }}</p>
                  <mat-progress-bar class="mt-3" [value]="dailyGoalProgressValue(capsule)" aria-label="Daily goal progress" />
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <button mat-raised-button color="primary" type="button" (click)="loadNextCapsule()" [disabled]="busy() || !capsule.nextCapsuleUrl">
                  {{ busy() ? 'Starting…' : 'Start Next Capsule' }}
                </button>
                <a mat-stroked-button [routerLink]="learningPackLink(capsule)">Return to Learning Pack</a>
                <a mat-stroked-button [routerLink]="endSessionLink(capsule)">End Study Session</a>
                <a mat-stroked-button [routerLink]="todayProgressLink(capsule)">View Today’s Progress</a>
              </div>
            </mat-card>
          } @else if (capsule.nextQuestion) {
            <b0-three-whisper
              #whisper
              [question]="capsule.nextQuestion"
              (submitAnswer)="submit(capsule, $event, whisper)"
              (acknowledgeMemory)="acknowledgeMemory($event.attemptId, whisper)"
            />
          }
        </main>
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
    switchMap(([id]) =>
      this.#capsules
        .resume(id)
        .pipe(map((data) => ({ id, data: sanitizeCapsuleResume(data), loading: false, error: null }))),
    ),
    catchError((error) => of({ id: '', data: null, loading: false, error })),
    startWith({ id: '', data: null, loading: true, error: null }),
  );

  whisperSteps() {
    return [
      {
        label: 'W1',
        title: 'Challenge',
        description: 'Read the stem, choose one answer, and decide whether to mark it for review.',
      },
      {
        label: 'W2',
        title: 'Correct answer',
        description: 'Compare your response with the answer and rationales after submission.',
      },
      {
        label: 'W3',
        title: 'Remember this',
        description: 'Lock in the memory pearl before moving to the next question.',
      },
    ];
  }

  capsuleNumber(capsule: CapsuleResumeDto) {
    return capsule.capsuleNumber ?? capsule.sequence ?? '—';
  }

  currentQuestionNumber(capsule: CapsuleResumeDto) {
    return capsule.nextQuestion?.questionNumber ?? Math.min(capsule.completedQuestions + 1, capsule.questionCount || 4);
  }

  isMarkedForReview(capsule: CapsuleResumeDto) {
    return Boolean(capsule.nextQuestion?.markedForReview);
  }

  reviewIndicatorClass(capsule: CapsuleResumeDto) {
    const base = 'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold';
    return this.isMarkedForReview(capsule) ? `${base} bg-amber-100 text-amber-900` : `${base} bg-[var(--b0-surface)]`;
  }

  timerLabel(capsule: CapsuleResumeDto) {
    const seconds = capsule.remainingSeconds ?? capsule.timerRemainingSeconds ?? capsule.timeRemainingSeconds;
    if (typeof seconds === 'number') return this.formatSeconds(seconds);
    const elapsed = capsule.elapsedSeconds ?? capsule.timerElapsedSeconds;
    if (typeof elapsed === 'number') return `${this.formatSeconds(elapsed)} elapsed`;
    return 'Timer ready';
  }

  formatSeconds(totalSeconds: number) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

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

  acknowledgeMemory(questionAttemptId: string, whisper: ThreeWhisperComponent) {
    this.busy.set(true);
    this.#capsules.acknowledgeMemory(questionAttemptId).subscribe({
      next: () => {
        this.busy.set(false);
        whisper.completeAcknowledgement();
        this.loadNextQuestion();
      },
      error: () => {
        this.busy.set(false);
        whisper.failAcknowledgement();
        this.#toast.error('Could not acknowledge the memory pearl.');
      },
    });
  }

  completionSummary(capsule: CapsuleResumeDto) {
    return [
      { label: 'Questions answered', value: `${capsule.completedQuestions ?? 0}/${capsule.questionCount || 4}` },
      { label: 'Correct answers', value: this.correctAnswersLabel(capsule) },
      { label: 'Completion time', value: this.completionTimeLabel(capsule) },
      { label: 'Marked for review', value: `${capsule.markedForReviewCount ?? 0}` },
      { label: 'Capsule completed', value: capsule.completedAtUtc ? new Date(capsule.completedAtUtc).toLocaleDateString() : 'Done' },
    ];
  }

  correctAnswersLabel(capsule: CapsuleResumeDto) {
    return typeof capsule.correctAnswers === 'number' ? `${capsule.correctAnswers}/${capsule.questionCount || capsule.completedQuestions}` : 'Pending';
  }

  completionTimeLabel(capsule: CapsuleResumeDto) {
    const seconds = capsule.completionTimeSeconds ?? capsule.elapsedSeconds ?? capsule.timerElapsedSeconds;
    return typeof seconds === 'number' ? this.formatSeconds(seconds) : 'Not tracked';
  }

  packProgressValue(capsule: CapsuleResumeDto) {
    const progress = capsule.packProgress;
    if (!progress) return this.progress(capsule);
    return typeof progress.progressPercentage === 'number'
      ? Math.max(0, Math.min(100, progress.progressPercentage))
      : progress.totalCapsules
        ? (progress.completedCapsules / progress.totalCapsules) * 100
        : 0;
  }

  packProgressLabel(capsule: CapsuleResumeDto) {
    const progress = capsule.packProgress;
    return progress ? `${progress.completedCapsules} of ${progress.totalCapsules} capsules` : `${Math.round(this.progress(capsule))}% complete`;
  }

  dailyGoalProgressValue(capsule: CapsuleResumeDto) {
    const progress = capsule.dailyGoalProgress;
    if (!progress) return capsule.dailyTarget ? (capsule.completedQuestions / capsule.dailyTarget) * 100 : 0;
    return typeof progress.progressPercentage === 'number'
      ? Math.max(0, Math.min(100, progress.progressPercentage))
      : progress.targetCapsules
        ? (progress.completedCapsules / progress.targetCapsules) * 100
        : 0;
  }

  dailyGoalProgressLabel(capsule: CapsuleResumeDto) {
    const progress = capsule.dailyGoalProgress;
    return progress ? `${progress.completedCapsules} of ${progress.targetCapsules} capsules` : 'Daily target updated';
  }

  earnedRaffleEntry(capsule: CapsuleResumeDto) {
    return Boolean(capsule.reward?.earnedRaffleEntry);
  }

  rewardMessage(capsule: CapsuleResumeDto) {
    return capsule.reward?.message || 'You earned a raffle entry for completing today’s capsule target.';
  }

  learningPackLink(capsule: CapsuleResumeDto) {
    return capsule.learningPackUrl ?? (capsule.learningPackId ? `/learning-packs/${capsule.learningPackId}` : '/learning-packs');
  }

  todayProgressLink(capsule: CapsuleResumeDto) {
    return capsule.todayProgressUrl ?? '/dashboard';
  }

  endSessionLink(capsule: CapsuleResumeDto) {
    return capsule.endSessionUrl ?? '/dashboard';
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
