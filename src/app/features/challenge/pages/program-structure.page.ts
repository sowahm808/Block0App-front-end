import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { catchError, map, of, startWith } from 'rxjs';
import { DashboardService } from '../../dashboard/data-access/dashboard.service';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

interface ProgramPhase {
  title: string;
  days: string;
  summary: string;
  metrics: readonly string[];
  actions: readonly string[];
}

interface ProgramProgressStatus {
  title: string;
  completionPercent: number;
}

interface ProgramPhaseView extends ProgramPhase {
  completionLabel: string;
  completionValue: number;
  statusLabel: string;
}

interface ExamReminderDraft {
  examAtUtc: string;
  reminderAtUtc: string;
  minutesBefore: number;
  deliveryChannel: 'in-app';
  enabled: boolean;
}

const EXAM_REMINDER_STORAGE_KEY = 'block0.examReminder.me';

const PROGRAM_PHASES: readonly ProgramPhase[] = [
  {
    title: 'Knowledge Mastery',
    days: 'Days 1–14',
    summary: 'Complete the full knowledge foundation through 40 learning packs and 200 capsules.',
    metrics: [
      '40 learning packs',
      '20 questions per learning pack',
      '800 total questions',
      '5 capsules per learning pack',
      '4 questions per capsule',
      '14–15 capsules per day',
      '≈57 questions per day',
    ],
    actions: ['Start assigned learning packs', 'Complete capsule question sets', 'Track daily capsule and question pace'],
  },
  {
    title: 'Clinical Scenarios',
    days: 'Days 15–18',
    summary: 'Transition into escalating exam-style clinical scenario practice.',
    metrics: [
      'Day 15: 10 scenarios',
      'Day 16: 20 scenarios',
      'Day 17: 40 scenarios',
      'Day 18: 60 scenarios',
      '130 total clinical scenarios',
    ],
    actions: ['Open scenario sets', 'Review scenario feedback', 'Flag weak clinical reasoning patterns'],
  },
  {
    title: 'Rehearsal',
    days: 'Days 19–20',
    summary: 'Convert mistakes and marked items into high-yield readiness before exam day.',
    metrics: [
      'Missed-question review',
      'Marked-question review',
      'Weak-topic reinforcement',
      'W3 memory pearls',
      'High-yield repetition',
      'Practice readiness checks',
    ],
    actions: ['Review missed and marked questions', 'Reinforce weak topics', 'Complete readiness checks'],
  },
  {
    title: 'Rest and Exam Day',
    days: 'Day 21',
    summary: 'Protect confidence, logistics, and final readiness instead of adding heavy new workload.',
    metrics: [
      'Rest and confidence building',
      'Exam strategy guidance',
      'Exam logistics checklist',
      'Final Block Zero readiness check',
      'Optional scheduled exam reminder',
    ],
    actions: ['Confirm exam logistics', 'Run the final readiness check', 'Schedule an optional reminder'],
  },
];

