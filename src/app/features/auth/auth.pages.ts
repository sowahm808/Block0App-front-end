import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/auth/auth.service';

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
    MatProgressSpinnerModule,
  ],
  template: `
    <main class="auth-shell">
      <mat-card class="auth-card"
        ><mat-card-header
          ><mat-card-title>Welcome back</mat-card-title
          ><mat-card-subtitle>Sign in to continue your guided practice.</mat-card-subtitle></mat-card-header
        >

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-3" novalidate>
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

            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || busy()">
              @if (busy()) {
                <mat-progress-spinner mode="indeterminate" diameter="18" />
              }
              {{ busy() ? 'Signing in…' : 'Login' }}
            </button>

            @if (emailVerificationRequired()) {
              <p class="text-sm">Check your inbox and spam folder for the verification email.</p>
            }

            <a routerLink="/forgot-password">Forgot password?</a>
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
          void this.#router.navigateByUrl('/dashboard');
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
              <mat-label>Name</mat-label>

              <input matInput formControlName="displayName" autocomplete="name" />

              @if (
                form.controls.displayName.touched &&
                (form.controls.displayName.hasError('required') || form.controls.displayName.hasError('pattern'))
              ) {
                <mat-error>Name is required.</mat-error>
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

              <mat-hint>Use at least 12 characters.</mat-hint>

              @if (form.controls.password.touched && form.controls.password.hasError('required')) {
                <mat-error>Password is required.</mat-error>
              } @else if (form.controls.password.touched && form.controls.password.hasError('minlength')) {
                <mat-error> Password must be at least 12 characters. </mat-error>
              }
            </mat-form-field>

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

  readonly form = this.#fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]],
  });

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

    const { displayName, email, password } = this.form.getRawValue();

    const normalizedEmail = email.trim().toLowerCase();

    this.#auth
      .register({
        displayName: displayName.trim(),
        email: normalizedEmail,
        password,
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
