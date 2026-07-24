import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { catchError, finalize, map, of, startWith } from 'rxjs';
import { DashboardService } from '../../dashboard/data-access/dashboard.service';
import { NotificationsApiService } from '../../../core/api/feature-api.services';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

type DayStatus = 'Upcoming' | 'Available' | 'In Progress' | 'Completed' | 'Missed' | 'Rest Day';
type ActivityType = 'Knowledge mastery' | 'Clinical scenarios' | 'Rehearsal' | 'Rest';

interface ProgramPhase {
  title: ActivityType;
  days: string;
  summary: string;
  metrics: readonly string[];
}

interface ProgramDay {
  dayNumber: number;
  activityType: ActivityType;
  dailyTarget: string;
  learningPackCount?: number;
  questionCount?: number;
  scenarioVolume?: number;
  focus: readonly string[];
}

interface ProgramDayView extends ProgramDay {
  status: DayStatus;
  completion: number;
  locked: boolean;
}

interface ProgramPhaseView extends ProgramPhase {
  completionLabel: string;
  completionValue: number;
  statusLabel: string;
}

interface ExamReminderDraft {
  examName: string;
  examDate: string;
  reminderTime: string;
  timezone: string;
  reminderOffsetsMinutes: number[];
  channels: ['in-app'];
  notes: string;
  enabled: boolean;
}

