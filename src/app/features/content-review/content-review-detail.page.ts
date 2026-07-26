import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  catchError,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import { ApiService } from '../../core/api/api.service';

interface ContentReviewItem {
  id: string;
  entityId: string;
  entityType: string;
  title?: string;
  status: string;
  content: {
    stem?: string;
    title?: string;
    choices?: Array<{
      id: string;
      label?: string;
      text: string;
    }>;
    explanation?: {
      correctChoiceId?: string;
      correctRationale?: string;
    };
  };
}

type ApiState<T> =
  | { status: 'loading' }
  | { status: 'loaded'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string };

@Component({
  selector: 'b0-content-review-detail',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  template: `
    <section class="grid gap-5">
      <a routerLink="/review/content">← Review queue</a>

      @if (state$ | async; as state) {
        @if (state.status === 'loading') {
          <p>Loading review record…</p>
        } @else if (state.status === 'error') {
          <p>{{ state.message }}</p>
        } @else if (state.status === 'empty') {
          <p>Review record not found.</p>
        } @else {
          <h1>
            {{
              state.data.title ||
                state.data.content.title ||
                state.data.content.stem ||
                state.data.entityId
            }}
          </h1>

          <p>Status: {{ state.data.status }}</p>
          <p>Entity type: {{ state.data.entityType }}</p>
          <p>Entity ID: {{ state.data.entityId }}</p>

          @if (state.data.content.stem) {
            <h2>Question</h2>
            <p>{{ state.data.content.stem }}</p>
          }

          @if (state.data.content.choices?.length) {
            <h2>Choices</h2>

            <ol>
              @for (
                choice of state.data.content.choices;
                track choice.id
              ) {
                <li>
                  <strong>{{ choice.label || choice.id }}</strong>
                  {{ choice.text }}
                </li>
              }
            </ol>
          }

          @if (
            state.data.content.explanation?.correctChoiceId
          ) {
            <p>
              <strong>Correct answer:</strong>
              {{
                state.data.content.explanation?.correctChoiceId?.toUpperCase()
              }}
            </p>
          }

          @if (
            state.data.content.explanation?.correctRationale
          ) {
            <p>
              <strong>Rationale:</strong>
              {{
                state.data.content.explanation?.correctRationale
              }}
            </p>
          }
        }
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentReviewDetailPage {
  readonly #api = inject(ApiService);
  readonly #route = inject(ActivatedRoute);

  readonly state$ = this.#route.paramMap.pipe(
    map((params) => params.get('reviewId') ?? ''),

    switchMap((reviewId) => {
      if (!reviewId) {
        return of({
          status: 'error',
          message: 'Missing review ID.',
        } satisfies ApiState<ContentReviewItem>);
      }

      return this.#api
        .get<ContentReviewItem>(
          `/review/content/${encodeURIComponent(reviewId)}`,
        )
        .pipe(
          map((item): ApiState<ContentReviewItem> => {
            if (!item?.id) {
              return { status: 'empty' };
            }

            return {
              status: 'loaded',
              data: item,
            };
          }),

          startWith({
            status: 'loading',
          } satisfies ApiState<ContentReviewItem>),

          catchError((error: unknown) =>
            of({
              status: 'error',
              message: this.errorMessage(error),
            } satisfies ApiState<ContentReviewItem>),
          ),
        );
    }),
  );

  private errorMessage(error: unknown): string {
    const httpError = error as {
      status?: number;
      message?: string;
      error?: {
        detail?: string;
        message?: string;
      };
    };

    if (httpError.status === 404) {
      return 'The review record was not found.';
    }

    if (httpError.status === 403) {
      return 'You do not have permission to review this content.';
    }

    return (
      httpError.error?.detail ||
      httpError.error?.message ||
      httpError.message ||
      'Unable to load the review record.'
    );
  }
}