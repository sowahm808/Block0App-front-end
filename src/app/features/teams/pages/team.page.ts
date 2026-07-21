import { AsyncPipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { catchError, map, of, startWith } from 'rxjs';
import { TeamsApiService } from '../../../core/api/feature-api.services';

@Component({
  standalone: true,
  imports: [AsyncPipe, JsonPipe, MatButtonModule, MatCardModule],
  template: `<section class="grid gap-5" aria-labelledby="team-title">
    <div class="feature-hero">
      <div class="grid gap-3">
        <p class="eyebrow">/teams</p>
        <h1 id="team-title" class="text-3xl font-black tracking-tight sm:text-4xl">Team accountability</h1>
        <p class="max-w-3xl leading-7 text-slate-600">
          Team view intentionally shows participation, streaks, encouragement, and help indicators only. It never
          displays answers, private confidence, support notes, or weaknesses.
        </p>
      </div>
    </div>
    <div class="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <mat-card class="p-4 sm:p-6">
        <h2 class="text-xl font-black">Team snapshot</h2>
        @if (vm$ | async; as vm) {
          @if (vm.loading) {
            <p class="mt-4">Loading team data…</p>
          } @else if (vm.error) {
            <p class="mt-4 rounded-2xl bg-amber-50 p-4 text-amber-900">Team API is wired but unavailable right now.</p>
          } @else {
            <pre class="api-preview mt-4">{{ vm.data | json }}</pre>
          }
        }
      </mat-card>
      <mat-card class="grid content-start gap-3 p-4 sm:p-6">
        <h2 class="text-xl font-black">Accountability actions</h2>
        <button mat-button>Encourage teammate</button>
        <button mat-button>Request help</button>
        <button mat-button>Complete daily commitment</button>
      </mat-card>
    </div>
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage {
  #api = inject(TeamsApiService);
  vm$ = this.#api.list<unknown>().pipe(
    map((data) => ({ data, loading: false, error: null })),
    catchError((error) => of({ data: null, loading: false, error })),
    startWith({ data: null, loading: true, error: null }),
  );
}
