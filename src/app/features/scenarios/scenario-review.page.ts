import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { map, switchMap } from 'rxjs';
import { ScenarioDataService } from './scenario-data.service';

@Component({
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, RouterLink, MatButtonModule, MatCardModule],
  template: `<section class="grid gap-5" aria-labelledby="review-title">
    @if (review$ | async; as r) {
      <header>
        <p class="eyebrow">Scenario review</p>
        <h1 id="review-title">Clinical Scenario Review</h1>
        <p>
          Overall score {{ r.overallScore | number: '1.0-0' }}% · {{ r.questionsCorrect }} of
          {{ r.questionCount }} correct · Time taken {{ r.timeTaken }}
        </p>
      </header>
      <mat-card class="p-5"
        ><h2>Clinical domain performance</h2>
        <div class="grid gap-3 md:grid-cols-2">
          @for (d of r.clinicalDomainPerformance; track d.domain) {
            <p class="m-0">
              <b>{{ d.domain }}:</b> {{ d.score | number: '1.0-0' }}%
            </p>
          }
        </div></mat-card
      >
      <div class="grid gap-4">
        @for (q of r.questions; track q.id) {
          <mat-card class="grid gap-3 p-5"
            ><h2>Question</h2>
            <p>{{ q.stem }}</p>
            <p><b>Scholar answer:</b> {{ q.scholarAnswer }}</p>
            <p><b>Correct answer:</b> {{ q.correctAnswer }}</p>
            <p><b>Rationale:</b> {{ q.rationale }}</p>
            <p><b>Clinical reasoning explanation:</b> {{ q.clinicalReasoningExplanation }}</p>
            <p><b>Reference:</b> {{ q.reference }}</p></mat-card
          >
        }
      </div>
      <div class="flex flex-wrap gap-2">
        <a mat-flat-button color="primary" routerLink="/scenarios">Return to Scenarios</a
        ><a mat-stroked-button routerLink="/rehearsal">Review Weak Topics</a>
        @if (r.rehearsalAvailable) {
          <a mat-button routerLink="/rehearsal">Start Rehearsal</a>
        }
      </div>
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioReviewPage {
  #route = inject(ActivatedRoute);
  #data = inject(ScenarioDataService);
  review$ = this.#route.paramMap.pipe(
    map((p) => p.get('attemptId') ?? ''),
    switchMap((id) => this.#data.review(id)),
  );
}
