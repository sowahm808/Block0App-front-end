import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { confidenceValidators, noteValidators } from '../../../shared/validators/check-in.validators';
import { CheckInsApiService } from '../../../core/api/feature-api.services';
import { ToastService } from '../../../core/feedback/toast.service';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { FormFieldErrorComponent } from '../../../shared/ui/form-field-error/form-field-error.component';
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    PageHeaderComponent,
    FormFieldErrorComponent,
  ],
  template: `<section class="grid max-w-3xl gap-5">
    <b0-page-header
      [title]="(kind() === 'morning' ? 'Morning' : 'Evening') + ' check-in'"
      [description]="'Share only the progress signals needed to support your plan.'"
      eyebrow="Daily habit"
    />
    <mat-card class="p-4 sm:p-6">
      <form [formGroup]="form" class="grid gap-4 sm:grid-cols-2" (ngSubmit)="submit()" novalidate>
        <mat-form-field
          ><mat-label>Confidence 1–10</mat-label
          ><input matInput type="number" min="1" max="10" formControlName="confidence" inputmode="numeric" /><mat-hint
            >How prepared do you feel?</mat-hint
          ><b0-form-field-error [control]="form.controls.confidence" label="Confidence"
        /></mat-form-field>
        <mat-form-field
          ><mat-label>{{ goalLabel() }}</mat-label
          ><input
            matInput
            type="number"
            min="0"
            max="100"
            formControlName="goal"
            inputmode="numeric" /><b0-form-field-error [control]="form.controls.goal" label="Goal"
        /></mat-form-field>
        <mat-slide-toggle class="sm:col-span-2" formControlName="needSupport"
          >Need support from my team</mat-slide-toggle
        >
        <mat-form-field class="sm:col-span-2"
          ><mat-label>Notes</mat-label><textarea matInput maxlength="500" rows="4" formControlName="note"></textarea
          ><mat-hint align="end">{{ form.controls.note.value.length }}/500</mat-hint
          ><b0-form-field-error [control]="form.controls.note" label="Notes"
        /></mat-form-field>
        @if (message()) {
          <p
            class="sm:col-span-2 rounded-2xl border border-[var(--b0-border)] bg-[var(--b0-surface)] p-3 text-sm font-bold"
            role="status"
          >
            {{ message() }}
          </p>
        }
        <div class="sm:col-span-2 flex justify-end">
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || busy()">
            {{ busy() ? 'Submitting…' : 'Submit check-in' }}
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
  goalLabel = computed(() => (this.kind() === 'morning' ? 'Today’s capsule goal' : 'Tomorrow’s goal'));
  form = this.#fb.nonNullable.group({
    confidence: [5, confidenceValidators],
    goal: [1, [Validators.required, Validators.min(0), Validators.max(100)]],
    needSupport: [false],
    note: ['', noteValidators],
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.message.set('');
    this.#api.create({ kind: this.kind(), ...this.form.getRawValue() }).subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set('Check-in submitted.');
        this.#toast.success('Check-in submitted.');
      },
      error: () => {
        this.busy.set(false);
        this.message.set('Could not submit yet. Confirm the API is available and try again.');
        this.#toast.error('Could not submit check-in.');
      },
    });
  }
}
