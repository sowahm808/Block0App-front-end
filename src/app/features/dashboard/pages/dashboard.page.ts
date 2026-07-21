import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { catchError, map, of, startWith } from 'rxjs';
import { DashboardService } from '../data-access/dashboard.service';
@Component({
  standalone: true,
  imports: [AsyncPipe, RouterLink, MatButtonModule, MatCardModule, MatProgressBarModule],
  template: `<section class="grid gap-6" aria-labelledby="dash-title">
    <div class="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 text-white shadow-2xl shadow-indigo-950/20">
      <div class="relative grid gap-8 p-6 md:grid-cols-[1.25fr_0.75fr] md:p-10">
        <div class="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-500/30 blur-3xl" aria-hidden="true"></div>
        <div class="absolute bottom-0 right-48 h-36 w-36 rounded-full bg-amber-400/20 blur-3xl" aria-hidden="true"></div>
        <div class="relative grid gap-5">
          <p class="w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-indigo-100">
            Scholar command center
          </p>
          <div class="grid gap-3">
            <h1 id="dash-title" class="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Turn today's practice into measurable readiness.</h1>
            <p class="max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              Follow your active challenge, protect the daily habit, and keep a clear view of momentum across capsules,
              questions, and team progress.
            </p>
          </div>
        </div>
        <div class="relative rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
          <p class="text-sm font-semibold text-indigo-100">Focus streak</p>
          <p class="mt-3 text-6xl font-black">7</p>
          <p class="mt-2 text-sm text-slate-300">days of guided study momentum</p>
        </div>
      </div>
    </div>

    @if (vm$ | async; as vm) {
      @if (vm.loading) {
        <mat-card class="p-6" aria-live="polite">Loading dashboard…</mat-card>
      } @else if (vm.error) {
        <mat-card class="p-6"
          ><h2 class="text-2xl font-bold">We could not load your dashboard</h2>
          <p class="mt-2 text-slate-600">Try again later. Correlation ID will be shown when provided by the API.</p></mat-card
        >
      } @else if (vm.data) {
        <div class="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <mat-card class="overflow-hidden p-0">
            <div class="grid gap-6 p-6 md:p-8">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Current challenge</p>
                  <h2 class="mt-2 text-3xl font-black">Welcome, {{ vm.data.scholarName }}</h2>
                  <p class="mt-2 text-slate-600">{{ vm.data.currentChallenge }} — Day {{ vm.data.currentDay }}</p>
                </div>
                <a mat-raised-button color="primary" [routerLink]="vm.data.continueUrl">Continue study</a>
              </div>
              <div class="rounded-2xl bg-indigo-50 p-5">
                <div class="flex items-center justify-between gap-4">
                  <p class="font-bold text-indigo-950">Overall completion</p>
                  <p class="text-2xl font-black text-indigo-700">{{ vm.data.overallCompletion }}%</p>
                </div>
                <mat-progress-bar class="mt-4" [value]="vm.data.overallCompletion" aria-label="Overall completion"></mat-progress-bar>
              </div>
            </div>
          </mat-card>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <mat-card class="p-6">
              <p class="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Today</p>
              <div class="mt-4 grid grid-cols-2 gap-3 text-center">
                <div class="rounded-2xl bg-emerald-50 p-4">
                  <p class="text-3xl font-black text-emerald-700">{{ vm.data.questionsCompletedToday }}</p>
                  <p class="text-sm text-slate-600">questions</p>
                </div>
                <div class="rounded-2xl bg-amber-50 p-4">
                  <p class="text-3xl font-black text-amber-700">{{ vm.data.capsulesCompletedToday }}</p>
                  <p class="text-sm text-slate-600">capsules</p>
                </div>
              </div>
              <p class="mt-4 text-sm text-slate-600">Daily target: {{ vm.data.dailyTarget }} capsules</p>
            </mat-card>
            <mat-card class="p-6">
              <p class="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">Readiness</p>
              <p class="mt-3 text-3xl font-black">{{ vm.data.readinessLevel }}</p>
              <p class="mt-2 text-slate-600">{{ vm.data.raffleEntries }} raffle entries earned</p>
            </mat-card>
          </div>
        </div>
        <mat-card class="p-6 md:p-8">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-2xl font-black">Announcements</h2>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Live updates</span>
          </div>
          <ul class="mt-5 grid gap-3 md:grid-cols-2">
            @for (a of vm.data.announcements; track a) {
              <li class="rounded-2xl border border-slate-200 bg-white/70 p-4 text-slate-700">{{ a }}</li>
            }
          </ul>
        </mat-card>
      }
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  #svc = inject(DashboardService);
  vm$ = this.#svc.getDashboard().pipe(
    map((data) => ({ data, error: null, loading: false })),
    catchError((error) => of({ data: null, error, loading: false })),
    startWith({ data: null, error: null, loading: true }),
  );
}
