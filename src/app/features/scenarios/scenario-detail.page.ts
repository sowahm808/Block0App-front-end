import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { map, switchMap } from 'rxjs';
import { ScenarioDataService } from './scenario-data.service';

@Component({
  standalone: true,
  imports: [AsyncPipe, RouterLink, MatButtonModule, MatCardModule],
  template: `<section class="grid gap-5" aria-labelledby="scenario-title">
    @if (scenario$ | async; as s) {
      <header>
        <p class="eyebrow">{{ s.clinicalDomain }}</p>
        <h1 id="scenario-title">{{ s.title }}</h1>
        <p>
          {{ s.difficulty }} · {{ s.estimatedMinutes }} min · {{ s.questionCount }} questions ·
          {{ s.mode === 'timed' ? 'Timed' : 'Untimed' }}
        </p>
      </header>
      @if (s.mode === 'timed') {
        <mat-card class="border border-amber-300 bg-amber-50 p-4"
          ><strong>Timed scenario warning</strong>
          <p class="m-0">The timer begins when you select Start Scenario.</p></mat-card
        >
      }
      <mat-card class="grid gap-4 p-5"
        ><h2>Instructions</h2>
        <ul>
          @for (instruction of s.instructions; track instruction) {
            <li>{{ instruction }}</li>
          }
        </ul>
        <h2>Attempt rules</h2>
        <ul>
          @for (rule of s.attemptRules; track rule) {
            <li>{{ rule }}</li>
          }
        </ul></mat-card
      >
      <div class="flex flex-wrap gap-2">
        <button mat-flat-button color="primary" type="button" (click)="start(s.id)">Start Scenario</button>
        @if (s.activeAttemptId) {
          <a mat-stroked-button [routerLink]="['/scenario-attempts', s.activeAttemptId]">Resume Attempt</a>
        }
        <a mat-button routerLink="/scenarios">Return to Scenarios</a>
      </div>
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioDetailPage {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #data = inject(ScenarioDataService);
  scenario$ = this.#route.paramMap.pipe(
    map((p) => p.get('scenarioId') ?? ''),
    switchMap((id) => this.#data.detail(id)),
  );
  start(id: string) {
    this.#data.startAttempt(id).subscribe((attemptId) => void this.#router.navigate(['/scenario-attempts', attemptId]));
  }
}
