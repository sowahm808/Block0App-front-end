import { AsyncPipe, DatePipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { catchError, map, of, startWith } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { TodayChallengeDto, TodayLearningPackDto } from '../../core/api/api.types';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';

interface ApiState<T> {
  status: 'loading' | 'loaded' | 'empty' | 'error';
  data?: T;
  message?: string;
}

@Component({
  selector: 'b0-today-challenge',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    PercentPipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    PageHeaderComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `<section class="today-shell" aria-labelledby="today-title">
    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="6" />
      } @else if (state.status === 'error') {
        <b0-error-state [message]="state.message || 'Unable to load today’s challenge.'" (retry)="reload()" />
      } @else if (state.status === 'empty') {
        <b0-empty-state
          title="Today’s study content has not yet been released."
          message="Your cohort schedule will appear here when the backend releases the day."
        />
      } @else if (state.data; as today) {
        <b0-page-header
          titleId="today-title"
          [title]="'Study Day ' + today.studyDay + ': ' + today.phaseTitle"
          description="Your daily plan, check-ins, assigned learning packs, and team progress."
          eyebrow="Today’s Challenge"
        >
          <a mat-raised-button color="primary" routerLink="/check-ins/morning" [class.disabled-link]="today.morningCheckInDone">
            Complete Morning Check-In
          </a>
          <a mat-stroked-button color="primary" [routerLink]="today.currentCapsuleUrl || today.continueUrl || '/learning-packs'">
            {{ today.currentCapsuleUrl ? 'Continue Current Capsule' : 'Start Today’s Study' }}
          </a>
          <a mat-button color="primary" routerLink="/challenge/program">View Full Program</a>
        </b0-page-header>

        @if (today.locked) {
          <mat-card class="locked-card">
            <p class="eyebrow">Locked day state</p>
            <h2>Today’s study content has not yet been released.</h2>
            <dl>
              <div><dt>Release date</dt><dd>{{ today.releaseAtUtc | date: 'fullDate' }}</dd></div>
              <div><dt>Release time</dt><dd>{{ today.releaseAtUtc | date: 'shortTime' }}</dd></div>
              <div><dt>Cohort time zone</dt><dd>{{ today.cohortTimeZone || 'Not provided' }}</dd></div>
            </dl>
          </mat-card>
        } @else {
          <mat-card class="announcement-card">
            <p class="eyebrow">Daily title</p>
            <h2>{{ today.dailyTitle }}</h2>
            <p class="encouragement">{{ today.encouragementMessage }}</p>
            <div class="announcement-grid">
              <div><span>Administrative announcement</span><strong>{{ today.administrativeAnnouncement }}</strong></div>
              <div><span>Team progress message</span><strong>{{ today.teamProgressMessage }}</strong></div>
            </div>
          </mat-card>

          <div class="goal-grid">
            <mat-card class="goal-card">
              <p class="eyebrow">Daily goal panel</p>
              <div class="target-row">
                <div><strong>{{ today.targetCapsules }}</strong><span>Target capsules</span></div>
                <div><strong>{{ today.targetQuestions }}</strong><span>Target questions</span></div>
                <div><strong>{{ today.targetStudyMinutes }}m</strong><span>Target study time</span></div>
              </div>
              <div class="completion-line">
                <span>Current completion percentage</span>
                <strong>{{ today.completionPercentage / 100 | percent: '1.0-0' }}</strong>
              </div>
              <div class="progress-track"><span [style.width.%]="today.completionPercentage"></span></div>
              <p class="streak">Current streak: <strong>{{ today.currentStreak }}</strong> days</p>
            </mat-card>

            <mat-card class="checkin-card">
              <p class="eyebrow">Check-in status</p>
              <div class="check-row"><span>Morning check-in</span><strong>{{ today.morningCheckInDone ? 'Complete' : 'Pending' }}</strong></div>
              <div class="check-row"><span>Evening check-in</span><strong>{{ today.eveningCheckInDone ? 'Complete' : 'Pending' }}</strong></div>
              <a mat-raised-button color="primary" routerLink="/check-ins/morning" [class.disabled-link]="today.morningCheckInDone">
                Complete Morning Check-In
              </a>
            </mat-card>
          </div>

          <section aria-labelledby="packs-title">
            <div class="section-heading">
              <div><p class="eyebrow">Assigned learning packs</p><h2 id="packs-title">Today’s study sequence</h2></div>
              <a mat-button color="primary" [routerLink]="today.continueUrl || '/learning-packs'">Start Today’s Study</a>
            </div>
            <div class="pack-grid">
              @for (pack of today.assignedLearningPacks; track pack.id || pack.packNumber) {
                <mat-card class="pack-card">
                  <div class="pack-heading">
                    <p class="eyebrow">Pack {{ pack.packNumber }}</p>
                    <span class="status-pill">{{ pack.status }}</span>
                  </div>
                  <h3>{{ pack.title }}</h3>
                  <p>{{ pack.topic }}</p>
                  <dl>
                    <div><dt>Capsule count</dt><dd>{{ pack.capsuleCount }}</dd></div>
                    <div><dt>Completed capsules</dt><dd>{{ pack.completedCapsules }}</dd></div>
                  </dl>
                  <a mat-raised-button color="primary" [routerLink]="pack.continueUrl || today.continueUrl || '/learning-packs'">
                    {{ pack.completedCapsules > 0 ? 'Continue' : 'Start' }}
                  </a>
                </mat-card>
              }
            </div>
          </section>
        }
      }
    }
  </section>`,
  styles: [`
    .today-shell, .pack-grid, .goal-grid { display: grid; gap: 1rem; }
    .announcement-card, .goal-card, .checkin-card, .locked-card, .pack-card { padding: 1.25rem; border-radius: 1.25rem; }
    .eyebrow { margin: 0 0 .35rem; text-transform: uppercase; letter-spacing: .08em; font-size: .75rem; color: #64748b; font-weight: 700; }
    h2, h3 { margin: 0 0 .5rem; }
    .encouragement { font-size: 1.05rem; }
    .announcement-grid, .target-row { display: grid; gap: .75rem; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
    .announcement-grid div, .target-row div { background: #f8fafc; border-radius: 1rem; padding: 1rem; display: grid; gap: .25rem; }
    .target-row strong { font-size: 2rem; color: #1d4ed8; }
    .completion-line, .check-row, .pack-heading, .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .progress-track { height: .75rem; border-radius: 999px; overflow: hidden; background: #e2e8f0; }
    .progress-track span { display: block; height: 100%; background: linear-gradient(90deg, #2563eb, #22c55e); }
    .streak { margin-bottom: 0; }
    .pack-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .status-pill { border-radius: 999px; background: #dbeafe; color: #1e40af; padding: .25rem .65rem; font-size: .8rem; font-weight: 700; }
    dl { display: grid; gap: .5rem; margin: 1rem 0; }
    dl div { display: flex; justify-content: space-between; gap: 1rem; }
    dt { color: #64748b; } dd { margin: 0; font-weight: 700; }
    .disabled-link { pointer-events: none; opacity: .55; }
    .locked-card { border: 1px solid #f59e0b; background: #fffbeb; }
    @media (min-width: 760px) { .goal-grid { grid-template-columns: 2fr 1fr; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayChallengePage {
  #api = inject(ApiService);
  readonly state$ = this.#api.get<TodayChallengeDto>('/challenges/current/today').pipe(
    map((result) => ({ status: result ? 'loaded' : 'empty', data: this.withDefaults(result) }) satisfies ApiState<TodayChallengeDto>),
    startWith({ status: 'loading' } satisfies ApiState<TodayChallengeDto>),
    catchError((error: unknown) =>
      of({ status: 'error', message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.' } satisfies ApiState<TodayChallengeDto>),
    ),
  );

  reload() { window.location.reload(); }

  private withDefaults(today: TodayChallengeDto): TodayChallengeDto {
    return {
      ...today,
      assignedLearningPacks: (today.assignedLearningPacks ?? []).map((pack) => this.packWithDefaults(pack)),
      completionPercentage: Math.min(Math.max(today.completionPercentage ?? 0, 0), 100),
    };
  }

  private packWithDefaults(pack: TodayLearningPackDto): TodayLearningPackDto {
    return { ...pack, status: pack.status || (pack.completedCapsules > 0 ? 'In progress' : 'Not started') };
  }
}
