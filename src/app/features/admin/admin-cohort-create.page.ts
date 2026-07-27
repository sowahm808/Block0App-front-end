import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { AdminChallenge } from '../../core/api/api.types';
import { AdminChallengeApiService, AdminCohortApiService } from '../../core/api/remaining-feature-api.services';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'b0-admin-cohort-create',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  template: ` <b0-page-header title="Create cohort" description="Set up a cohort and assign it to a challenge." />
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="grid">
        <mat-form-field
          ><mat-label>Cohort name</mat-label><input matInput formControlName="name" />
          @if (form.controls.name.touched && form.controls.name.invalid) {
            <mat-error>Name is required.</mat-error>
          }
        </mat-form-field>
        <mat-form-field
          ><mat-label>Challenge</mat-label
          ><mat-select formControlName="challengeId">
            @for (c of challenges(); track c.id) {
              <mat-option [value]="c.id">{{ c.title }}</mat-option>
            }</mat-select
          ><mat-error>Challenge is required.</mat-error></mat-form-field
        >
        <mat-form-field class="wide"
          ><mat-label>Description</mat-label><textarea matInput formControlName="description"></textarea>
        </mat-form-field>
        <mat-form-field
          ><mat-label>Capacity</mat-label><input matInput type="number" formControlName="capacity" min="1" /><mat-error
            >Capacity must be positive.</mat-error
          ></mat-form-field
        >
        <mat-form-field
          ><mat-label>Timezone</mat-label><input matInput formControlName="timezone" placeholder="UTC"
        /></mat-form-field>
        <mat-form-field
          ><mat-label>Start date</mat-label><input matInput type="date" formControlName="startsAtUtc" /></mat-form-field
        ><mat-form-field
          ><mat-label>End date</mat-label><input matInput type="date" formControlName="endsAtUtc"
        /></mat-form-field>
        <mat-form-field
          ><mat-label>Enrollment opens</mat-label
          ><input matInput type="date" formControlName="enrollmentOpensAtUtc" /></mat-form-field
        ><mat-form-field
          ><mat-label>Enrollment closes</mat-label><input matInput type="date" formControlName="enrollmentClosesAtUtc"
        /></mat-form-field>
        <mat-form-field
          ><mat-label>Initial status</mat-label
          ><mat-select formControlName="status">
            @for (s of statuses; track s) {
              <mat-option [value]="s">{{ s }}</mat-option>
            }
          </mat-select></mat-form-field
        >
      </div>
      @if (dateError()) {
        <p role="alert" class="error">{{ dateError() }}</p>
      }
      @if (error()) {
        <p role="alert" class="error">{{ error() }}</p>
      }
      <div class="actions">
        <a mat-button routerLink="/admin/cohorts">Cancel</a
        ><button mat-flat-button color="primary" [disabled]="saving()">
          {{ saving() ? 'Creating…' : 'Create cohort' }}
        </button>
      </div>
    </form>`,
  styles: [
    `
      form {
        max-width: 900px;
        background: #fff;
        border: 1px solid #dbe3ec;
        border-radius: 12px;
        padding: 1.5rem;
        margin-top: 1rem;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .wide {
        grid-column: 1/-1;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      .error {
        color: #a61b1b;
      }
      @media (max-width: 650px) {
        .grid {
          grid-template-columns: 1fr;
        }
        .wide {
          grid-column: auto;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCohortCreatePage {
  readonly #fb = inject(FormBuilder);
  readonly #api = inject(AdminCohortApiService);
  readonly #challenges = inject(AdminChallengeApiService);
  readonly #router = inject(Router);
  readonly challenges = signal<AdminChallenge[]>([]);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly dateError = signal('');
  readonly statuses = ['draft', 'upcoming', 'enrollment_open'];
  readonly form = this.#fb.group({
    name: ['', Validators.required],
    description: [''],
    challengeId: ['', Validators.required],
    capacity: [null as number | null, Validators.min(1)],
    timezone: ['UTC', Validators.required],
    startsAtUtc: [''],
    endsAtUtc: [''],
    enrollmentOpensAtUtc: [''],
    enrollmentClosesAtUtc: [''],
    status: ['draft', Validators.required],
  });
  constructor() {
    this.#challenges
      .challenges()
      .subscribe((r) => this.challenges.set(Array.isArray(r) ? r : (r.items ?? r.data ?? [])));
  }
  submit() {
    this.form.markAllAsTouched();
    this.dateError.set('');
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (v.startsAtUtc && v.endsAtUtc && v.startsAtUtc >= v.endsAtUtc) {
      this.dateError.set('Start date must be before end date.');
      return;
    }
    if (v.enrollmentOpensAtUtc && v.enrollmentClosesAtUtc && v.enrollmentOpensAtUtc >= v.enrollmentClosesAtUtc) {
      this.dateError.set('Enrollment opening must be before closing.');
      return;
    }
    if (v.enrollmentClosesAtUtc && v.startsAtUtc && v.enrollmentClosesAtUtc > v.startsAtUtc) {
      this.dateError.set('Enrollment must close no later than the cohort start date.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.#api
      .create({
        ...v,
        name: v.name!,
        challengeId: v.challengeId!,
        description: v.description || undefined,
        capacity: v.capacity || undefined,
        startsAtUtc: v.startsAtUtc || null,
        endsAtUtc: v.endsAtUtc || null,
        enrollmentOpensAtUtc: v.enrollmentOpensAtUtc || null,
        enrollmentClosesAtUtc: v.enrollmentClosesAtUtc || null,
        timezone: v.timezone || 'UTC',
        status: v.status || 'draft',
      })
      .subscribe({
        next: (c) => void this.#router.navigate(['/admin/cohorts', c.id]),
        error: (e) => {
          this.saving.set(false);
          this.error.set(
            e?.status === 409
              ? 'A cohort with this name already exists for the challenge.'
              : 'Unable to create cohort.',
          );
        },
      });
  }
}
