import { AsyncPipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { ApiService } from '../../core/api/api.service';
import { ContentReviewItem, ContentReviewListResponse } from '../../core/api/api.types';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';

type ApiState<T> =
  | { status: 'loading' }
  | { status: 'loaded'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string };

@Component({
  selector: 'b0-admin-content-review-queue',
  standalone: true,
  imports: [
    AsyncPipe,
    TitleCasePipe,
    RouterLink,
    PageHeaderComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <section class="grid gap-6">
      <b0-page-header title="Review Workspace" description="Content-review records prioritized for reviewer action." />

      @if (state$ | async; as state) {
        @if (state.status === 'loading') {
          <b0-loading-skeleton [rows]="6" />
        } @else if (state.status === 'error') {
          <b0-error-state [message]="state.message" (retry)="reload()" />
        } @else if (state.status === 'empty') {
          <b0-empty-state
            title="No content awaiting review"
            message="There are currently no records in the content-review queue."
          />
        } @else {
          <div class="review-summary">
            <span>
              {{ state.data.length }}
              {{ state.data.length === 1 ? 'record' : 'records' }}
            </span>

            <span> {{ countByStatus(state.data, 'draft') }} draft </span>

            <span> {{ countByStatus(state.data, 'approved') }} approved </span>
          </div>

          <div class="review-grid">
            @for (item of state.data; track item.id) {
              <article class="review-card">
                <div class="review-card__header">
                  <div class="min-w-0">
                    <p class="entity-label">
                      {{ entityTypeLabel(item.entityType) }}
                    </p>

                    <h2>
                      {{ displayTitle(item) }}
                    </h2>
                  </div>

                  <span
                    class="status-badge"
                    [class.status-badge--draft]="normalizedStatus(item.status) === 'draft'"
                    [class.status-badge--approved]="normalizedStatus(item.status) === 'approved'"
                    [class.status-badge--rejected]="normalizedStatus(item.status) === 'rejected'"
                    [class.status-badge--pending]="normalizedStatus(item.status) === 'pending'"
                  >
                    {{ statusLabel(item.status) }}
                  </span>
                </div>

                @if (item.entityType === 'question') {
                  <div class="question-preview">
                    <p class="question-stem">
                      {{ item.content.stem || item.title }}
                    </p>

                    @if (item.content.choices?.length) {
                      <div class="choice-list">
                        @for (choice of item.content.choices; track choice.id) {
                          <div class="choice-row" [class.choice-row--correct]="isCorrectChoice(item, choice.id)">
                            <span class="choice-label">
                              {{ choice.label || choice.id }}
                            </span>

                            <span>{{ choice.text }}</span>
                          </div>
                        }
                      </div>
                    }

                    @if (item.content.explanation?.correctChoiceId) {
                      <p class="correct-answer">
                        Correct answer:
                        <strong>
                          {{ item.content.explanation?.correctChoiceId?.toUpperCase() }}
                        </strong>
                      </p>
                    }
                  </div>
                } @else {
                  <p class="content-description">
                    {{ item.content.description || item.content.objectivesSummary || 'No description provided.' }}
                  </p>
                }

                <dl class="metadata-grid">
                  <div>
                    <dt>Entity ID</dt>
                    <dd>{{ item.entityId }}</dd>
                  </div>

                  @if (item.content.learningPackId) {
                    <div>
                      <dt>Learning pack</dt>
                      <dd>{{ item.content.learningPackId }}</dd>
                    </div>
                  }

                  @if (item.content.capsuleId) {
                    <div>
                      <dt>Capsule</dt>
                      <dd>{{ item.content.capsuleId }}</dd>
                    </div>
                  }

                  @if (item.content.difficulty) {
                    <div>
                      <dt>Difficulty</dt>
                      <dd>{{ item.content.difficulty | titlecase }}</dd>
                    </div>
                  }

                  @if (item.importAudit?.sourceFileName) {
                    <div class="metadata-grid__wide">
                      <dt>Source file</dt>
                      <dd>{{ item.importAudit?.sourceFileName }}</dd>
                    </div>
                  }
                </dl>

                @if (item.notes) {
                  <div class="review-notes">
                    <strong>Reviewer notes</strong>
                    <p>{{ item.notes }}</p>
                  </div>
                }

                <div class="review-card__actions">
                  <a class="primary-action" [routerLink]="['/review/content', item.id]"> Review content </a>
                </div>
              </article>
            }
          </div>
        }
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .review-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        color: var(--b0-text-muted);
        font-size: 0.875rem;
      }

      .review-summary span {
        border: 1px solid var(--b0-border);
        border-radius: 999px;
        padding: 0.4rem 0.8rem;
        background: var(--b0-surface);
      }

      .review-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(24rem, 1fr));
        gap: 1.25rem;
        align-items: start;
      }

      .review-card {
        display: grid;
        gap: 1.25rem;
        padding: 1.5rem;
        border: 1px solid var(--b0-border);
        border-radius: 1.25rem;
        background: var(--b0-surface);
        box-shadow: 0 8px 24px rgb(15 23 42 / 5%);
        min-width: 0;
      }

      .review-card__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }

      .review-card h2 {
        margin: 0.25rem 0 0;
        font-size: 1.2rem;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }

      .entity-label {
        margin: 0;
        color: var(--b0-primary);
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .status-badge {
        flex: 0 0 auto;
        border-radius: 999px;
        padding: 0.35rem 0.7rem;
        background: #e2e8f0;
        color: #334155;
        font-size: 0.75rem;
        font-weight: 800;
      }

      .status-badge--draft {
        background: #fef3c7;
        color: #92400e;
      }

      .status-badge--approved {
        background: #d1fae5;
        color: #065f46;
      }

      .status-badge--rejected {
        background: #fee2e2;
        color: #991b1b;
      }

      .status-badge--pending {
        background: #dbeafe;
        color: #1e40af;
      }

      .question-preview {
        display: grid;
        gap: 1rem;
      }

      .question-stem {
        margin: 0;
        font-weight: 700;
        line-height: 1.55;
      }

      .choice-list {
        display: grid;
        gap: 0.6rem;
      }

      .choice-row {
        display: grid;
        grid-template-columns: 2rem minmax(0, 1fr);
        gap: 0.75rem;
        align-items: start;
        padding: 0.7rem 0.8rem;
        border: 1px solid var(--b0-border);
        border-radius: 0.75rem;
        background: var(--b0-background);
      }

      .choice-row--correct {
        border-color: #86efac;
        background: #f0fdf4;
      }

      .choice-label {
        display: grid;
        place-items: center;
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 999px;
        background: var(--b0-surface);
        font-size: 0.75rem;
        font-weight: 800;
      }

      .correct-answer {
        margin: 0;
        color: #166534;
        font-size: 0.875rem;
      }

      .content-description {
        margin: 0;
        color: var(--b0-text-muted);
        line-height: 1.55;
      }

      .metadata-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
        margin: 0;
      }

      .metadata-grid div {
        min-width: 0;
      }

      .metadata-grid__wide {
        grid-column: 1 / -1;
      }

      .metadata-grid dt {
        color: var(--b0-text-muted);
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .metadata-grid dd {
        margin: 0.25rem 0 0;
        overflow-wrap: anywhere;
        font-size: 0.875rem;
      }

      .review-notes {
        padding: 0.9rem;
        border-radius: 0.75rem;
        background: var(--b0-background);
      }

      .review-notes p {
        margin: 0.35rem 0 0;
      }

      .review-card__actions {
        display: flex;
        justify-content: flex-end;
      }

      .primary-action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.6rem;
        padding: 0.6rem 1rem;
        border-radius: 0.75rem;
        background: var(--b0-primary);
        color: white;
        font-weight: 800;
        text-decoration: none;
      }

      .primary-action:hover {
        filter: brightness(0.95);
      }

      @media (max-width: 720px) {
        .review-grid {
          grid-template-columns: 1fr;
        }

        .metadata-grid {
          grid-template-columns: 1fr;
        }

        .metadata-grid__wide {
          grid-column: auto;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminContentReviewQueuePage {
  readonly #api = inject(ApiService);
  readonly #route = inject(ActivatedRoute);

  readonly state$ = this.#route.data.pipe(
    switchMap((routeData) => {
      const apiPath = String(routeData['apiPath'] ?? '/review/content');

      return this.#api.get<ContentReviewListResponse | ContentReviewItem[]>(apiPath).pipe(
        map((response): ApiState<ContentReviewItem[]> => {
          const items = Array.isArray(response) ? response : (response?.data ?? []);

          if (!items.length) {
            return { status: 'empty' };
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

  displayTitle(item: ContentReviewItem): string {
    return item.title || item.content.title || item.content.stem || item.entityId;
  }

  entityTypeLabel(entityType: string): string {
    return entityType
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  normalizedStatus(status: string): string {
    return status.trim().toLowerCase().replaceAll(' ', '_');
  }

  statusLabel(status: string): string {
    return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  countByStatus(items: ContentReviewItem[], status: string): number {
    return items.filter((item) => this.normalizedStatus(item.status) === status).length;
  }

  isCorrectChoice(item: ContentReviewItem, choiceId: string): boolean {
    const correctChoiceId = item.content.explanation?.correctChoiceId;

    if (!correctChoiceId) {
      return false;
    }

    return choiceId.trim().toLowerCase() === correctChoiceId.trim().toLowerCase();
  }

  reload(): void {
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
      };
    };

    if (httpError.status === 401) {
      return 'Your session expired. Please sign in again.';
    }

    if (httpError.status === 403) {
      return 'You do not have permission to view the review queue.';
    }

    return (
      httpError.error?.detail ||
      httpError.error?.message ||
      httpError.error?.title ||
      httpError.message ||
      'The content review queue could not be loaded.'
    );
  }
}
