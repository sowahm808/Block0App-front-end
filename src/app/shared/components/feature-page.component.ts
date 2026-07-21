import { AsyncPipe, JsonPipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PageHeaderComponent } from '../ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../ui/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../ui/error-state/error-state.component';
import { SearchInputComponent } from '../ui/search-input/search-input.component';
import { StatusBadgeComponent } from '../ui/status-badge/status-badge.component';

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
  imports: [
    AsyncPipe,
    JsonPipe,
    TitleCasePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    PageHeaderComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SearchInputComponent,
    StatusBadgeComponent,
  ],
  template: `<section class="grid gap-5" aria-labelledby="feature-title">
    @if (vm$ | async; as vm) {
      <b0-page-header
        titleId="feature-title"
        [title]="vm.title"
        [description]="vm.description"
        [eyebrow]="vm.apiPath || 'App section'"
      >
        @if (vm.primaryLink) {
          <a mat-raised-button color="primary" [routerLink]="vm.primaryLink">{{ vm.primaryAction }}</a>
        }
      </b0-page-header>
      <div class="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <mat-card class="p-4 sm:p-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="m-0 text-xl font-black">Live API data</h2>
              <p class="m-0 text-sm text-[var(--b0-text-muted)]">Backend-connected section preview.</p>
            </div>
            <b0-status-badge [label]="vm.apiPath" tone="info" />
          </div>
          <div class="mt-5"><b0-search-input label="Filter preview" placeholder="Search loaded JSON" /></div>
          @if (vm.loading) {
            <div class="mt-5"><b0-loading-skeleton [rows]="5" [label]="'Loading ' + (vm.title | titlecase)" /></div>
          } @else if (vm.error) {
            <div class="mt-5">
              <b0-error-state
                title="Data unavailable"
                [message]="'Confirm the API is running and that this user has permission for ' + vm.apiPath + '.'"
              />
            </div>
          } @else if (!vm.data) {
            <div class="mt-5">
              <b0-empty-state title="No data returned" message="This endpoint responded without displayable records." />
            </div>
          } @else {
            <pre class="api-preview mt-5">{{ vm.data | json }}</pre>
          }
        </mat-card>
        <mat-card class="grid content-start gap-3 p-4 sm:p-6">
          <h2 class="m-0 text-xl font-black">Page status</h2>
          <p class="text-sm leading-6 text-[var(--b0-text-muted)]">
            Responsive layout, guarded route, typed API request, loading, empty, and error states are active.
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