@Component({
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, PageHeaderComponent],
  template: `<section class="grid gap-5" aria-labelledby="program-title">
    @if (vm$ | async; as vm) {
      <b0-page-header
        titleId="program-title"
        title="21-day Block Zero program"
        description="A complete roadmap from knowledge mastery through clinical scenarios, rehearsal, and exam day readiness."
        eyebrow="Challenge structure"
      >
        <a mat-raised-button color="primary" routerLink="/learning-packs">Start learning packs</a>
        <a mat-stroked-button color="primary" routerLink="/readiness">Check readiness</a>
      </b0-page-header>

      <div class="program-summary" aria-label="Program totals">
        <mat-card class="summary-card"><strong>40</strong><span>learning packs</span></mat-card>
        <mat-card class="summary-card"><strong>800</strong><span>knowledge questions</span></mat-card>
        <mat-card class="summary-card"><strong>130</strong><span>clinical scenarios</span></mat-card>
        <mat-card class="summary-card"><strong>{{ vm.overallCompletion }}%</strong><span>live completion</span></mat-card>
      </div>

      <mat-card class="reminder-card">
        <div>
          <p class="phase-days">Exam reminder</p>
          <h2>Schedule your optional Day 21 reminder</h2>
          <p class="phase-summary">
            Save a private reminder in this browser while backend notification scheduling is unavailable.
          </p>
        </div>
        <form [formGroup]="reminderForm" (ngSubmit)="scheduleReminder()" class="reminder-form">
          <label>
            <span>Exam date and time</span>
            <input type="datetime-local" formControlName="examAtLocal" />
          </label>
          <label>
            <span>Reminder lead time</span>
            <select formControlName="minutesBefore">
              <option [ngValue]="60">1 hour before</option>
              <option [ngValue]="180">3 hours before</option>
              <option [ngValue]="1440">1 day before</option>
            </select>
          </label>
          <button mat-raised-button color="primary" type="submit" [disabled]="reminderForm.invalid || savingReminder">
            {{ savingReminder ? 'Scheduling…' : 'Save reminder' }}
          </button>
          @if (reminderMessage) {
            <p class="reminder-status">{{ reminderMessage }}</p>
          }
        </form>
      </mat-card>

      <div class="phase-grid">
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
            <div class="phase-content">
              <div>
                <h3>Requirements</h3>
                <ul>
                  @for (metric of phase.metrics; track metric) {
                    <li>{{ metric }}</li>
                  }
                </ul>
              </div>
              <div>
                <h3>System actions</h3>
                <ul>
                  @for (action of phase.actions; track action) {
                    <li>{{ action }}</li>
                  }
                </ul>
              </div>
            </div>
          </mat-card>
        }
      </div>
    }
  </section>`,
  styles: [
    `
      .program-summary,
      .phase-grid {
        display: grid;
        gap: 1rem;
      }
      .program-summary {
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
      }
      .summary-card,
      .phase-card,
      .reminder-card {
        padding: 1.25rem;
      }
      .summary-card strong {
        display: block;
        color: var(--b0-primary);
        font-size: 2.25rem;
        font-weight: 900;
        line-height: 1;
      }
      .summary-card span,
      .phase-summary,
      li,
      .phase-progress span,
      .reminder-card label span {
        color: var(--b0-text-muted);
      }
      .phase-card h2,
      .phase-card h3,
      .phase-card p,
      .reminder-card h2,
      .reminder-card p {
        margin-top: 0;
      }
      .phase-days {
        color: var(--b0-primary);
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      .phase-content,
      .reminder-card {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      }
      .phase-heading {
        display: flex;
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
        font-size: 1.45rem;
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
  readonly #fb = inject(FormBuilder);

  savingReminder = false;
  reminderMessage = this.#savedReminderMessage();
  readonly reminderForm = this.#fb.nonNullable.group({
    examAtLocal: ['', Validators.required],
    minutesBefore: [1440, Validators.required],
  });

  readonly vm$ = this.#dashboard.getDashboard().pipe(
    catchError(() => of(null)),
    map((dashboard) => {
      const statuses = this.#deriveProgramStatuses(dashboard?.currentDay, dashboard?.overallCompletion);
      return {
        overallCompletion: Math.round(dashboard?.overallCompletion ?? this.#averageCompletion(statuses)),
        phases: PROGRAM_PHASES.map((phase) => this.#toPhaseView(phase, statuses)),
      };
    }),
    startWith({ overallCompletion: 0, phases: PROGRAM_PHASES.map((phase) => this.#toPhaseView(phase, [])) }),
  );

  scheduleReminder(): void {
    if (this.reminderForm.invalid) return;
    this.savingReminder = true;
    this.reminderMessage = '';
    const { examAtLocal, minutesBefore } = this.reminderForm.getRawValue();
    const examDate = new Date(examAtLocal);
    const reminderDate = new Date(examDate.getTime() - minutesBefore * 60_000);
    const reminder: ExamReminderDraft = {
      examAtUtc: examDate.toISOString(),
      reminderAtUtc: reminderDate.toISOString(),
      minutesBefore,
      deliveryChannel: 'in-app',
      enabled: true,
    };

    this.#saveReminder(reminder);
    this.savingReminder = false;
    this.reminderMessage = this.#formatReminderMessage(reminder);
  }

  #saveReminder(reminder: ExamReminderDraft): void {
    try {
      localStorage.setItem(EXAM_REMINDER_STORAGE_KEY, JSON.stringify(reminder));
    } catch {
      // Keep the form usable in restricted browser contexts; the visible message still confirms the selected time.
    }
  }

  #savedReminderMessage(): string {
    try {
      const reminder = JSON.parse(localStorage.getItem(EXAM_REMINDER_STORAGE_KEY) ?? 'null') as ExamReminderDraft | null;
      return reminder?.enabled ? this.#formatReminderMessage(reminder) : '';
    } catch {
      return '';
    }
  }

  #formatReminderMessage(reminder: ExamReminderDraft): string {
    return `Exam reminder saved in this browser for ${new Date(reminder.reminderAtUtc).toLocaleString()}.`;
  }

  #deriveProgramStatuses(currentDay?: number, overallCompletion?: number): ProgramProgressStatus[] {
    if (typeof overallCompletion === 'number' && overallCompletion >= 100) {
      return PROGRAM_PHASES.map((phase) => ({ title: phase.title, completionPercent: 100 }));
    }
    if (typeof currentDay !== 'number' || currentDay < 1) return [];
    return PROGRAM_PHASES.map((phase) => ({ title: phase.title, completionPercent: this.#phaseCompletionForDay(phase, currentDay) }));
  }

  #phaseCompletionForDay(phase: ProgramPhase, currentDay: number): number {
    const [startDay, endDay] = this.#phaseDayRange(phase);
    if (currentDay > endDay) return 100;
    if (currentDay < startDay) return 0;
    return Math.round(((currentDay - startDay + 1) / (endDay - startDay + 1)) * 100);
  }

  #phaseDayRange(phase: ProgramPhase): [number, number] {
    const days = phase.days.match(/\d+/g)?.map(Number) ?? [];
    const startDay = days[0] ?? 1;
    const endDay = days[1] ?? startDay;
    return [startDay, endDay];
  }

  #toPhaseView(phase: ProgramPhase, statuses: ProgramProgressStatus[]): ProgramPhaseView {
    const status = statuses.find((item) => item.title.toLowerCase() === phase.title.toLowerCase());
    const value = this.#completionValue(status);
    return {
      ...phase,
      completionValue: value,
      completionLabel: status ? `${value}%` : 'Pending',
      statusLabel: status ? (value >= 100 ? 'Complete' : 'In progress') : 'Awaiting API',
    };
  }

  #completionValue(status?: ProgramProgressStatus): number {
    if (!status) return 0;
    return Math.max(0, Math.min(100, Math.round(status.completionPercent)));
  }

  #averageCompletion(statuses: ProgramProgressStatus[]): number {
    if (!statuses.length) return 0;
    return statuses.reduce((total, status) => total + this.#completionValue(status), 0) / statuses.length;
  }
}
