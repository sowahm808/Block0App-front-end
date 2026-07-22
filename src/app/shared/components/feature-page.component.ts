import { AsyncPipe, TitleCasePipe } from '@angular/common';
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

interface DisplayField {
  label: string;
  value: string;
}

interface DisplayCard {
  title: string;
  subtitle?: string;
  fields: DisplayField[];
}

interface DisplayModel {
  cards: DisplayCard[];
  metrics: DisplayField[];
  hasData: boolean;
}

@Component({
  selector: 'b0-feature-page',
  standalone: true,
  imports: [
    AsyncPipe,
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
              <h2 class="m-0 text-xl font-black">{{ vm.title }} overview</h2>
              <p class="m-0 text-sm text-[var(--b0-text-muted)]">Live information from the connected backend.</p>
            </div>
            <b0-status-badge [label]="vm.apiPath" tone="info" />
          </div>
          <div class="mt-5"><b0-search-input label="Filter preview" placeholder="Search this section" /></div>
          @if (vm.loading) {
            <div class="mt-5"><b0-loading-skeleton [rows]="5" [label]="'Loading ' + (vm.title | titlecase)" /></div>
          } @else if (vm.error) {
            <div class="mt-5">
              <b0-error-state
                title="Data unavailable"
                [message]="
                  'Confirm the API is running and that this user has permission for ' +
                  vm.apiPath +
                  '. You can still use the navigation and page actions.'
                "
              />
            </div>
          } @else if (!vm.display.hasData) {
            <div class="mt-5">
              <b0-empty-state
                title="Nothing to show yet"
                message="This section is ready, but the endpoint did not return displayable records."
              />
            </div>
          } @else {
            @if (vm.display.metrics.length) {
              <div class="feature-metrics mt-5" aria-label="Key metrics">
                @for (metric of vm.display.metrics; track metric.label) {
                  <div class="feature-metric">
                    <span>{{ metric.label }}</span>
                    <strong>{{ metric.value }}</strong>
                  </div>
                }
              </div>
            }
            <div class="feature-card-grid mt-5">
              @for (card of vm.display.cards; track card.title) {
                <article class="feature-data-card">
                  <h3>{{ card.title }}</h3>
                  @if (card.subtitle) {
                    <p>{{ card.subtitle }}</p>
                  }
                  @if (card.fields.length) {
                    <dl>
                      @for (field of card.fields; track field.label) {
                        <div>
                          <dt>{{ field.label }}</dt>
                          <dd>{{ field.value }}</dd>
                        </div>
                      }
                    </dl>
                  }
                </article>
              }
            </div>
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
        map((data) => ({ ...feature, display: this.#toDisplayModel(data), loading: false, error: null })),
        catchError((error) => of({ ...feature, display: this.#toDisplayModel(null), loading: false, error })),
        startWith({ ...feature, display: this.#toDisplayModel(null), loading: true, error: null }),
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

  #toDisplayModel(data: unknown): DisplayModel {
    if (data == null) return { cards: [], metrics: [], hasData: false };
    const records = this.#extractRecords(data);
    const metrics = this.#isRecord(data)
      ? Object.entries(data)
          .filter(([, value]) => this.#isPrimitive(value))
          .slice(0, 6)
          .map(([key, value]) => ({ label: this.#humanize(key), value: this.#formatValue(value) }))
      : [];
    const cards = records.slice(0, 12).map((record, index) => this.#toCard(record, index));
    if (!cards.length && metrics.length && this.#isRecord(data)) cards.push(this.#toCard(data, 0));
    if (!cards.length && this.#isPrimitive(data)) cards.push({ title: this.#formatValue(data), fields: [] });
    return { cards, metrics, hasData: cards.length > 0 || metrics.length > 0 };
  }

  #extractRecords(data: unknown): unknown[] {
    if (Array.isArray(data)) return data;
    if (!this.#isRecord(data)) return [];

    const preferredKeys = ['items', 'data', 'results', 'records', 'content', 'notifications'];
    for (const key of preferredKeys) {
      const value = data[key];
      if (Array.isArray(value)) return value;
    }

    const nestedRecords = Object.entries(data).flatMap(([key, value]) =>
      Array.isArray(value) ? value.map((item) => this.#withSection(item, key)) : [],
    );

    return nestedRecords.length ? nestedRecords : [data];
  }

  #withSection(record: unknown, section: string): unknown {
    if (!this.#isRecord(record)) return record;
    return { section: this.#humanize(section), ...record };
  }

  #toCard(record: unknown, index: number): DisplayCard {
    if (!this.#isRecord(record)) return { title: this.#formatValue(record), fields: [] };
    const entries = Object.entries(record).filter(([, value]) => this.#isPrimitive(value));
    const titleEntry = entries.find(([key]) => /^(title|name|displayName|email|subject|label)$/i.test(key));
    const subtitleEntry = entries.find(
      ([key]) => /^(description|summary|status|role|type)$/i.test(key) && key !== titleEntry?.[0],
    );
    const fields = entries
      .filter(([key]) => key !== titleEntry?.[0] && key !== subtitleEntry?.[0])
      .slice(0, 6)
      .map(([key, value]) => ({ label: this.#humanize(key), value: this.#formatValue(value) }));
    return {
      title: titleEntry ? this.#formatValue(titleEntry[1]) : `Record ${index + 1}`,
      subtitle: subtitleEntry ? this.#formatValue(subtitleEntry[1]) : undefined,
      fields,
    };
  }

  #isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  #isPrimitive(value: unknown): value is string | number | boolean | null | undefined {
    return value == null || ['string', 'number', 'boolean'].includes(typeof value);
  }

  #formatValue(value: unknown): string {
    if (value == null || value === '') return 'Not set';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  #humanize(key: string): string {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/^./, (char) => char.toUpperCase());
  }
}
