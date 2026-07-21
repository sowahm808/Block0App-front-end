import { AsyncPipe, JsonPipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';

interface FeatureRouteData {
  title?: string;
  description?: string;
  apiPath?: string;
  primaryAction?: string;
  primaryLink?: string;
}

@Component({
  selector: 'b0-feature-page',
  standalone: true,
  imports: [AsyncPipe, JsonPipe, TitleCasePipe, RouterLink, MatButtonModule, MatCardModule],
  template: `<section class="grid gap-5" aria-labelledby="feature-title">
    @if (vm$ | async; as vm) {
      <div class="feature-hero">
        <div class="grid gap-3">
          <p class="eyebrow">{{ vm.apiPath || 'App section' }}</p>
          <h1 id="feature-title" class="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{{ vm.title }}</h1>
          <p class="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{{ vm.description }}</p>
        </div>
        @if (vm.primaryLink) {
          <a mat-raised-button color="primary" [routerLink]="vm.primaryLink">{{ vm.primaryAction }}</a>
        }
      </div>

      <div class="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <mat-card class="p-4 sm:p-6">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-xl font-black">Live API data</h2>
            <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{{ vm.apiPath }}</span>
          </div>

          @if (vm.loading) {
            <p class="mt-5 rounded-2xl bg-slate-50 p-4 text-slate-600" aria-live="polite">
              Loading {{ vm.title | titlecase }}…
            </p>
          } @else if (vm.error) {
            <div class="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900" role="status">
              <p class="font-bold">This page is wired to the backend, but the request did not complete.</p>
              <p class="mt-1 text-sm">
                Confirm the API is running and that this user has permission for {{ vm.apiPath }}.
              </p>
            </div>
          } @else {
            <pre class="api-preview mt-5">{{ vm.data | json }}</pre>
          }
        </mat-card>

        <mat-card class="grid content-start gap-3 p-4 sm:p-6">
          <h2 class="text-xl font-black">Page status</h2>
          <p class="text-sm leading-6 text-slate-600">
            Responsive layout, guarded route, and typed API request are active for this section.
          </p>
          <a mat-stroked-button color="primary" routerLink="/dashboard">Back to dashboard</a>
        </mat-card>
      </div>
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePageComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #api = inject(ApiService);

  readonly vm$ = this.#route.data.pipe(
    map((data) => this.#toFeatureData(data as FeatureRouteData)),
    switchMap((feature) =>
      this.#api.get<unknown>(feature.apiPath).pipe(
        map((data) => ({ ...feature, data, loading: false, error: null })),
        catchError((error) => of({ ...feature, data: null, loading: false, error })),
        startWith({ ...feature, data: null, loading: true, error: null }),
      ),
    ),
  );

  #toFeatureData(data: FeatureRouteData): Required<FeatureRouteData> {
    return {
      title: data.title ?? 'Feature',
      description:
        data.description ??
        'This production feature is connected to the backend through typed API services and protected app routes.',
      apiPath: data.apiPath ?? '/dashboard',
      primaryAction: data.primaryAction ?? 'Continue',
      primaryLink: data.primaryLink ?? '/dashboard',
    };
  }
}
