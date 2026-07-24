import { AsyncPipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { catchError, combineLatest, debounceTime, map, of, startWith, switchMap } from 'rxjs';
import { ScenarioDataService } from './scenario-data.service';
import { ClinicalScenario, ScenarioMode, ScenarioStatus } from './scenario.models';

type DifficultyFilter = 'all' | ClinicalScenario['difficulty'];

@Component({
  standalone: true,
  imports: [
    AsyncPipe,
    DecimalPipe,
    NgClass,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
  ],
  template: `<section class="grid gap-5" aria-labelledby="scenarios-title">
    <header>
      <p class="eyebrow">Clinical practice</p>
      <h1 id="scenarios-title">Clinical Scenarios</h1>
      <p>Available scenarios for applied clinical reasoning practice.</p>
    </header>
    @if (vm$ | async; as vm) {
      <div class="grid gap-3 md:grid-cols-5" aria-label="Scenario summary">
        @for (metric of vm.metrics; track metric.label) {
          <mat-card class="p-4"
            ><p class="m-0 text-sm text-[var(--b0-text-muted)]">{{ metric.label }}</p>
            <strong class="text-2xl">{{ metric.value }}</strong></mat-card
          >
        }
      </div>
      <mat-card class="p-4"
        ><div class="scenario-filters grid gap-3">
          <mat-form-field appearance="outline" floatLabel="always"
            ><mat-label>Search</mat-label
            ><input matInput type="search" [formControl]="search" placeholder="Title or domain"
          /></mat-form-field>
          <mat-form-field appearance="outline" floatLabel="always"
            ><mat-label>Clinical category</mat-label
            ><mat-select [formControl]="category"
              ><mat-option value="all">All categories</mat-option>
              @for (option of vm.categories; track option) {
                <mat-option [value]="option">{{ option }}</mat-option>
              }
            </mat-select></mat-form-field
          >
          <mat-form-field appearance="outline" floatLabel="always"
            ><mat-label>Status</mat-label
            ><mat-select [formControl]="status"
              ><mat-option value="all">All statuses</mat-option><mat-option value="not_started">Not started</mat-option
              ><mat-option value="in_progress">In progress</mat-option
              ><mat-option value="completed">Completed</mat-option></mat-select
            ></mat-form-field
          >
          <mat-form-field appearance="outline" floatLabel="always"
            ><mat-label>Mode</mat-label
            ><mat-select [formControl]="mode"
              ><mat-option value="all">Timed or Untimed</mat-option><mat-option value="timed">Timed</mat-option
              ><mat-option value="untimed">Untimed</mat-option></mat-select
            ></mat-form-field
          >
          <mat-form-field appearance="outline" floatLabel="always"
            ><mat-label>Difficulty</mat-label
            ><mat-select [formControl]="difficulty"
              ><mat-option value="all">All difficulties</mat-option><mat-option value="Easy">Easy</mat-option
              ><mat-option value="Moderate">Moderate</mat-option><mat-option value="Hard">Hard</mat-option></mat-select
            ></mat-form-field
          >
        </div></mat-card
      >
      <div class="grid gap-4 lg:grid-cols-2">
        @for (scenario of vm.filtered; track scenario.id) {
          <mat-card class="grid gap-4 p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="eyebrow m-0">{{ scenario.clinicalCategory }}</p>
                <h2 class="m-0 text-2xl">{{ scenario.title }}</h2>
              </div>
              <span class="rounded-full px-3 py-1 text-sm font-bold" [ngClass]="statusClass(scenario.status)">{{
                statusLabel(scenario.status)
              }}</span>
            </div>
            <div class="grid gap-3 sm:grid-cols-4">
              <span
                ><b>{{ scenario.difficulty }}</b
                ><br /><small>Difficulty</small></span
              ><span
                ><b>{{ scenario.questionCount }}</b
                ><br /><small>Questions</small></span
              ><span
                ><b>{{ modeLabel(scenario.mode) }}</b
                ><br /><small>Mode</small></span
              ><span
                ><b>{{ scenario.estimatedMinutes }} min</b><br /><small>Duration</small></span
              >
            </div>
            @if (scenario.status === 'completed' && scenario.scorePermitted !== false) {
              <p class="m-0"><b>Score:</b> {{ scenario.score ?? 0 | number: '1.0-0' }}%</p>
            }
            <div class="flex flex-wrap gap-2">
              <a mat-stroked-button [routerLink]="['/scenarios', scenario.id]">View Scenario</a
              ><button mat-flat-button color="primary" type="button" (click)="start(scenario)">
                {{ actionLabel(scenario) }}
              </button>
              @if (scenario.status === 'completed') {
                <a mat-button [routerLink]="['/scenario-attempts', scenario.activeAttemptId || scenario.id, 'review']"
                  >Review Completed Scenario</a
                >
              }
            </div>
          </mat-card>
        } @empty {
          <mat-card class="p-6"
            ><h2>No scenarios match these filters</h2>
            <p>Try widening the clinical category, status, mode, difficulty, or search filters.</p></mat-card
          >
        }
      </div>
    }
  </section>`,
  styles: [
    `
      .scenario-filters {
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioListPage {
  #data = inject(ScenarioDataService);
  #router = inject(Router);
  search = new FormControl('', { nonNullable: true });
  category = new FormControl('all', { nonNullable: true });
  status = new FormControl<'all' | ScenarioStatus>('all', { nonNullable: true });
  mode = new FormControl<'all' | ScenarioMode>('all', { nonNullable: true });
  difficulty = new FormControl<DifficultyFilter>('all', { nonNullable: true });
  #filters$ = combineLatest([
    this.search.valueChanges.pipe(startWith(this.search.value), debounceTime(150)),
    this.category.valueChanges.pipe(startWith(this.category.value)),
    this.status.valueChanges.pipe(startWith(this.status.value)),
    this.mode.valueChanges.pipe(startWith(this.mode.value)),
    this.difficulty.valueChanges.pipe(startWith(this.difficulty.value)),
  ]);
  vm$ = combineLatest([this.#data.list(), this.#filters$]).pipe(
    map(([data, f]) => {
      const scenarios = data.scenarios ?? [];
      const categories = [...new Set(scenarios.map((s) => s.clinicalCategory))].sort();
      return { metrics: this.metrics(data.summary), categories, filtered: this.filter(scenarios, f) };
    }),
    catchError(() => of({ metrics: [], categories: [], filtered: [] })),
  );
  metrics(s?: {
    availableScenarios: number;
    completedScenarios: number;
    currentDayTarget: number;
    averagePerformance: number;
    timedScenariosPending: number;
  }) {
    return [
      { label: 'Available scenarios', value: String(s?.availableScenarios ?? 0) },
      { label: 'Completed scenarios', value: String(s?.completedScenarios ?? 0) },
      { label: 'Current day target', value: String(s?.currentDayTarget ?? 0) },
      { label: 'Average performance', value: `${s?.averagePerformance ?? 0}%` },
      { label: 'Timed scenarios pending', value: String(s?.timedScenariosPending ?? 0) },
    ];
  }
  filter(
    items: ClinicalScenario[],
    [search, category, status, mode, difficulty]: [string, string, string, string, string],
  ) {
    const q = search.toLowerCase();
    return items.filter(
      (s) =>
        (!q || `${s.title} ${s.clinicalDomain} ${s.clinicalCategory}`.toLowerCase().includes(q)) &&
        (category === 'all' || s.clinicalCategory === category) &&
        (status === 'all' || s.status === status) &&
        (mode === 'all' || s.mode === mode) &&
        (difficulty === 'all' || s.difficulty === difficulty),
    );
  }
  start(s: ClinicalScenario) {
    if (s.activeAttemptId && s.status !== 'not_started')
      void this.#router.navigate(['/scenario-attempts', s.activeAttemptId]);
    else this.#data.startAttempt(s.id).subscribe((id) => void this.#router.navigate(['/scenario-attempts', id]));
  }
  actionLabel(s: ClinicalScenario) {
    return s.status === 'completed'
      ? 'Review Completed Scenario'
      : s.status === 'in_progress'
        ? 'Resume Scenario'
        : 'Start Scenario';
  }
  statusLabel(s: ScenarioStatus) {
    return s.replace('_', ' ');
  }
  modeLabel(m: ScenarioMode) {
    return m === 'timed' ? 'Timed' : 'Untimed';
  }
  statusClass(s: ScenarioStatus) {
    return s === 'completed'
      ? 'bg-emerald-100 text-emerald-800'
      : s === 'in_progress'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-slate-100 text-slate-700';
  }
}
