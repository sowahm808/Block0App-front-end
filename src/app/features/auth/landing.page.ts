import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule],
  template: `<main class="min-h-screen overflow-hidden text-slate-900">
    <section class="relative mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-6 py-12 md:grid-cols-[1.2fr_0.8fr]">
      <div class="absolute left-6 top-8 h-24 w-24 rounded-full bg-indigo-200/50 blur-2xl" aria-hidden="true"></div>
      <div class="absolute bottom-12 right-6 h-32 w-32 rounded-full bg-amber-200/60 blur-2xl" aria-hidden="true"></div>
      <div class="grid gap-6">
        <p class="w-fit rounded-full border border-indigo-200 bg-white/70 px-4 py-2 text-sm font-black uppercase tracking-[0.22em] text-indigo-700 shadow-sm backdrop-blur">Mind Unlocking Academy</p>
        <div class="grid gap-4">
          <h1 class="text-4xl font-black tracking-tight md:text-6xl">Build daily mastery with guided challenges.</h1>
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

      <mat-card class="relative overflow-hidden p-6">
        <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-200/70 blur-2xl" aria-hidden="true"></div>
        <mat-card-header>
          <mat-card-title>Today's focus</mat-card-title>
          <mat-card-subtitle>Structured learning flow</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content class="grid gap-4 pt-4">
          <div class="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-4 ring-1 ring-indigo-100">
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
