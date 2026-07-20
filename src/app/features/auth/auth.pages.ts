import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `<mat-card class="mx-auto max-w-md"
    ><mat-card-title>Login</mat-card-title
    ><mat-card-content
      ><form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-3">
        <mat-form-field
          ><mat-label>Email</mat-label><input matInput formControlName="email" autocomplete="email" /></mat-form-field
        ><mat-form-field
          ><mat-label>Password</mat-label
          ><input matInput type="password" formControlName="password" autocomplete="current-password" /></mat-form-field
        ><button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || busy">Login</button
        ><a routerLink="/forgot-password">Forgot password?</a>
      </form></mat-card-content
    ></mat-card
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  #fb = inject(FormBuilder);
  #auth = inject(AuthService);
  #router = inject(Router);
  busy = false;
  form = this.#fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  submit() {
    if (this.form.invalid) return;
    this.busy = true;
    this.#auth
      .login(this.form.getRawValue())
      .subscribe({ next: () => void this.#router.navigateByUrl('/dashboard'), error: () => (this.busy = false) });
  }
}
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `<mat-card class="mx-auto max-w-md"
    ><mat-card-title>Register</mat-card-title>
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
          @if (form.controls.displayName.touched && form.controls.displayName.hasError('required')) {
            <mat-error>Name is required.</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" autocomplete="email" />
          @if (form.controls.email.touched && form.controls.email.hasError('required')) {
            <mat-error>Email is required.</mat-error>
          } @else if (form.controls.email.touched && form.controls.email.hasError('email')) {
            <mat-error>Enter a valid email address.</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="new-password" />
          <mat-hint>Use at least 12 characters.</mat-hint>
          @if (form.controls.password.touched && form.controls.password.hasError('required')) {
            <mat-error>Password is required.</mat-error>
          } @else if (form.controls.password.touched && form.controls.password.hasError('minlength')) {
            <mat-error>Password must be at least 12 characters.</mat-error>
          }
        </mat-form-field>
        <button mat-raised-button color="primary" type="submit" [disabled]="busy()">
          {{ busy() ? 'Creating account…' : 'Create account' }}
        </button>
      </form>
    </mat-card-content></mat-card
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  #fb = inject(FormBuilder);
  #auth = inject(AuthService);
  #router = inject(Router);
  busy = signal(false);
  errorMessage = signal('');
  form = this.#fb.nonNullable.group({
    displayName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]],
  });
  submit() {
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.#auth.register(this.form.getRawValue()).subscribe({
      next: () => void this.#router.navigateByUrl('/dashboard'),
      error: () => {
        this.busy.set(false);
        this.errorMessage.set('We could not create your account. Please check your details and try again.');
      },
    });
  }
}
@Component({
  standalone: true,
  template: `<h1>{{ title }}</h1>
    <p>Use the secure email flow from the backend to continue.</p>`,
})
export class SimpleAuthPage {
  title = 'Account access';
}
