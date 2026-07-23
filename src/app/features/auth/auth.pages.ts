import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/auth/auth.service';
import { DefaultLandingService } from '../../core/routing/default-landing.service';

// ============================================================
// Login
// ============================================================

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <main class="auth-shell auth-shell--login">
      <section class="auth-hero-panel" aria-label="Block0 learning benefits">
        <p class="auth-kicker">Focused board prep</p>
        <h1>Practice with calm, clinical confidence.</h1>
        <p>Continue your guided learning plan, review high-yield insights, and stay aligned with your support team.</p>

        <div class="auth-stat-grid" aria-label="Login highlights">
          <div>
            <strong>Daily</strong>
            <span>capsule goals</span>
          </div>
          <div>
            <strong>Smart</strong>
            <span>readiness signals</span>
          </div>
        </div>
      </section>

      <mat-card class="auth-card auth-card--elevated">
        <mat-card-header>
          <mat-card-title>Welcome back</mat-card-title>
          <mat-card-subtitle>Sign in to continue your guided practice.</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form" novalidate>
            @if (successMessage()) {
              <p class="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700" role="status">
                {{ successMessage() }}
              </p>
            }

            @if (errorMessage()) {
              <p class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                {{ errorMessage() }}
              </p>
            }

            <button
              class="google-sign-in-button"
              type="button"
              [disabled]="busy()"
              (click)="signInWithGoogle()"
              aria-label="Sign in with Google"
            >
              <span class="google-mark" aria-hidden="true">G</span>
              <span>{{ busy() ? 'Connecting…' : 'Continue with Google' }}</span>
            </button>

            <div class="auth-divider"><span>or sign in with email</span></div>

            <mat-form-field>
              <mat-label>Email</mat-label>

              <input matInput type="email" formControlName="email" autocomplete="email" />

              @if (form.controls.email.touched && form.controls.email.hasError('required')) {
                <mat-error>Email is required.</mat-error>
              } @else if (form.controls.email.touched && form.controls.email.hasError('email')) {
                <mat-error>Enter a valid email address.</mat-error>
              }
            </mat-form-field>

            <mat-form-field>
              <mat-label>Password</mat-label>

              <input
                matInput
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="current-password"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="togglePassword()"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
              >
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>

              @if (form.controls.password.touched && form.controls.password.hasError('required')) {
                <mat-error>Password is required.</mat-error>
              }
            </mat-form-field>

            <button
              class="auth-primary-action"
              mat-raised-button
              color="primary"
              type="submit"
              [disabled]="form.invalid || busy()"
            >
              @if (busy()) {
                <mat-progress-spinner mode="indeterminate" diameter="18" />
              }
              {{ busy() ? 'Signing in…' : 'Login' }}
            </button>

            @if (emailVerificationRequired()) {
              <p class="text-sm">Check your inbox and spam folder for the verification email.</p>
            }

            <div class="auth-links">
              <a routerLink="/forgot-password">Forgot password?</a>
              <a routerLink="/register">Create account</a>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  readonly #fb = inject(FormBuilder);
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #landing = inject(DefaultLandingService);

  readonly busy = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly emailVerificationRequired = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.#fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    const registered = this.#route.snapshot.queryParamMap.get('registered');

    const email = this.#route.snapshot.queryParamMap.get('email');

    if (email) {
      this.form.controls.email.setValue(email);
    }

    if (registered === 'true') {
      this.successMessage.set(
        'Your account was created. Check your inbox and spam folder, verify your email, then sign in.',
      );
    }
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  signInWithGoogle(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.emailVerificationRequired.set(false);
    this.busy.set(true);

    this.#auth.loginWithGoogle().subscribe({
      next: () => {
        this.busy.set(false);
        void this.#router.navigateByUrl(this.#landing.defaultRoute());
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.errorMessage.set(buildGoogleLoginErrorMessage(error));
      },
    });
  }

  submit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.emailVerificationRequired.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);

    const { email, password } = this.form.getRawValue();

    this.#auth
      .login({
        email: email.trim().toLowerCase(),
        password,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          void this.#router.navigateByUrl(this.#landing.defaultRoute());
        },

        error: (error: unknown) => {
          this.busy.set(false);

          const result = buildLoginErrorMessage(error);

          this.errorMessage.set(result.message);
          this.emailVerificationRequired.set(result.emailVerificationRequired);
        },
      });
  }
}

function buildGoogleLoginErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return buildLoginErrorMessage(error).message;
  }

  if (error instanceof Error && error.message) {
    return error.message.includes('popup')
      ? 'Google sign in was not completed. Please try again or use email and password.'
      : error.message;
  }

  return 'Google sign in was not completed. Please try again or use email and password.';
}

const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
] as const;

const PRIMARY_STUDY_DEVICES = ['phone', 'tablet', 'laptop', 'desktop'] as const;

const SUPPORTED_TIME_ZONES = Intl.supportedValuesOf('timeZone');

const supportedCountryValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  SUPPORTED_COUNTRIES.some((country) => country.code === control.value) ? null : { supportedCountry: true };

const studyDeviceValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  !control.value || PRIMARY_STUDY_DEVICES.includes(control.value) ? null : { studyDevice: true };

const ianaTimeZoneValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  SUPPORTED_TIME_ZONES.includes(control.value) ? null : { ianaTimeZone: true };

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword');

  if (!confirmPassword || password === confirmPassword.value) {
    confirmPassword?.setErrors(removePasswordMismatch(confirmPassword.errors));
    return null;
  }

  confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
  return { passwordMismatch: true };
};

function removePasswordMismatch(errors: ValidationErrors | null): ValidationErrors | null {
  if (!errors?.['passwordMismatch']) {
    return errors;
  }

  const { passwordMismatch: _passwordMismatch, ...remainingErrors } = errors;
  return Object.keys(remainingErrors).length ? remainingErrors : null;
}

