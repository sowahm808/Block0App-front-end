import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

interface ProgramPhase {
  title: string;
  days: string;
  summary: string;
  metrics: readonly string[];
  actions: readonly string[];
}

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
  imports: [RouterLink, MatButtonModule, MatCardModule, PageHeaderComponent],
  template: `<section class="grid gap-5" aria-labelledby="program-title">
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
      <mat-card class="summary-card"><strong>21</strong><span>guided days</span></mat-card>
    </div>

    <div class="phase-grid">
      @for (phase of phases; track phase.title) {
        <mat-card class="phase-card">
          <p class="phase-days">{{ phase.days }}</p>
          <h2>{{ phase.title }}</h2>
          <p class="phase-summary">{{ phase.summary }}</p>
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
      .phase-card {
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
      li {
        color: var(--b0-text-muted);
      }
      .phase-card h2,
      .phase-card h3,
      .phase-card p {
        margin-top: 0;
      }
      .phase-days {
        color: var(--b0-primary);
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      .phase-content {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramStructurePage {
  readonly phases = PROGRAM_PHASES;
}
