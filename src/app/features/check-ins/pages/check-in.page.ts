import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { confidenceValidators, noteValidators } from '../../../shared/validators/check-in.validators';
import { CheckInsApiService } from '../../../core/api/feature-api.services';
import { ToastService } from '../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { FormFieldErrorComponent } from '../../../shared/ui/form-field-error/form-field-error.component';

const SUPPORT_CATEGORIES = ['Academic', 'Technical', 'Time management', 'Motivation', 'Personal', 'Other'] as const;

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    FormFieldErrorComponent,
  ],
  template: `<section class="grid max-w-3xl gap-5">
    <b0-page-header
      [title]="kind() === 'morning' ? 'Morning Check-In' : 'Evening Check-In'"
      [description]="description()"
      eyebrow="Daily habit"
    />
    <mat-card class="p-4 sm:p-6">
      <form [formGroup]="form" class="grid gap-5" (ngSubmit)="submit()" novalidate>
        <fieldset class="grid gap-3">
          <legend class="text-sm font-bold text-[var(--b0-text)]">
            Confidence level <span aria-hidden="true">*</span>
          </legend>
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
          <div class="grid gap-1 text-xs text-[var(--b0-muted)] sm:grid-cols-3">
            <span>1: Very low</span><span>5: Moderate</span><span>10: Very high</span>
          </div>
          <b0-form-field-error [control]="form.controls.confidence" label="Confidence" />
        </fieldset>

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

        @if (message()) {
          <p
            class="rounded-2xl border border-[var(--b0-border)] bg-[var(--b0-surface)] p-3 text-sm font-bold"
            role="status"
          >
            {{ message() }}
          </p>
        }
        <div class="flex justify-end">
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || busy()">
            {{ busy() ? 'Submitting…' : submitLabel() }}
          </button>
        </div>
      </form>
    </mat-card>
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckInPage {
  kind = input<'morning' | 'evening'>('morning');
  #fb = inject(FormBuilder);
  #api = inject(CheckInsApiService);
  #toast = inject(ToastService);
  busy = signal(false);
  message = signal('');
  confidenceLevels = Array.from({ length: 10 }, (_, index) => index + 1);
  supportCategories = SUPPORT_CATEGORIES;
  description = computed(() =>
    this.kind() === 'morning'
      ? 'Set today’s capsule target, confidence signal, and support needs before studying.'
      : 'Share only the progress signals needed to support your plan.',
  );
  goalLabel = computed(() => (this.kind() === 'morning' ? 'Today’s capsule goal' : 'Tomorrow’s goal'));
  submitLabel = computed(() => (this.kind() === 'morning' ? 'Submit Morning Check-In' : 'Submit check-in'));
  form = this.#fb.nonNullable.group({
    confidence: [5, confidenceValidators],
    goal: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
    needSupport: ['', Validators.required],
    obstacle: ['', noteValidators],
    supportCategory: [''],
    supportDescription: ['', noteValidators],
  });

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
      needSupport: value.needSupport === 'yes',
      obstacle: value.obstacle,
      supportCategory: value.needSupport === 'yes' ? value.supportCategory : null,
      supportDescription: value.needSupport === 'yes' ? value.supportDescription : '',
    };
    this.busy.set(true);
    this.message.set('');
    const request = this.kind() === 'morning' ? this.#api.createMorning(payload) : this.#api.create(payload);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        const successMessage =
          this.kind() === 'morning' ? 'Morning check-in complete. Your study plan is ready.' : 'Check-in submitted.';
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
}