// ============================================================
// Registration
// ============================================================

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <main class="auth-shell">
      <mat-card class="auth-card"
        ><mat-card-header
          ><mat-card-title>Create your account</mat-card-title
          ><mat-card-subtitle>Use your learning email and a strong password.</mat-card-subtitle></mat-card-header
        >

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-3" novalidate>
            @if (errorMessage()) {
              <p class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                {{ errorMessage() }}
              </p>
            }

            <mat-form-field>
              <mat-label>Full name</mat-label>

              <input matInput formControlName="displayName" autocomplete="name" />

              @if (
                form.controls.displayName.touched &&
                (form.controls.displayName.hasError('required') ||
                  form.controls.displayName.hasError('minlength') ||
                  form.controls.displayName.hasError('maxlength'))
              ) {
                <mat-error>Full name must be 2–100 characters.</mat-error>
              }
            </mat-form-field>

            <mat-form-field>
              <mat-label>Email</mat-label>

              <input matInput type="email" formControlName="email" autocomplete="email" />

              @if (form.controls.email.touched && form.controls.email.hasError('required')) {
                <mat-error>Email is required.</mat-error>
              } @else if (form.controls.email.touched && form.controls.email.hasError('email')) {
                <mat-error>Enter a valid email address.</mat-error>
              }
            </mat-form-field>

            <mat-form-field>
              <mat-label>Password</mat-label>

              <input
                matInput
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="new-password"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="togglePassword()"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
              >
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>

              <mat-hint>Use at least 8 characters.</mat-hint>

              @if (form.controls.password.touched && form.controls.password.hasError('required')) {
                <mat-error>Password is required.</mat-error>
              } @else if (form.controls.password.touched && form.controls.password.hasError('minlength')) {
                <mat-error> Password must be at least 8 characters. </mat-error>
              }
            </mat-form-field>

            <mat-form-field>
              <mat-label>Confirm password</mat-label>

              <input
                matInput
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                autocomplete="new-password"
              />

              @if (form.controls.confirmPassword.touched && form.controls.confirmPassword.hasError('required')) {
                <mat-error>Confirm your password.</mat-error>
              } @else if (
                form.controls.confirmPassword.touched && form.controls.confirmPassword.hasError('passwordMismatch')
              ) {
                <mat-error>Passwords must match.</mat-error>
              }
            </mat-form-field>

            <mat-form-field>
              <mat-label>Country</mat-label>

              <mat-select formControlName="country">
                @for (country of supportedCountries; track country.code) {
                  <mat-option [value]="country.code">{{ country.name }}</mat-option>
                }
              </mat-select>

              @if (form.controls.country.touched && form.controls.country.hasError('required')) {
                <mat-error>Country is required.</mat-error>
              } @else if (form.controls.country.touched && form.controls.country.hasError('supportedCountry')) {
                <mat-error>Select a supported country.</mat-error>
              }
            </mat-form-field>

            <mat-form-field>
              <mat-label>Time zone</mat-label>

              <input matInput formControlName="timeZone" [matAutocomplete]="timeZoneOptions" autocomplete="off" />
              <mat-autocomplete #timeZoneOptions="matAutocomplete">
                @for (timeZone of filteredTimeZones(); track timeZone) {
                  <mat-option [value]="timeZone">{{ timeZone }}</mat-option>
                }
              </mat-autocomplete>

              <mat-hint>Start typing an IANA time zone, for example America/New_York.</mat-hint>

              @if (form.controls.timeZone.touched && form.controls.timeZone.hasError('required')) {
                <mat-error>Time zone is required.</mat-error>
              } @else if (form.controls.timeZone.touched && form.controls.timeZone.hasError('ianaTimeZone')) {
                <mat-error>Select a valid IANA time zone.</mat-error>
              }
            </mat-form-field>

            <mat-form-field>
              <mat-label>Primary study device</mat-label>

              <mat-select formControlName="primaryStudyDevice">
                <mat-option value="">No preference</mat-option>
                @for (device of primaryStudyDevices; track device) {
                  <mat-option [value]="device">{{ device }}</mat-option>
                }
              </mat-select>

              @if (
                form.controls.primaryStudyDevice.touched && form.controls.primaryStudyDevice.hasError('studyDevice')
              ) {
                <mat-error>Select phone, tablet, laptop, or desktop.</mat-error>
              }
            </mat-form-field>

            <mat-checkbox formControlName="acceptedTerms">I accept the terms of service.</mat-checkbox>
            @if (form.controls.acceptedTerms.touched && form.controls.acceptedTerms.hasError('required')) {
              <mat-error>Terms acceptance is required.</mat-error>
            }

            <mat-checkbox formControlName="acceptedPrivacyPolicy">I accept the privacy policy.</mat-checkbox>
            @if (
              form.controls.acceptedPrivacyPolicy.touched && form.controls.acceptedPrivacyPolicy.hasError('required')
            ) {
              <mat-error>Privacy policy acceptance is required.</mat-error>
            }

            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || busy()">
              {{ busy() ? 'Creating account…' : 'Create account' }}
            </button>

            <a routerLink="/login"> Already have an account? Sign in </a>
          </form>
        </mat-card-content>
      </mat-card>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  readonly #fb = inject(FormBuilder);
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);

  readonly busy = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);

  readonly supportedCountries = SUPPORTED_COUNTRIES;
  readonly primaryStudyDevices = PRIMARY_STUDY_DEVICES;

  readonly form = this.#fb.nonNullable.group(
    {
      displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      country: ['', [Validators.required, supportedCountryValidator]],
      timeZone: ['', [Validators.required, ianaTimeZoneValidator]],
      primaryStudyDevice: ['', studyDeviceValidator],
      acceptedTerms: [false, Validators.requiredTrue],
      acceptedPrivacyPolicy: [false, Validators.requiredTrue],
    },
    { validators: passwordMatchValidator },
  );

  readonly filteredTimeZones = () => {
    const query = this.form.controls.timeZone.value.trim().toLowerCase();
    return SUPPORTED_TIME_ZONES.filter((timeZone) => timeZone.toLowerCase().includes(query)).slice(0, 50);
  };

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  submit(): void {
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);

    const {
      displayName,
      email,
      password,
      country,
      timeZone,
      primaryStudyDevice,
      acceptedTerms,
      acceptedPrivacyPolicy,
    } = this.form.getRawValue();

    const normalizedEmail = email.trim().toLowerCase();

    this.#auth
      .register({
        displayName: displayName.trim(),
        email: normalizedEmail,
        password,
        country,
        timeZone,
        primaryStudyDevice: primaryStudyDevice || null,
        acceptedTerms,
        acceptedPrivacyPolicy,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);

          void this.#router.navigate(['/login'], {
            queryParams: {
              registered: 'true',
              email: normalizedEmail,
            },
          });
        },

        error: (error: unknown) => {
          this.busy.set(false);

          this.errorMessage.set(buildRegistrationErrorMessage(error));
        },
      });
  }
}

