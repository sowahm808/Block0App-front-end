import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { map, switchMap } from 'rxjs';
import { ScenarioDataService } from './scenario-data.service';

@Component({
  standalone: true,
  imports: [AsyncPipe, FormsModule, RouterLink, MatButtonModule, MatCardModule],
  template: `<section class="grid gap-5" aria-labelledby="attempt-title">
    @if (attempt$ | async; as a) {
      <header class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="eyebrow">Scenario attempt</p>
          <h1 id="attempt-title">{{ a.scenarioTitle }}</h1>
          <p>
            {{ a.mode === 'timed' ? 'Timer: ' + a.timerLabel : 'Untimed scenario' }} · Question
            {{ a.currentQuestionIndex + 1 }} of {{ a.questionCount }} · {{ a.saveStatus }}
          </p>
        </div>
        <a mat-stroked-button routerLink="/scenarios">Exit scenario</a>
      </header>
      <mat-card class="border border-amber-300 bg-amber-50 p-4"
        ><strong>Exit warning</strong>
        <p class="m-0">
          Leaving before submitting may save progress, but unsubmitted answers can remain incomplete.
        </p></mat-card
      >
      <div class="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <mat-card class="p-5"
          ><h2>Patient summary</h2>
          <dl>
            <dt>Age</dt>
            <dd>{{ a.patientSummary.age }}</dd>
            <dt>Sex or gender</dt>
            <dd>{{ a.patientSummary.sexOrGender || 'Not clinically relevant' }}</dd>
            <dt>Presenting complaint</dt>
            <dd>{{ a.patientSummary.presentingComplaint }}</dd>
            <dt>Vital signs</dt>
            <dd>{{ a.patientSummary.vitalSigns.join(', ') }}</dd>
            <dt>Relevant history</dt>
            <dd>{{ a.patientSummary.relevantHistory.join(', ') }}</dd>
          </dl></mat-card
        >
        <main class="grid gap-4">
          <mat-card class="p-5"
            ><h2>Clinical vignette</h2>
            <p>{{ a.clinicalVignette }}</p>
            <h3>Lab results</h3>
            <table class="w-full text-left">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Result</th>
                  <th>Reference range</th>
                  <th>Abnormal indicator</th>
                </tr>
              </thead>
              <tbody>
                @for (lab of a.labResults; track lab.test) {
                  <tr>
                    <td>{{ lab.test }}</td>
                    <td>{{ lab.result }}</td>
                    <td>{{ lab.referenceRange }}</td>
                    <td>{{ lab.abnormal ? 'Abnormal' : 'Normal' }}</td>
                  </tr>
                }
              </tbody>
            </table>
            <h3>Supporting media</h3>
            @for (media of a.supportingMedia; track media.title) {
              <p>
                <b>{{ media.type }}:</b> {{ media.title }} — {{ media.description }}
              </p>
            }
          </mat-card>
          @if (a.sequentialProgressionRequired) {
            <p class="m-0 text-sm text-[var(--b0-text-muted)]">
              Only the current question is visible because sequential progression is required.
            </p>
          }
          @for (
            q of visibleQuestions(a.questions, a.currentQuestionIndex, a.sequentialProgressionRequired);
            track q.id
          ) {
            <mat-card class="p-5"
              ><h2>Question</h2>
              <p>{{ q.stem }}</p>
              @for (choice of q.choices; track choice) {
                <label class="block py-1"
                  ><input type="radio" name="answer-{{ q.id }}" [(ngModel)]="q.selectedAnswer" [value]="choice" />
                  {{ choice }}</label
                >
              }
              <button mat-flat-button color="primary" type="button">Submit or Next</button></mat-card
            >
          }
          <button
            mat-raised-button
            color="primary"
            type="button"
            onclick="return confirm('Submit this scenario for scoring?')"
          >
            Submit Scenario
          </button>
        </main>
      </div>
    }
  </section>`,
  styles: [
    `
      td,
      th {
        padding: 0.5rem;
        border-bottom: 1px solid var(--b0-border, #ddd);
      }
      dt {
        font-weight: 700;
      }
      dd {
        margin: 0 0 0.75rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioAttemptPage {
  #route = inject(ActivatedRoute);
  #data = inject(ScenarioDataService);
  attempt$ = this.#route.paramMap.pipe(
    map((p) => p.get('attemptId') ?? ''),
    switchMap((id) => this.#data.attempt(id)),
  );
  visibleQuestions<T>(questions: T[], current: number, sequential: boolean) {
    return sequential ? questions.slice(current, current + 1) : questions;
  }
}
