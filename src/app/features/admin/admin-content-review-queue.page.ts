import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  catchError,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { DataTemplateComponent } from '../../shared/components/data-template.component';

interface ContentReviewItem {
  id: string;
  entityId: string;
  entityType: string;
  title: string;
  status: string;
  notes?: string | null;
  reviewerId?: string | null;
  reviewedAtUtc?: string | null;
  importId?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  content: Record<string, unknown>;
  importAudit?: {
    sourceFileName?: string;
    importedBy?: string;
    importedAtUtc?: string;
  };
}

interface ContentReviewResponse {
  data: ContentReviewItem[];
  nextCursor?: string;
  total?: number;
}

type ApiState<T> =
  | {
      status: 'loading';
    }
  | {
      status: 'loaded';
      data: T;
    }
  | {
      status: 'empty';
    }
  | {
      status: 'error';
      message: string;
    };

@Component({
  selector: 'b0-admin-content-review-queue',
  standalone: true,
  imports: [
    AsyncPipe,
    DataTemplateComponent,
    PageHeaderComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <b0-page-header
      title="Admin Content Review Queue"
      description="Review imported learning packs, capsules, questions, and resources."
    />

    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="4" />
      } @else if (state.status === 'error') {
        <b0-error-state
          [message]="state.message"
          (retry)="reload()"
        />
      } @else if (state.status === 'empty') {
        <b0-empty-state
          title="No content awaiting review"
          message="There are currently no learning packs, capsules, questions, or resources in this review queue."
        />
      } @else {
        <b0-data-template
          [data]="state.data"
          ariaLabel="Admin Content Review Queue content"
        />
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminContentReviewQueuePage {
  readonly #api = inject(ApiService);
  readonly #route = inject(ActivatedRoute);

  readonly state$ = this.#route.data.pipe(
    switchMap((routeData) => {
      const apiPath = String(
        routeData['apiPath'] ?? '/review/content',
      );

      return this.#api
        .get<ContentReviewResponse | ContentReviewItem[]>(apiPath)
        .pipe(
          map((response): ApiState<ContentReviewItem[]> => {
            const items = Array.isArray(response)
              ? response
              : response?.data ?? [];

            if (items.length === 0) {
              return {
                status: 'empty',
              };
            }

            return {
              status: 'loaded',
              data: items,
            };
          }),

          startWith({
            status: 'loading',
          } satisfies ApiState<ContentReviewItem[]>),

          catchError((error: unknown) =>
            of({
              status: 'error',
              message: this.errorMessage(error),
            } satisfies ApiState<ContentReviewItem[]>),
          ),
        );
    }),
  );

  reload() {
    window.location.reload();
  }

  private errorMessage(error: unknown): string {
    const httpError = error as {
      status?: number;
      message?: string;
      error?: {
        title?: string;
        detail?: string;
        message?: string;
        traceId?: string;
      };
    };

    if (httpError.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }

    if (httpError.status === 403) {
      return 'You do not have permission to view the content review queue.';
    }

    if (httpError.status === 404) {
      return 'The content review endpoint was not found.';
    }

    return (
      httpError.error?.detail ||
      httpError.error?.message ||
      httpError.error?.title ||
      httpError.message ||
      'The content review endpoint is unavailable.'
    );
  }
}