// ============================================================
// Simple authentication page
// ============================================================

@Component({
  standalone: true,
  template: `
    <h1>{{ title }}</h1>
    <p>Use the secure email flow from the backend to continue.</p>
  `,
})
export class SimpleAuthPage {
  readonly title = 'Account access';
}

// ============================================================
// Problem Details
// ============================================================

interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

interface LoginErrorResult {
  message: string;
  emailVerificationRequired: boolean;
}

// ============================================================
// Login error handling
// ============================================================

export function buildLoginErrorMessage(error: unknown): LoginErrorResult {
  const fallback: LoginErrorResult = {
    message: 'We could not sign you in. Check your email and password and try again.',
    emailVerificationRequired: false,
  };

  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const problem = error.error as ProblemDetails | null;

  const detail = problem?.detail?.trim();
  const title = problem?.title?.trim();

  const combinedMessage = `${detail ?? ''} ${title ?? ''}`.toLowerCase();

  const supportReference = problem?.traceId ? ` Reference: ${problem.traceId}.` : '';

  const requiresVerification =
    combinedMessage.includes('email verification') ||
    combinedMessage.includes('verify your email') ||
    combinedMessage.includes('email is not verified');

  if ((error.status === 401 || error.status === 403) && requiresVerification) {
    return {
      message:
        'Your email address has not been verified. Check your inbox and spam folder, verify your email, then sign in again.' +
        supportReference,
      emailVerificationRequired: true,
    };
  }

  if (error.status === 400) {
    return {
      message: detail || title || `The login request was invalid.${supportReference}`,
      emailVerificationRequired: false,
    };
  }

  if (error.status === 401) {
    return {
      message: `The email or password is incorrect.${supportReference}`,
      emailVerificationRequired: false,
    };
  }

  if (error.status === 403) {
    return {
      message: (detail || title || 'You do not have permission to access this account.') + supportReference,
      emailVerificationRequired: false,
    };
  }

  if (error.status === 429) {
    return {
      message: 'Too many login attempts. Wait a few minutes and try again.' + supportReference,
      emailVerificationRequired: false,
    };
  }

  if (error.status >= 500) {
    return {
      message: 'The login service is temporarily unavailable. Please try again in a few minutes.' + supportReference,
      emailVerificationRequired: false,
    };
  }

  return {
    message: (detail || title || fallback.message) + supportReference,
    emailVerificationRequired: false,
  };
}

// ============================================================
// Registration error handling
// ============================================================

export function buildRegistrationErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'We could not create your account. ' + 'Please check your details and try again.';
  }

  const problem = error.error as ProblemDetails | null;

  const validationError = problem?.errors ? Object.values(problem.errors).flat().find(Boolean) : undefined;

  const backendMessage = validationError ?? problem?.detail ?? problem?.title;

  const supportReference = problem?.traceId ? ` Reference: ${problem.traceId}.` : '';

  const normalizedMessage = backendMessage?.toLowerCase() ?? '';

  if (
    error.status === 409 ||
    normalizedMessage.includes('already exists') ||
    normalizedMessage.includes('email_exists')
  ) {
    return 'An account already exists with this email address. ' + 'Sign in or reset your password.' + supportReference;
  }

  if (error.status === 429) {
    return 'Too many registration attempts. ' + 'Wait a few minutes and try again.' + supportReference;
  }

  if (error.status >= 500) {
    return (
      'The registration service had a problem creating your account. ' +
      'Please try again in a few minutes or contact support.' +
      supportReference
    );
  }

  if (backendMessage) {
    return `${backendMessage}${supportReference}`;
  }

  return 'We could not create your account. ' + 'Please check your details and try again.' + supportReference;
}
