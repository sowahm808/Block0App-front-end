import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { catchError, map, of, startWith } from 'rxjs';
import { DashboardService } from '../data-access/dashboard.service';

@Component({
  standalone: true,
  imports: [AsyncPipe, RouterLink, MatButtonModule, MatCardModule, MatProgressBarModule],
  template: `<section class="dashboard-grid" aria-labelledby="dash-title">
    @if (vm$ | async; as vm) {
      @if (vm.loading) {
        <mat-card class="dashboard-state-card" aria-live="polite">
          <div class="loading-orb" aria-hidden="true"></div>
          <div>
            <p class="eyebrow">Preparing workspace</p>
            <h1 id="dash-title" class="state-title">Loading your dashboard…</h1>
            <p class="state-copy">Gathering progress, check-ins, and challenge activity.</p>
          </div>
        </mat-card>
      } @else if (vm.error) {
        <mat-card class="dashboard-state-card">
          <div class="error-orb" aria-hidden="true">!</div>
          <div>
            <p class="eyebrow">Dashboard unavailable</p>
            <h1 id="dash-title" class="state-title">We could not load your dashboard</h1>
            <p class="state-copy">Try again later. Correlation ID will be shown when provided by the API.</p>
          </div>
        </mat-card>
      } @else if (vm.data) {
        <div class="dashboard-hero">
          <div class="hero-glow hero-glow-primary" aria-hidden="true"></div>
          <div class="hero-glow hero-glow-accent" aria-hidden="true"></div>
          <div class="hero-copy">
            <p class="hero-kicker">Scholar command center</p>
            <h1 id="dash-title">Study Day {{ vm.data.currentDay }} is ready</h1>
            <p>
              Welcome back, {{ vm.data.scholarName }}.
              {{ vm.data.encouragementMessage || 'Your study cockpit keeps today's focus, readiness signals, and team momentum in one place.' }}
            </p>
            <div class="hero-actions">
              <a mat-flat-button color="primary" [routerLink]="vm.data.continueUrl">Continue study</a>
              <a mat-button routerLink="/check-ins">Complete check-in</a>
            </div>
          </div>
          <aside class="hero-panel" aria-label="Current challenge summary">
            <p class="panel-label">Current challenge</p>
            <h2>{{ vm.data.currentChallenge }}</h2>
            <p class="panel-muted">Day {{ vm.data.currentDay }} · {{ vm.data.readinessLevel }} readiness</p>
            <div class="progress-ring" [style.--progress.%]="vm.data.overallCompletion">
              <span>{{ vm.data.overallCompletion }}%</span>
            </div>
            <p class="panel-caption">overall completion</p>
            <p class="panel-muted">Daily capsule goal: {{ vm.data.dailyCapsuleGoal || vm.data.dailyTarget }}</p>
          </aside>
        </div>

        <div class="metric-grid" aria-label="Dashboard metrics">
          <mat-card class="metric-card metric-card-primary">
            <p class="metric-label">Focus streak</p>
            <p class="metric-value">{{ vm.data.currentStreak }}</p>
            <p class="metric-copy">days of guided study momentum</p>
          </mat-card>
          <mat-card class="metric-card metric-card-success">
            <p class="metric-label">Knowledge accuracy</p>
            <p class="metric-value">{{ vm.data.knowledgeAccuracy }}%</p>
            <p class="metric-copy">across recent question sets</p>
          </mat-card>
          <mat-card class="metric-card metric-card-warning">
            <p class="metric-label">Scenario performance</p>
            <p class="metric-value">{{ vm.data.scenarioPerformance }}%</p>
            <p class="metric-copy">applied practice score</p>
          </mat-card>
          <mat-card class="metric-card metric-card-violet">
            <p class="metric-label">Raffle entries</p>
            <p class="metric-value">{{ vm.data.raffleEntries }}</p>
            <p class="metric-copy">earned from consistency</p>
          </mat-card>
        </div>

        <div class="content-grid">
          <mat-card class="mission-card">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Today's mission</p>
                <h2>Build momentum before the day closes</h2>
              </div>
              <span class="live-pill">Live plan</span>
            </div>
            <div class="daily-progress-card">
              <div>
                <p class="daily-number">{{ vm.data.capsulesCompletedToday }} / {{ vm.data.dailyTarget }}</p>
                <p class="daily-copy">capsules completed today</p>
              </div>
              <mat-progress-bar
                [value]="(vm.data.capsulesCompletedToday / vm.data.dailyTarget) * 100"
                aria-label="Daily capsule target progress"
              ></mat-progress-bar>
            </div>
            <div class="task-list" aria-label="Daily tasks">
              <div class="task-row">
                <span class="task-status task-status-done" aria-hidden="true">✓</span>
                <div>
                  <p>{{ vm.data.questionsCompletedToday }} questions completed</p>
                  <span>Question reps logged for today's practice block.</span>
                </div>
              </div>
              <div class="task-row">
                <span class="task-status" [class.task-status-done]="vm.data.morningCheckInDone" aria-hidden="true">{{
                  vm.data.morningCheckInDone ? '✓' : '•'
                }}</span>
                <div>
                  <p>Morning check-in</p>
                  <span>{{
                    vm.data.morningCheckInDone ? 'Captured and synced.' : 'Still waiting for your first reflection.'
                  }}</span>
                </div>
              </div>
              <div class="task-row">
                <span class="task-status" [class.task-status-done]="vm.data.eveningCheckInDone" aria-hidden="true">{{
                  vm.data.eveningCheckInDone ? '✓' : '•'
                }}</span>
                <div>
                  <p>Evening check-in</p>
                  <span>{{
                    vm.data.eveningCheckInDone ? 'Day closed with notes.' : 'Use it to lock in one learning takeaway.'
                  }}</span>
                </div>
              </div>
            </div>
          </mat-card>

          <div class="side-stack">
            <mat-card class="team-card">
              <p class="eyebrow">Team pulse</p>
              <h2>{{ vm.data.teamActivity }}</h2>
              <p>Stay aligned with your cohort by turning shared activity into accountable next steps.</p>
            </mat-card>

            <mat-card class="announcements-card">
              <div class="section-heading compact">
                <h2>Assigned learning packs</h2>
                <span class="live-pill">Today</span>
              </div>
              <ul>
                @for (pack of vm.data.assignedLearningPacks || []; track pack) {
                  <li>{{ pack }}</li>
                } @empty {
                  <li>Your assigned packs will appear here when the daily plan syncs.</li>
                }
              </ul>
            </mat-card>
            <mat-card class="announcements-card">
              <div class="section-heading compact">
                <h2>Announcements</h2>
                <span class="live-pill">Live</span>
              </div>
              <ul>
                @for (a of vm.data.announcements; track a) {
                  <li>{{ a }}</li>
                }
              </ul>
            </mat-card>
          </div>
        </div>
      }
    }
  </section>`,
  styles: [
    `
      .dashboard-grid {
        display: grid;
        gap: clamp(1rem, 2vw, 1.5rem);
      }
      .dashboard-hero,
      .dashboard-state-card {
        position: relative;
        overflow: hidden;
        display: grid;
        gap: 2rem;
        border: 1px solid color-mix(in srgb, var(--b0-primary) 20%, white 45%) !important;
        border-radius: 2rem !important;
        background:
          linear-gradient(135deg, rgba(10, 15, 30, 0.96), rgba(33, 48, 104, 0.9)),
          radial-gradient(circle at top right, rgba(99, 102, 241, 0.45), transparent 28rem) !important;
        color: white;
        padding: clamp(1.5rem, 4vw, 3rem);
        box-shadow: var(--b0-shadow-lg);
      }
      .dashboard-hero {
        grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.65fr);
        align-items: stretch;
      }
      .hero-glow {
        position: absolute;
        border-radius: 999px;
        filter: blur(46px);
        opacity: 0.75;
      }
      .hero-glow-primary {
        right: 12%;
        top: -4rem;
        width: 18rem;
        height: 18rem;
        background: #6366f1;
      }
      .hero-glow-accent {
        bottom: -5rem;
        left: 36%;
        width: 14rem;
        height: 14rem;
        background: #f59e0b;
      }
      .hero-copy,
      .hero-panel,
      .dashboard-state-card > * {
        position: relative;
        z-index: 1;
      }
      .hero-kicker,
      .eyebrow,
      .metric-label,
      .panel-label {
        margin: 0;
        font-size: 0.76rem;
        font-weight: 900;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }
      .hero-kicker {
        width: fit-content;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
        padding: 0.65rem 0.9rem;
        color: #dbeafe;
      }
      .hero-copy h1 {
        margin: 1rem 0;
        max-width: 52rem;
        font-size: clamp(2.65rem, 7vw, 5.85rem);
        font-weight: 950;
        letter-spacing: -0.075em;
        line-height: 0.88;
      }
      .hero-copy p:not(.hero-kicker) {
        max-width: 45rem;
        color: #cbd5e1;
        font-size: clamp(1rem, 2vw, 1.15rem);
        line-height: 1.8;
      }
      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      .hero-actions a[mat-button] {
        color: white;
      }
      .hero-panel {
        display: grid;
        justify-items: center;
        align-content: center;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 1.5rem;
        background: rgba(255, 255, 255, 0.1);
        padding: 1.5rem;
        text-align: center;
        backdrop-filter: blur(18px);
      }
      .hero-panel h2 {
        margin: 0.55rem 0;
        font-size: clamp(1.35rem, 3vw, 2rem);
        font-weight: 900;
      }
      .panel-muted,
      .panel-caption {
        color: #cbd5e1;
      }
      .progress-ring {
        --progress: 0%;
        display: grid;
        place-items: center;
        width: 10rem;
        height: 10rem;
        margin: 1.2rem 0 0.4rem;
        border-radius: 999px;
        background: conic-gradient(#fbbf24 var(--progress), rgba(255, 255, 255, 0.16) 0);
      }
      .progress-ring::before {
        content: '';
        position: absolute;
        width: 7.1rem;
        height: 7.1rem;
        border-radius: inherit;
        background: rgba(15, 23, 42, 0.9);
      }
      .progress-ring span {
        position: relative;
        font-size: 2rem;
        font-weight: 950;
      }
      .metric-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 1rem;
      }
      .metric-card {
        position: relative;
        overflow: hidden;
        padding: 1.35rem;
      }
      .metric-card::after {
        content: '';
        position: absolute;
        right: -2.5rem;
        top: -2.5rem;
        width: 7rem;
        height: 7rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--metric-color) 18%, transparent);
      }
      .metric-card-primary {
        --metric-color: var(--b0-primary);
      }
      .metric-card-success {
        --metric-color: var(--b0-success);
      }
      .metric-card-warning {
        --metric-color: var(--b0-warning);
      }
      .metric-card-violet {
        --metric-color: var(--b0-secondary);
      }
      .metric-label {
        color: var(--metric-color);
      }
      .metric-value {
        margin: 0.7rem 0 0;
        font-size: clamp(2.25rem, 4vw, 3.65rem);
        font-weight: 950;
        letter-spacing: -0.06em;
      }
      .metric-copy,
      .state-copy,
      .daily-copy,
      .task-row span,
      .team-card p:not(.eyebrow) {
        color: var(--b0-text-muted);
      }
      .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(18rem, 0.85fr);
        gap: 1rem;
      }
      .mission-card,
      .team-card,
      .announcements-card {
        padding: clamp(1.25rem, 3vw, 2rem);
      }
      .section-heading {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 1rem;
      }
      .section-heading h2,
      .team-card h2,
      .state-title {
        margin: 0.35rem 0 0;
        font-size: clamp(1.5rem, 3vw, 2.35rem);
        font-weight: 950;
        letter-spacing: -0.05em;
      }
      .live-pill {
        border-radius: 999px;
        background: color-mix(in srgb, var(--b0-primary) 12%, transparent);
        color: var(--b0-primary);
        padding: 0.45rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 900;
      }
      .daily-progress-card {
        display: grid;
        gap: 1rem;
        margin: 1.5rem 0;
        border-radius: 1.35rem;
        background: color-mix(in srgb, var(--b0-primary) 8%, transparent);
        padding: 1.25rem;
      }
      .daily-number {
        margin: 0;
        font-size: clamp(2rem, 5vw, 4rem);
        font-weight: 950;
        letter-spacing: -0.06em;
      }
      .task-list,
      .side-stack,
      .announcements-card ul {
        display: grid;
        gap: 0.85rem;
      }
      .task-row {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.9rem;
        align-items: center;
        border: 1px solid var(--b0-border);
        border-radius: 1.1rem;
        padding: 1rem;
      }
      .task-row p {
        margin: 0 0 0.2rem;
        font-weight: 850;
      }
      .task-status {
        display: grid;
        place-items: center;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--b0-border) 60%, transparent);
        color: var(--b0-text-muted);
        font-weight: 900;
      }
      .task-status-done {
        background: color-mix(in srgb, var(--b0-success) 18%, transparent);
        color: var(--b0-success);
      }
      .team-card {
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--b0-secondary) 14%, var(--b0-surface)),
          var(--b0-surface)
        ) !important;
      }
      .announcements-card ul {
        margin: 1rem 0 0;
        padding: 0;
        list-style: none;
      }
      .announcements-card li {
        border-radius: 1rem;
        border: 1px solid var(--b0-border);
        background: color-mix(in srgb, var(--b0-bg-elevated) 70%, transparent);
        padding: 0.9rem 1rem;
        color: var(--b0-text-muted);
      }
      .compact {
        align-items: center;
      }
      .loading-orb,
      .error-orb {
        display: grid;
        place-items: center;
        width: 4rem;
        height: 4rem;
        border-radius: 1.35rem;
        background: rgba(255, 255, 255, 0.14);
        font-weight: 950;
      }
      .loading-orb {
        animation: pulse 1.4s ease-in-out infinite;
      }
      @keyframes pulse {
        50% {
          transform: scale(1.04);
          opacity: 0.72;
        }
      }
      @media (max-width: 1024px) {
        .dashboard-hero,
        .content-grid {
          grid-template-columns: 1fr;
        }
        .metric-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 640px) {
        .metric-grid {
          grid-template-columns: 1fr;
        }
        .section-heading {
          display: grid;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  #svc = inject(DashboardService);
  vm$ = this.#svc.getDashboard().pipe(
    map((data) => ({ data, error: null, loading: false })),
    catchError((error) => of({ data: null, error, loading: false })),
    startWith({ data: null, error: null, loading: true }),
  );
}