interface ExamReminderResponse extends ExamReminderDraft {
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

const PROGRAM_PHASES: readonly ProgramPhase[] = [
  {
    title: 'Knowledge mastery',
    days: 'Days 1–14',
    summary: 'Build core mastery with daily learning-pack and question targets.',
    metrics: ['Learning-pack count', 'Question count', 'Daily target'],
  },
  {
    title: 'Clinical scenarios',
    days: 'Days 15–18',
    summary: 'Apply knowledge to progressively larger blocks of clinical scenarios.',
    metrics: ['Scenario volume by day', 'Clinical reasoning feedback', 'Escalating exam-style practice'],
  },
  {
    title: 'Rehearsal',
    days: 'Days 19–20',
    summary: 'Convert weak topics and marked questions into final exam readiness.',
    metrics: ['Weak-topic review', 'Marked questions', 'Final readiness checks'],
  },
  {
    title: 'Rest',
    days: 'Day 21',
    summary: 'Protect energy, prepare exam logistics, and confirm final readiness.',
    metrics: ['Exam preparation', 'Final readiness', 'Optional reminder'],
  },
];

const PROGRAM_DAYS: readonly ProgramDay[] = [
  ...Array.from({ length: 14 }, (_, index) => {
    const dayNumber = index + 1;
    const learningPackCount = dayNumber <= 12 ? 3 : 2;
    const questionCount = learningPackCount * 20;
    return {
      dayNumber,
      activityType: 'Knowledge mastery' as const,
      dailyTarget: `${learningPackCount} learning packs • ${questionCount} questions`,
      learningPackCount,
      questionCount,
      focus: ['Knowledge mastery', 'Learning-pack count', 'Question count', 'Daily target'],
    };
  }),
  ...[10, 20, 40, 60].map((scenarioVolume, index) => ({
    dayNumber: index + 15,
    activityType: 'Clinical scenarios' as const,
    dailyTarget: `${scenarioVolume} clinical scenarios`,
    scenarioVolume,
    focus: ['Clinical scenarios', 'Scenario volume by day'],
  })),
  ...[19, 20].map((dayNumber) => ({
    dayNumber,
    activityType: 'Rehearsal' as const,
    dailyTarget: dayNumber === 19 ? 'Weak-topic review' : 'Marked questions and readiness check',
    focus: ['Rehearsal', dayNumber === 19 ? 'Weak-topic review' : 'Marked questions'],
  })),
  {
    dayNumber: 21,
    activityType: 'Rest',
    dailyTarget: 'Rest, exam preparation, final readiness',
    focus: ['Rest', 'Exam preparation', 'Final readiness'],
  },
];

@Component({
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, PageHeaderComponent],
  template: `<section class="grid gap-5" aria-labelledby="program-title">
    @if (vm$ | async; as vm) {
      <b0-page-header
        titleId="program-title"
        title="Program Structure"
        description="A 21-day challenge timeline from knowledge mastery through clinical scenarios, rehearsal, rest, and final readiness."
        eyebrow="Challenge roadmap"
      >
        <a mat-raised-button color="primary" routerLink="/challenge/today">Open today</a>
        <a mat-stroked-button color="primary" routerLink="/readiness">Check readiness</a>
      </b0-page-header>

      <div class="program-summary" aria-label="Program totals">
        <mat-card class="summary-card"><strong>Days 1–14</strong><span>Knowledge mastery</span></mat-card>
        <mat-card class="summary-card"><strong>Days 15–18</strong><span>Clinical scenarios</span></mat-card>
        <mat-card class="summary-card"><strong>Days 19–20</strong><span>Rehearsal</span></mat-card>
        <mat-card class="summary-card"><strong>Day 21</strong><span>Rest and final readiness</span></mat-card>
      </div>

      <div class="phase-grid" aria-label="Timeline">
        @for (phase of vm.phases; track phase.title) {
          <mat-card class="phase-card">
            <div class="phase-heading">
              <div>
                <p class="phase-days">{{ phase.days }}</p>
                <h2>{{ phase.title }}</h2>
              </div>
              <div class="phase-progress" [attr.aria-label]="phase.title + ' completion'">
                <strong>{{ phase.completionLabel }}</strong>
                <span>{{ phase.statusLabel }}</span>
              </div>
            </div>
            <p class="phase-summary">{{ phase.summary }}</p>
            <div class="progress-track"><span [style.width.%]="phase.completionValue"></span></div>
            <ul class="metric-list">
              @for (metric of phase.metrics; track metric) {
                <li>{{ metric }}</li>
              }
            </ul>
          </mat-card>
        }
      </div>

      <mat-card class="day-board">
        <div class="section-heading">
          <p class="phase-days">Day cards</p>
          <h2>21-day schedule</h2>
          <p class="phase-summary">
            Each day shows the day number, activity type, status, completion, and locked or unlocked state.
          </p>
        </div>
        <div class="status-legend" aria-label="Status values">
          @for (status of statuses; track status) {
            <span>{{ status }}</span>
          }
        </div>
        <div class="day-grid">
          @for (day of vm.days; track day.dayNumber) {
            <article
              class="day-card"
              [class.locked]="day.locked"
              [attr.aria-label]="'Day ' + day.dayNumber + ' ' + day.status"
            >
              <div class="day-card-top">
                <span class="day-number">Day {{ day.dayNumber }}</span>
                <span class="lock-state">{{ day.locked ? 'Locked' : 'Unlocked' }}</span>
              </div>
              <h3>{{ day.activityType }}</h3>
              <p>{{ day.dailyTarget }}</p>
              <div class="day-meta">
                <span class="status-pill">{{ day.status }}</span>
                <span>{{ day.completion }}% complete</span>
              </div>
              <div class="progress-track"><span [style.width.%]="day.completion"></span></div>
              <ul>
                @for (item of day.focus; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </article>
          }
        </div>
      </mat-card>

      <mat-card class="reminder-card">
        <div>
          <p class="phase-days">Exam reminder</p>
          <h2>Schedule your optional Day 21 reminder</h2>
          <p class="phase-summary">
            Save a private reminder to your account so it follows you across browsers and devices.
          </p>
        </div>
        <form [formGroup]="reminderForm" (ngSubmit)="scheduleReminder()" class="reminder-form">
          <label
            ><span>Exam name</span
            ><input type="text" formControlName="examName" maxlength="120" placeholder="e.g. Block Zero final exam"
          /></label>
          <label><span>Exam date and time</span><input type="datetime-local" formControlName="examAtLocal" /></label>
          <label
            ><span>Reminder lead time</span
            ><select formControlName="minutesBefore">
              <option [ngValue]="60">1 hour before</option>
              <option [ngValue]="180">3 hours before</option>
              <option [ngValue]="1440">1 day before</option>
            </select></label
          >
          <label
            ><span>Notes (optional)</span
            ><input
              type="text"
              formControlName="notes"
              maxlength="500"
              placeholder="Bring ID, admission ticket, and snacks"
          /></label>
          <button mat-raised-button color="primary" type="submit" [disabled]="reminderForm.invalid || savingReminder">
            {{ savingReminder ? 'Scheduling…' : 'Save reminder' }}
          </button>
          @if (reminderMessage) {
            <p class="reminder-status">{{ reminderMessage }}</p>
          }
        </form>
      </mat-card>
    }
  </section>`,
  styles: [
    `
      .program-summary,
      .phase-grid,
      .day-grid {
        display: grid;
        gap: 1rem;
      }
      .program-summary {
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      }
      .phase-grid {
        grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
      }
      .day-grid {
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      }
      .summary-card,
      .phase-card,
      .reminder-card,
      .day-board {
        padding: 1.25rem;
      }
      .summary-card strong {
        display: block;
        color: var(--b0-primary);
        font-size: 1.55rem;
        font-weight: 950;
        line-height: 1;
      }
      .summary-card span,
      .phase-summary,
      li,
      .phase-progress span,
      .reminder-card label span,
      .day-card p,
      .day-meta {
        color: var(--b0-text-muted);
      }
      h2,
      h3,
      p {
        margin-top: 0;
      }
      .phase-days {
        color: var(--b0-primary);
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      .phase-heading,
      .day-card-top,
      .day-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .phase-progress {
        display: grid;
        place-items: center;
        min-width: 6rem;
        border-radius: 1rem;
        background: color-mix(in srgb, var(--b0-primary) 10%, transparent);
        padding: 0.75rem;
        text-align: center;
      }
      .phase-progress strong {
        color: var(--b0-primary);
        font-size: 1.35rem;
        font-weight: 950;
      }
      .progress-track {
        height: 0.55rem;
        overflow: hidden;
        border-radius: 999px;
        background: color-mix(in srgb, var(--b0-border) 80%, transparent);
      }
      .progress-track span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--b0-primary);
      }
      .metric-list,
      .day-card ul {
        padding-left: 1.1rem;
      }
      .section-heading {
        margin-bottom: 1rem;
      }
      .status-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      .status-legend span,
      .status-pill,
      .lock-state {
        border-radius: 999px;
        background: color-mix(in srgb, var(--b0-primary) 10%, transparent);
        color: var(--b0-primary);
        font-size: 0.78rem;
        font-weight: 900;
        padding: 0.35rem 0.65rem;
      }
      .day-card {
        display: grid;
        gap: 0.8rem;
        border: 1px solid var(--b0-border);
        border-radius: 1rem;
        background: var(--b0-surface);
        padding: 1rem;
      }
      .day-card.locked {
        opacity: 0.72;
      }
      .day-number {
        font-weight: 950;
      }
      .reminder-card {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      }
      .reminder-form {
        display: grid;
        gap: 0.85rem;
      }
      .reminder-form label {
        display: grid;
        gap: 0.35rem;
        font-weight: 800;
      }
      .reminder-form input,
      .reminder-form select {
        min-height: 2.75rem;
        border: 1px solid var(--b0-border);
        border-radius: 0.8rem;
        background: var(--b0-surface);
        color: var(--b0-text);
        padding: 0 0.8rem;
      }
      .reminder-status {
        color: var(--b0-success);
        font-weight: 800;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramStructurePage {
  readonly #dashboard = inject(DashboardService);
  readonly #notifications = inject(NotificationsApiService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #fb = inject(FormBuilder);

  readonly statuses: readonly DayStatus[] = ['Upcoming', 'Available', 'In Progress', 'Completed', 'Missed', 'Rest Day'];
  savingReminder = false;
  loadingReminder = true;
  reminderMessage = '';
  readonly reminderForm = this.#fb.nonNullable.group({
    examName: ['Block Zero exam', [Validators.required, Validators.maxLength(120)]],
    examAtLocal: ['', Validators.required],
    minutesBefore: [1440, Validators.required],
    notes: ['', Validators.maxLength(500)],
  });

  readonly vm$ = this.#dashboard.getDashboard().pipe(
    catchError(() => of(null)),
    map((dashboard) => {
      const currentDay = dashboard?.currentDay ?? 1;
      const overallCompletion = Math.round(dashboard?.overallCompletion ?? 0);
      return {
        overallCompletion,
        phases: PROGRAM_PHASES.map((phase) => this.#toPhaseView(phase, currentDay, overallCompletion)),
        days: PROGRAM_DAYS.map((day) => this.#toDayView(day, currentDay, overallCompletion)),
      };
    }),
    startWith({
      overallCompletion: 0,
      phases: PROGRAM_PHASES.map((phase) => this.#toPhaseView(phase, 1, 0)),
      days: PROGRAM_DAYS.map((day) => this.#toDayView(day, 1, 0)),
    }),
  );

  constructor() {
    const subscription = this.#notifications
      .getMyExamReminder<ExamReminderResponse>()
      .pipe(
        catchError(() => of(null)),
        finalize(() => (this.loadingReminder = false)),
      )
      .subscribe((reminder) => {
        if (!reminder?.enabled) return;
        this.reminderForm.patchValue({
          examName: reminder.examName,
          examAtLocal: this.#toLocalDateTimeInputValue(reminder.examDate),
          minutesBefore: reminder.reminderOffsetsMinutes[0] ?? 1440,
          notes: reminder.notes ?? '',
        });
        this.reminderMessage = this.#formatReminderMessage(reminder);
      });
    this.#destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  scheduleReminder(): void {
    if (this.reminderForm.invalid) return;
    this.savingReminder = true;
    this.reminderMessage = '';
    this.#notifications
      .saveMyExamReminder<ExamReminderResponse>(this.#buildReminder())
      .pipe(finalize(() => (this.savingReminder = false)))
      .subscribe({
        next: (savedReminder) => (this.reminderMessage = this.#formatReminderMessage(savedReminder)),
        error: () =>
          (this.reminderMessage = 'We could not save your exam reminder. Please check your connection and try again.'),
      });
  }

  #toDayView(day: ProgramDay, currentDay: number, overallCompletion: number): ProgramDayView {
    const completion = this.#dayCompletion(day.dayNumber, currentDay, overallCompletion);
    return {
      ...day,
      completion,
      locked: day.dayNumber > currentDay,
      status: this.#dayStatus(day.dayNumber, currentDay, completion),
    };
  }

  #dayStatus(dayNumber: number, currentDay: number, completion: number): DayStatus {
    if (dayNumber === 21) return 'Rest Day';
    if (completion >= 100) return 'Completed';
    if (dayNumber < currentDay) return 'Missed';
    if (dayNumber === currentDay && completion > 0) return 'In Progress';
    if (dayNumber === currentDay) return 'Available';
    return 'Upcoming';
  }

  #dayCompletion(dayNumber: number, currentDay: number, overallCompletion: number): number {
    if (overallCompletion >= 100 || dayNumber < currentDay) return 100;
    if (dayNumber > currentDay) return 0;
    return Math.max(0, Math.min(99, overallCompletion));
  }

  #toPhaseView(phase: ProgramPhase, currentDay: number, overallCompletion: number): ProgramPhaseView {
    const [startDay, endDay] = this.#phaseDayRange(phase.days);
    const value =
      overallCompletion >= 100
        ? 100
        : currentDay > endDay
          ? 100
          : currentDay < startDay
            ? 0
            : Math.round(((currentDay - startDay + 1) / (endDay - startDay + 1)) * 100);
    return {
      ...phase,
      completionValue: value,
      completionLabel: `${value}%`,
      statusLabel: value >= 100 ? 'Completed' : value > 0 ? 'In Progress' : 'Upcoming',
    };
  }

  #phaseDayRange(daysLabel: string): [number, number] {
    const days = daysLabel.match(/\d+/g)?.map(Number) ?? [];
    return [days[0] ?? 1, days[1] ?? days[0] ?? 1];
  }

  #buildReminder(): ExamReminderDraft {
    const { examName, examAtLocal, minutesBefore, notes } = this.reminderForm.getRawValue();
    return {
      examName: examName.trim(),
      examDate: new Date(examAtLocal).toISOString(),
      reminderTime: this.#toReminderTime(examAtLocal, minutesBefore),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      reminderOffsetsMinutes: [minutesBefore],
      channels: ['in-app'],
      notes: notes.trim(),
      enabled: true,
    };
  }

  #toReminderTime(examAtLocal: string, minutesBefore: number): string {
    return new Date(new Date(examAtLocal).getTime() - minutesBefore * 60_000).toTimeString().slice(0, 5);
  }

  #formatReminderMessage(reminder: ExamReminderDraft): string {
    const reminderTime = reminder.reminderTime.match(/^([01]\d|2[0-3]):[0-5]\d$/)
      ? reminder.reminderTime
      : this.#toLocalTimeValue(reminder.reminderTime);
    return `Exam reminder saved to your account for ${reminderTime}.`;
  }

  #toLocalTimeValue(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toTimeString().slice(0, 5);
  }

  #toLocalDateTimeInputValue(value: string): string {
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  }
}
