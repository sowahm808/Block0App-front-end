import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule],
  template: `<main class="min-h-screen bg-slate-50 text-slate-900">
    <section class="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-6 py-12 md:grid-cols-[1.2fr_0.8fr]">
      <div class="grid gap-6">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Mind Unlocking Academy</p>
        <div class="grid gap-4">
          <h1 class="text-4xl font-extrabold tracking-tight md:text-6xl">Build daily mastery with guided challenges.</h1>
          <p class="max-w-2xl text-lg leading-8 text-slate-600">
            Practice scenario-based learning, track readiness, and keep your team aligned without being sent straight
            to sign in before you know where you are.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <a mat-raised-button color="primary" routerLink="/login">Sign in</a>
          <a mat-stroked-button color="primary" routerLink="/register">Create account</a>
        </div>
      </div>

      <mat-card class="rounded-3xl border border-slate-200 p-6 shadow-xl">
        <mat-card-header>
          <mat-card-title>Today's focus</mat-card-title>
          <mat-card-subtitle>Structured learning flow</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content class="grid gap-4 pt-4">
          <div class="rounded-2xl bg-indigo-50 p-4">
            <p class="font-semibold text-indigo-900">Challenge readiness</p>
            <p class="text-sm text-indigo-700">Daily capsules, check-ins, and scenarios stay protected after login.</p>
          </div>
          <div class="grid grid-cols-2 gap-3 text-center">
            <div class="rounded-2xl bg-slate-100 p-4">
              <p class="text-2xl font-bold">3</p>
              <p class="text-sm text-slate-600">Daily capsules</p>
            </div>
            <div class="rounded-2xl bg-slate-100 p-4">
              <p class="text-2xl font-bold">24/7</p>
              <p class="text-sm text-slate-600">Progress view</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </section>
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {}
