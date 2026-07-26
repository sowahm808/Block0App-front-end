import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { ContentReviewItem, ContentReviewListResponse } from '../../core/api/api.types';
import { DataTemplateComponent } from '../../shared/components/data-template.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

interface QueueViewModel {
  contentQueue: boolean;
  value: unknown;
  items: ContentReviewItem[];
}
type ApiState =
  | { status: 'loading' }
  | { status: 'loaded'; data: QueueViewModel }
  | { status: 'empty' }
  | { status: 'error'; message: string };

@Component({
  selector: 'b0-review-queue',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    DataTemplateComponent,
    PageHeaderComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `<b0-page-header title="Review Queue" description="Review draft content before publication." />
    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="4" label="Loading review queue" />
      } @else if (state.status === 'error') {
        <b0-error-state [message]="state.message" (retry)="reload()" />
      } @else if (state.status === 'empty') {
        <b0-empty-state title="No records available" message="There is no content waiting for review." />
      } @else if (state.data.contentQueue) {
        <div class="grid gap-4">
          @for (item of state.data.items; track item.id) {
            <article class="rounded-xl border border-[var(--b0-border)] bg-[var(--b0-surface)] p-5 shadow-sm">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="m-0 text-xs font-bold uppercase tracking-wide text-[var(--b0-text-muted)]">
                    {{ item.entityType }} · {{ item.status }}
                  </p>
                  <h2 class="mt-2 text-lg font-black">{{ item.title || item.content.stem || item.entityId }}</h2>
                  <p class="m-0 text-sm text-[var(--b0-text-muted)]">Entity ID: {{ item.entityId }}</p>
                </div>
                <a class="font-bold text-[var(--b0-primary)]" [routerLink]="['/review/content', item.id]"
                  >Review content</a
                >
              </div>
            </article>
          }
        </div>
      } @else {
        <b0-data-template [data]="state.data.value" ariaLabel="Review Queue content" />
      }
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewQueuePage {
  readonly #api = inject(ApiService);
  readonly #route = inject(ActivatedRoute);

  readonly state$ = this.#route.data.pipe(
    switchMap((data) => {
      const apiPath = typeof data['apiPath'] === 'string' ? data['apiPath'].trim() : '';
      if (!apiPath)
        return of({
          status: 'error',
          message: 'This review queue is not configured with an API endpoint.',
        } satisfies ApiState);
      return this.#api.get<unknown>(apiPath).pipe(
        map((value): ApiState => {
          const contentQueue = apiPath === '/review/content';
          const items = contentQueue ? this.#contentItems(value) : [];
          const empty = contentQueue ? items.length === 0 : value == null;
          return empty ? { status: 'empty' } : { status: 'loaded', data: { contentQueue, value, items } };
        }),
        startWith({ status: 'loading' } satisfies ApiState),
        catchError((error: unknown) =>
          of({
            status: 'error',
            message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.',
          } satisfies ApiState),
        ),
      );
    }),
  );

  #contentItems(value: unknown): ContentReviewItem[] {
    if (!value || typeof value !== 'object') return [];
    const data = (value as Partial<ContentReviewListResponse>).data;
    return Array.isArray(data) ? data : [];
  }

  reload() {
    window.location.reload();
  }
}
