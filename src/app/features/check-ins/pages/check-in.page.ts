import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { confidenceValidators, noteValidators } from '../../../shared/validators/check-in.validators';
import { CheckInsApiService } from '../../../core/api/feature-api.services';
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  template: `<mat-card class="max-w-2xl"
    ><h1>{{ kind() === 'morning' ? 'Morning' : 'Evening' }} check-in</h1>
    <form [formGroup]="form" class="grid gap-3" (ngSubmit)="submit()">
      <mat-form-field
        ><mat-label>Confidence 1–10</mat-label
        ><input matInput type="number" formControlName="confidence" /></mat-form-field
      ><mat-form-field
        ><mat-label>{{ goalLabel() }}</mat-label
        ><input matInput type="number" formControlName="goal" /></mat-form-field
      ><mat-slide-toggle formControlName="needSupport">Need support</mat-slide-toggle
      ><mat-form-field
        ><mat-label>Notes</mat-label><textarea matInput maxlength="500" formControlName="note"></textarea>
      </mat-form-field>
      @if (message()) {
        <p class="rounded-2xl bg-indigo-50 p-3 text-sm font-bold text-indigo-700" role="status">{{ message() }}</p>
      }
      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || busy()">
        {{ busy() ? 'Submitting…' : 'Submit check-in' }}
      </button>
    </form></mat-card
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckInPage {
  kind = input<'morning' | 'evening'>('morning');
  #fb = inject(FormBuilder);
  #api = inject(CheckInsApiService);
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
      },
      error: () => {
        this.busy.set(false);
        this.message.set('Could not submit yet. Confirm the API is available and try again.');
      },
    });
  }
}
