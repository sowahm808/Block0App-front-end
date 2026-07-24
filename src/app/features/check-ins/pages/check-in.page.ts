import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { confidenceValidators, noteValidators } from '../../../shared/validators/check-in.validators';
import { CheckInsApiService } from '../../../core/api/feature-api.services';
import { ToastService } from '../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { FormFieldErrorComponent } from '../../../shared/ui/form-field-error/form-field-error.component';
import { RouterLink } from '@angular/router';

const SUPPORT_CATEGORIES = ['Academic', 'Technical', 'Time management', 'Motivation', 'Personal', 'Other'] as const;
const GOAL_OUTCOMES = ['Yes', 'Partially', 'No'] as const;

interface EveningSummary {
  capsulesCompletedToday: number;
  questionsCompletedToday: number;
  studyTimeRecordedMinutes: number;
  questionsMarkedForReview: number;
}

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    PageHeaderComponent,
    FormFieldErrorComponent,
    RouterLink,
  ],
  template: `<section class="grid max-w-3xl gap-5">
    <b0-page-header
      [title]="kind() === 'morning' ? 'Morning Check-In' : 'Evening Check-In'"
      [description]="description()"
      eyebrow="Daily habit"
    />
    @if (kind() === 'evening') {
      <mat-card class="p-4 sm:p-6">
        <div class="grid gap-4">
          <div>
            <h2 class="text-lg font-bold text-[var(--b0-text)]">Today’s tracked progress</h2>
            <p class="text-sm text-[var(--b0-muted)]">
              These values come from the backend and are not manually editable.
            </p>
          </div>
          <dl class="grid gap-3 sm:grid-cols-2">
            @for (metric of eveningMetrics(); track metric.label) {
              <div class="rounded-2xl border border-[var(--b0-border)] bg-[var(--b0-surface)] p-4">
                <dt class="text-sm font-bold text-[var(--b0-muted)]">{{ metric.label }}</dt>
                <dd class="mt-2 text-2xl font-black text-[var(--b0-text)]">{{ metric.value }}</dd>
              </div>
            }
          </dl>
          @if (summaryError()) {
            <p
              class="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-900"
              role="status"
            >
              {{ summaryError() }}
            </p>
          }
        </div>
      </mat-card>
    }

    <mat-card class="p-4 sm:p-6">
      <form [formGroup]="form" class="grid gap-5" (ngSubmit)="submit()" novalidate>
        <fieldset class="grid gap-3">
          <legend class="text-sm font-bold text-[var(--b0-text)]">
            {{ kind() === 'morning' ? 'Confidence level' : 'Evening confidence' }} <span aria-hidden="true">*</span>
          </legend>
          @if (kind() === 'evening') {
            <mat-slider min="1" max="10" step="1" discrete showTickMarks aria-label="Evening confidence from 1 to 10">
              <input matSliderThumb formControlName="confidence" />
            </mat-slider>
            <p class="text-sm font-bold text-[var(--b0-text)]">Selected: {{ form.controls.confidence.value }}/10</p>
          } @else {
            <div class="flex flex-wrap gap-2" role="group" aria-label="Confidence level from 1 to 10">
              @for (level of confidenceLevels; track level) {
                <button
                  type="button"
                  mat-stroked-button
                  [color]="form.controls.confidence.value === level ? 'primary' : undefined"
                  [class.border-[var(--b0-primary)]]="form.controls.confidence.value === level"
                  (click)="form.controls.confidence.setValue(level)"
                >
                  {{ level }}
                </button>
              }
            </div>
          }
          <div class="grid gap-1 text-xs text-[var(--b0-muted)] sm:grid-cols-3">
            <span>1: Very low</span><span>5: Moderate</span><span>10: Very high</span>
          </div>
          <b0-form-field-error [control]="form.controls.confidence" label="Confidence" />
        </fieldset>

        @if (kind() === 'morning') {
          <mat-form-field>
            <mat-label>{{ goalLabel() }}</mat-label>
            <input matInput type="number" min="1" max="100" step="1" formControlName="goal" inputmode="numeric" />
            <mat-hint>Enter a whole number within your allowed daily target.</mat-hint>
            <b0-form-field-error [control]="form.controls.goal" label="Today’s capsule goal" />
          </mat-form-field>

          <fieldset class="grid gap-3">
            <legend class="text-sm font-bold text-[var(--b0-text)]">
              Do you need support? <span aria-hidden="true">*</span>
            </legend>
            <div class="flex flex-wrap gap-2" role="group" aria-label="Do you need support?">
              <button
                type="button"
                mat-stroked-button
                [color]="form.controls.needSupport.value === 'yes' ? 'primary' : undefined"
                (click)="setNeedSupport('yes')"
              >
                Yes
              </button>
              <button
                type="button"
                mat-stroked-button
                [color]="form.controls.needSupport.value === 'no' ? 'primary' : undefined"
                (click)="setNeedSupport('no')"
              >
                No
              </button>
            </div>
            <b0-form-field-error [control]="form.controls.needSupport" label="Support selection" />
          </fieldset>

          <mat-form-field>
            <mat-label>Biggest anticipated obstacle</mat-label>
            <textarea matInput maxlength="500" rows="4" formControlName="obstacle"></textarea>
            <mat-hint align="end">{{ form.controls.obstacle.value.length }}/500</mat-hint>
            <b0-form-field-error [control]="form.controls.obstacle" label="Biggest anticipated obstacle" />
          </mat-form-field>

          @if (form.controls.needSupport.value === 'yes') {
            <div class="grid gap-4 rounded-2xl border border-[var(--b0-border)] bg-[var(--b0-surface)] p-4">
              <h2 class="text-base font-bold">Support request details</h2>
              <mat-form-field>
                <mat-label>Support category</mat-label>
                <mat-select formControlName="supportCategory">
                  @for (category of supportCategories; track category) {
                    <mat-option [value]="category">{{ category }}</mat-option>
                  }
                </mat-select>
                <b0-form-field-error [control]="form.controls.supportCategory" label="Support category" />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Brief description</mat-label>
                <textarea matInput maxlength="500" rows="3" formControlName="supportDescription"></textarea>
                <mat-hint align="end">{{ form.controls.supportDescription.value.length }}/500</mat-hint>
                <b0-form-field-error [control]="form.controls.supportDescription" label="Brief description" />
              </mat-form-field>
            </div>
          }
        } @else {
          <fieldset class="grid gap-3">
            <legend class="text-sm font-bold text-[var(--b0-text)]">
              Did you meet today’s goal? <span aria-hidden="true">*</span>
            </legend>
            <div class="flex flex-wrap gap-2" role="group" aria-label="Did you meet today’s goal?">
              @for (outcome of goalOutcomes; track outcome) {
                <button
                  type="button"
                  mat-stroked-button
                  [color]="form.controls.goalMet.value === outcome ? 'primary' : undefined"
                  (click)="form.controls.goalMet.setValue(outcome)"
                >
                  {{ outcome }}
                </button>
              }
            </div>
            <b0-form-field-error [control]="form.controls.goalMet" label="Goal outcome" />
          </fieldset>

          <div class="grid gap-4 sm:grid-cols-2">
            <mat-form-field
              ><mat-label>Support given today</mat-label
              ><input
                matInput
                type="number"
                min="0"
                step="1"
                formControlName="supportGivenToday"
                inputmode="numeric"
              /><mat-hint>Optional count, if tracked socially.</mat-hint></mat-form-field
            >
            <mat-form-field
              ><mat-label>Support received today</mat-label
              ><input
                matInput
                type="number"
                min="0"
                step="1"
                formControlName="supportReceivedToday"
                inputmode="numeric"
              /><mat-hint>Optional count, if tracked socially.</mat-hint></mat-form-field
            >
          </div>

          <mat-form-field>
            <mat-label>Tomorrow’s goal</mat-label>
            <input matInput type="number" min="1" max="100" step="1" formControlName="goal" inputmode="numeric" />
            <b0-form-field-error [control]="form.controls.goal" label="Tomorrow’s goal" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>Reflection</mat-label>
            <textarea matInput maxlength="500" rows="4" formControlName="reflection"></textarea>
            <mat-hint align="end">{{ form.controls.reflection.value.length }}/500</mat-hint>
            <b0-form-field-error [control]="form.controls.reflection" label="Reflection" />
          </mat-form-field>
        }

        @if (message()) {
          <p
            class="rounded-2xl border border-[var(--b0-border)] bg-[var(--b0-surface)] p-3 text-sm font-bold"
            role="status"
          >
            {{ message() }}
          </p>
        }
        <div class="flex flex-wrap justify-end gap-3">
          @if (kind() === 'evening') {
            <a mat-stroked-button routerLink="/dashboard">Return to Dashboard</a>
          }
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || busy()">
            {{ busy() ? 'Submitting…' : submitLabel() }}
          </button>
        </div>
      </form>
    </mat-card>
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckInPage implements OnInit {
  kind = input<'morning' | 'evening'>('morning');
  #fb = inject(FormBuilder);
  #api = inject(CheckInsApiService);
  #toast = inject(ToastService);
  busy = signal(false);
  message = signal('');
  confidenceLevels = Array.from({ length: 10 }, (_, index) => index + 1);
  supportCategories = SUPPORT_CATEGORIES;
  goalOutcomes = GOAL_OUTCOMES;
  eveningSummary = signal<EveningSummary | null>(null);
  summaryError = signal('');
  description = computed(() =>
    this.kind() === 'morning'
      ? 'Set today’s capsule target, confidence signal, and support needs before studying.'
      : 'Review system-tracked progress, reflect on today, and set tomorrow’s target.',
  );
  goalLabel = computed(() => (this.kind() === 'morning' ? 'Today’s capsule goal' : 'Tomorrow’s goal'));
  submitLabel = computed(() => (this.kind() === 'morning' ? 'Submit Morning Check-In' : 'Complete Evening Check-In'));
  eveningMetrics = computed(() => {
    const summary = this.eveningSummary();
    return [
      { label: 'Capsules completed today', value: summary?.capsulesCompletedToday ?? '—' },
      { label: 'Questions completed today', value: summary?.questionsCompletedToday ?? '—' },
      { label: 'Study time recorded', value: this.formatStudyTime(summary?.studyTimeRecordedMinutes) },
      { label: 'Questions marked for review', value: summary?.questionsMarkedForReview ?? '—' },
    ];
  });
  form = this.#fb.nonNullable.group({
    confidence: [5, confidenceValidators],
    goal: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
    needSupport: ['', Validators.required],
    obstacle: ['', noteValidators],
    supportCategory: [''],
    supportDescription: ['', noteValidators],
    goalMet: ['', Validators.required],
    supportGivenToday: [0, [Validators.min(0), Validators.max(100)]],
    supportReceivedToday: [0, [Validators.min(0), Validators.max(100)]],
    reflection: ['', noteValidators],
  });

  ngOnInit() {
    if (this.kind() === 'evening') {
      this.form.controls.needSupport.clearValidators();
      this.form.controls.needSupport.updateValueAndValidity();
      this.#api.getEveningSummary<EveningSummary>().subscribe({
        next: (summary) => this.eveningSummary.set(summary),
        error: () =>
          this.summaryError.set('Could not load tracked progress yet. You can still submit your reflection.'),
      });
    } else {
      this.form.controls.goalMet.clearValidators();
      this.form.controls.goalMet.updateValueAndValidity();
    }
  }

  setNeedSupport(value: 'yes' | 'no') {
    this.form.controls.needSupport.setValue(value);
    if (value === 'yes') {
      this.form.controls.supportCategory.addValidators(Validators.required);
    } else {
      this.form.controls.supportCategory.clearValidators();
      this.form.controls.supportCategory.setValue('');
      this.form.controls.supportDescription.setValue('');
    }
    this.form.controls.supportCategory.updateValueAndValidity();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload = {
      kind: this.kind(),
      confidence: value.confidence,
      goal: value.goal,
      ...(this.kind() === 'morning'
        ? {
            needSupport: value.needSupport === 'yes',
            obstacle: value.obstacle,
            supportCategory: value.needSupport === 'yes' ? value.supportCategory : null,
            supportDescription: value.needSupport === 'yes' ? value.supportDescription : '',
          }
        : {
            goalMet: value.goalMet,
            supportGivenToday: value.supportGivenToday,
            supportReceivedToday: value.supportReceivedToday,
            reflection: value.reflection,
          }),
    };
    this.busy.set(true);
    this.message.set('');
    const request = this.kind() === 'morning' ? this.#api.createMorning(payload) : this.#api.createEvening(payload);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        const successMessage =
          this.kind() === 'morning'
            ? 'Morning check-in complete. Your study plan is ready.'
            : 'Evening check-in complete. See you tomorrow.';
        this.message.set(successMessage);
        this.#toast.success(successMessage);
      },
      error: () => {
        this.busy.set(false);
        this.message.set('Could not submit yet. Confirm the API is available and try again.');
        this.#toast.error('Could not submit check-in.');
      },
    });
  }

  private formatStudyTime(minutes: number | undefined) {
    if (minutes === undefined) {
      return '—';
    }
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
  }
}
