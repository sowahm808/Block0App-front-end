import { AsyncPipe, DatePipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, combineLatest, map, of, startWith, switchMap, tap } from 'rxjs';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { PreferredStudyTime, PrimaryDevice, ProfileDto, ProfileService } from './profile.service';

interface ApiState<T> {
  status: 'loading' | 'loaded' | 'error';
  data?: T;
  message?: string;
}

const TIME_ZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Africa/Lagos',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Manila',
  'Australia/Sydney',
];

@Component({
  selector: 'b0-profile',
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgOptimizedImage, ReactiveFormsModule, PageHeaderComponent, LoadingSkeletonComponent, ErrorStateComponent],
  template: `
    <b0-page-header title="Profile" description="Manage your account identity and study preferences." />

    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="6" />
      } @else if (state.status === 'error') {
        <b0-error-state [message]="state.message || 'Unable to load profile.'" (retry)="reload()" />
      } @else if (state.status === 'loaded' && state.data; as profile) {
        <section class="profile-card" aria-labelledby="profile-title">
          <div class="profile-header">
            <div class="avatar" aria-hidden="true">
              @if (avatarPreview() || profile.avatarUrl) {
                <img [ngSrc]="avatarPreview() || profile.avatarUrl || ''" width="112" height="112" alt="" />
              } @else {
                <span>{{ initials(profile.displayName) }}</span>
              }
            </div>
            <div>
              <p class="eyebrow">Profile header</p>
              <h2 id="profile-title">{{ profile.displayName }}</h2>
              <p>{{ profile.email }}</p>
              <div class="chips">
                <span>{{ profile.scholarRole }}</span>
                <span>{{ profile.activeCohort || 'No active cohort' }}</span>
              </div>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="save(profile)" class="profile-grid">
            <div class="panel">
              <h3>Editable fields</h3>
              <label>
                Display name
                <input type="text" formControlName="displayName" [readonly]="!editing()" />
              </label>
              <label>
                Profile image
                <input type="file" accept="image/png,image/jpeg,image/webp" [disabled]="!editing()" (change)="selectImage($event)" />
              </label>
              <label>
                Time zone
                <input type="search" list="time-zones" formControlName="timeZone" [readonly]="!editing()" />
                <datalist id="time-zones">
                  @for (zone of timeZones; track zone) { <option [value]="zone"></option> }
                </datalist>
              </label>
              <label>
                Preferred study time
                <select formControlName="preferredStudyTime">
                  <option [ngValue]="null">Select a time</option>
                  @for (option of studyTimes; track option.value) { <option [ngValue]="option.value">{{ option.label }}</option> }
                </select>
              </label>
              <label>
                Primary device
                <select formControlName="primaryDevice">
                  <option [ngValue]="null">Select a device</option>
                  @for (option of devices; track option.value) { <option [ngValue]="option.value">{{ option.label }}</option> }
                </select>
              </label>
            </div>

            <div class="panel read-only">
              <h3>Read-only fields</h3>
              <dl>
                <div><dt>Email</dt><dd>{{ profile.email }}</dd></div>
                <div><dt>Firebase account provider</dt><dd>{{ profile.firebaseProvider }}</dd></div>
                <div><dt>Scholar role</dt><dd>{{ profile.scholarRole }}</dd></div>
                <div><dt>Active cohort</dt><dd>{{ profile.activeCohort || 'None assigned' }}</dd></div>
                <div><dt>Enrollment date</dt><dd>{{ profile.enrollmentDate ? (profile.enrollmentDate | date: 'mediumDate') : 'Not enrolled' }}</dd></div>
              </dl>
            </div>

            <div class="actions">
              @if (!editing()) {
                <button type="button" class="primary" (click)="edit(profile)">Edit Profile</button>
              } @else {
                <button type="submit" class="primary" [disabled]="form.invalid || saving()">{{ saving() ? 'Saving…' : 'Save Changes' }}</button>
                <button type="button" (click)="cancel(profile)" [disabled]="saving()">Cancel</button>
              }
            </div>
          </form>
        </section>
      }
    }
  `,
  styles: [`
    .profile-card { border: 1px solid var(--b0-border); border-radius: var(--b0-radius-xl); background: var(--b0-surface); box-shadow: var(--b0-shadow-sm); padding: clamp(1rem, 3vw, 2rem); }
    .profile-header { display: flex; gap: 1.25rem; align-items: center; margin-bottom: 1.5rem; }
    .avatar { display: grid; place-items: center; width: 7rem; height: 7rem; border-radius: 2rem; overflow: hidden; background: linear-gradient(135deg, var(--b0-primary), var(--b0-secondary)); color: white; font-size: 2rem; font-weight: 800; flex: 0 0 auto; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .eyebrow { margin: 0; color: var(--b0-primary); font-weight: 800; text-transform: uppercase; letter-spacing: .08em; font-size: .75rem; }
    h2, h3 { margin: .25rem 0 .75rem; }
    .chips { display: flex; flex-wrap: wrap; gap: .5rem; }
    .chips span { border: 1px solid var(--b0-border); border-radius: 999px; padding: .35rem .7rem; color: var(--b0-text-muted); }
    .profile-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(18rem, .7fr); gap: 1rem; }
    .panel { border: 1px solid var(--b0-border); border-radius: var(--b0-radius-lg); padding: 1rem; background: var(--b0-bg-elevated); }
    label { display: grid; gap: .35rem; margin-top: .85rem; font-weight: 700; }
    input, select { width: 100%; min-height: 44px; border: 1px solid var(--b0-border); border-radius: .85rem; padding: .65rem .8rem; background: var(--b0-surface-strong); color: var(--b0-text); }
    input[readonly], select:disabled { color: var(--b0-text-muted); }
    dl { display: grid; gap: .85rem; margin: 0; }
    dt { color: var(--b0-text-muted); font-size: .85rem; } dd { margin: .2rem 0 0; font-weight: 800; }
    .actions { grid-column: 1 / -1; display: flex; gap: .75rem; justify-content: flex-end; }
    button { border: 1px solid var(--b0-border); border-radius: 999px; padding: .75rem 1.1rem; background: var(--b0-surface-strong); color: var(--b0-text); font-weight: 800; cursor: pointer; }
    button.primary { background: var(--b0-primary); border-color: var(--b0-primary); color: white; }
    button:disabled { opacity: .65; cursor: not-allowed; }
    @media (max-width: 760px) { .profile-header, .profile-grid { grid-template-columns: 1fr; } .profile-header { align-items: flex-start; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  #service = inject(ProfileService);
  #fb = inject(FormBuilder);
  #reload = new BehaviorSubject<void>(undefined);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly avatarPreview = signal<string | null>(null);
  #selectedImage: File | null = null;

  readonly timeZones = TIME_ZONES;
  readonly studyTimes: Array<{ label: string; value: PreferredStudyTime }> = [
    { label: 'Early morning', value: 'EarlyMorning' },
    { label: 'Morning', value: 'Morning' },
    { label: 'Afternoon', value: 'Afternoon' },
    { label: 'Evening', value: 'Evening' },
    { label: 'Late night', value: 'LateNight' },
  ];
  readonly devices: Array<{ label: string; value: PrimaryDevice }> = [
    { label: 'Laptop / desktop', value: 'LaptopDesktop' },
    { label: 'Tablet', value: 'Tablet' },
    { label: 'Phone', value: 'Phone' },
  ];

  readonly form = this.#fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(120)]],
    timeZone: ['UTC', [Validators.required]],
    preferredStudyTime: this.#fb.control<PreferredStudyTime | null>(null),
    primaryDevice: this.#fb.control<PrimaryDevice | null>(null),
  });

  readonly state$ = this.#reload.pipe(
    switchMap(() => this.#service.getProfile().pipe(
      tap((profile) => this.resetForm(profile)),
      map((profile) => ({ status: 'loaded', data: profile }) satisfies ApiState<ProfileDto>),
      startWith({ status: 'loading' } satisfies ApiState<ProfileDto>),
      catchError((error: unknown) => of({ status: 'error', message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.' } satisfies ApiState<ProfileDto>)),
    )),
  );

  constructor() {
    this.form.disable({ emitEvent: false });
  }

  initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'B0';
  }

  edit(profile: ProfileDto): void {
    this.resetForm(profile);
    this.editing.set(true);
    this.form.enable({ emitEvent: false });
  }

  cancel(profile: ProfileDto): void {
    this.resetForm(profile);
    this.editing.set(false);
    this.form.disable({ emitEvent: false });
    this.avatarPreview.set(null);
    this.#selectedImage = null;
  }

  selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.#selectedImage = file;
    this.avatarPreview.set(file ? URL.createObjectURL(file) : null);
  }

  save(profile: ProfileDto): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const payload = this.form.getRawValue();
    const update$ = this.#service.updateProfile(payload);
    const image$ = this.#selectedImage ? this.#service.uploadProfileImage(this.#selectedImage) : of(profile);
    combineLatest([update$, image$]).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.form.disable({ emitEvent: false });
        this.avatarPreview.set(null);
        this.#selectedImage = null;
        this.reload();
      },
      error: () => this.saving.set(false),
    });
  }

  reload(): void {
    this.#reload.next();
  }

  private resetForm(profile: ProfileDto): void {
    this.form.reset({
      displayName: profile.displayName,
      timeZone: profile.timeZone || 'UTC',
      preferredStudyTime: profile.preferredStudyTime ?? null,
      primaryDevice: profile.primaryDevice ?? null,
    }, { emitEvent: false });
  }
}
