import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule],
  template: `<main class="min-h-screen overflow-hidden bg-[var(--b0-bg)] text-[var(--b0-text)]">
    <header class="sticky top-0 z-30 border-b border-[var(--b0-border)] bg-white/85 backdrop-blur-xl">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <a class="brand-lockup" routerLink="/" aria-label="Mind Unlocking Academy home">
          <span class="brand-mark" aria-hidden="true">M</span>
          <span class="grid leading-tight">
            <span class="text-sm font-black uppercase tracking-[0.22em] text-indigo-700">Mind Unlocking</span>
            <span class="text-base font-extrabold text-slate-950">Academy</span>
          </span>
        </a>

        <nav class="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex" aria-label="Primary navigation">
          <a class="transition hover:text-indigo-700" routerLink="/">Home</a>
          <a class="transition hover:text-indigo-700" href="#about-challenge">About the challenge</a>
          <a class="transition hover:text-indigo-700" href="#how-it-works">How it works</a>
        </nav>

        <div class="flex items-center gap-2">
          <a mat-button color="primary" routerLink="/login">Sign in</a>
          <a mat-raised-button color="primary" routerLink="/register">Join challenge</a>
        </div>
      </div>
    </header>

    <section id="about-challenge" class="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] lg:py-24">
      <div class="absolute left-8 top-12 h-28 w-28 rounded-full bg-indigo-200/50 blur-2xl" aria-hidden="true"></div>
      <div class="absolute bottom-16 right-10 h-36 w-36 rounded-full bg-amber-200/60 blur-2xl" aria-hidden="true"></div>

      <div class="relative grid gap-7">
        <p class="w-fit rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-sm font-black uppercase tracking-[0.22em] text-indigo-700 shadow-sm backdrop-blur">
          21-day guided readiness challenge
        </p>
        <div class="grid gap-5">
          <h1 class="max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
            Become Block Zero Ready in 21 Days
          </h1>
          <p class="max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
            Build medical knowledge, clinical reasoning, confidence, and exam readiness through guided daily study.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <a mat-raised-button color="primary" routerLink="/register">Join the Challenge</a>
          <a mat-stroked-button color="primary" routerLink="/login">Sign In</a>
        </div>
      </div>

      <mat-card class="relative overflow-hidden p-6">
        <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-200/70 blur-2xl" aria-hidden="true"></div>
        <mat-card-header>
          <mat-card-title>Program summary</mat-card-title>
          <mat-card-subtitle>Designed for steady daily progress</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content class="grid gap-3 pt-5 sm:grid-cols-2">
          @for (card of summaryCards; track card) {
            <div class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p class="m-0 text-sm font-extrabold text-slate-900">{{ card }}</p>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </section>

    <section id="how-it-works" class="mx-auto max-w-7xl px-6 pb-16 lg:pb-24">
      <div class="rounded-[2rem] border border-[var(--b0-border)] bg-white/85 p-6 shadow-[var(--b0-shadow-sm)] md:p-10">
        <div class="mb-8 grid gap-3">
          <p class="m-0 text-sm font-black uppercase tracking-[0.22em] text-indigo-700">How it works</p>
          <h2 class="m-0 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Follow the readiness path</h2>
        </div>
        <ol class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          @for (step of howItWorks; track step; let index = $index) {
            <li class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span class="mb-4 grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-sm font-black text-indigo-700">{{ index + 1 }}</span>
              <p class="m-0 text-lg font-extrabold text-slate-950">{{ step }}</p>
            </li>
          }
        </ol>
      </div>
    </section>

    <footer class="border-t border-[var(--b0-border)] bg-white/80">
      <div class="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm font-semibold text-slate-600 md:flex-row md:items-center md:justify-between">
        <p class="m-0">© Mind Unlocking Academy</p>
        <nav class="flex flex-wrap gap-5" aria-label="Footer navigation">
          <a class="hover:text-indigo-700" routerLink="/terms">Terms of use</a>
          <a class="hover:text-indigo-700" routerLink="/privacy">Privacy policy</a>
          <a class="hover:text-indigo-700" routerLink="/support">Support</a>
          <a class="hover:text-indigo-700" routerLink="/certificate/verify/sample">Certificate verification</a>
        </nav>
      </div>
    </footer>
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  readonly summaryCards = [
    '21-day program',
    '800 knowledge questions',
    '130 clinical scenarios',
    'Teams of 3–4 scholars',
    'Daily check-ins',
    'Rewards and certificates',
  ];

  readonly howItWorks = [
    'Join a cohort',
    'Complete daily capsules',
    'Learn through W1, W2, and W3',
    'Practice clinical scenarios',
    'Review weak areas',
    'Track readiness',
  ];
}
