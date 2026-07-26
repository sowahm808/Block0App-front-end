import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { ContentReviewChoice, ContentReviewDetailResponse, ContentReviewItem } from '../../core/api/api.types';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

type ApiState =
  | { status: 'loading' }
  | { status: 'loaded'; data: ContentReviewItem }
  | { status: 'empty' }
  | { status: 'error'; message: string };

@Component({
  selector: 'b0-content-review-detail',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    PageHeaderComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `<section class="grid gap-5">
    <a class="font-bold text-[var(--b0-primary)]" routerLink="/review/content">← Review queue</a>
    <b0-page-header title="Review Content" description="Inspect the selected draft and its answer explanation." />
    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="6" label="Loading review record" />
      } @else if (state.status === 'error') {
        <b0-error-state title="Unable to load review" [message]="state.message" />
      } @else if (state.status === 'empty') {
        <b0-empty-state
          icon="search_off"
          title="Review record not found"
          message="The selected record does not exist or is no longer available."
        />
      } @else {
        <article
          class="grid gap-6 rounded-xl border border-[var(--b0-border)] bg-[var(--b0-surface)] p-5 shadow-sm sm:p-6"
        >
          <header>
            <p class="m-0 text-xs font-bold uppercase tracking-wide text-[var(--b0-text-muted)]">
              {{ state.data.entityType }} · {{ state.data.status }}
            </p>
            <h2 class="mt-2 text-2xl font-black">
              {{ state.data.title || state.data.content.title || state.data.content.stem || state.data.entityId }}
            </h2>
            <dl class="grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt class="font-bold">Review ID</dt>
                <dd class="m-0">{{ state.data.id }}</dd>
              </div>
              <div>
                <dt class="font-bold">Entity ID</dt>
                <dd class="m-0">{{ state.data.entityId }}</dd>
              </div>
              <div>
                <dt class="font-bold">Status</dt>
                <dd class="m-0">{{ state.data.status }}</dd>
              </div>
            </dl>
          </header>
          @if (state.data.content.stem) {
            <section>
              <h3 class="text-lg font-black">Question</h3>
              <p class="leading-7">{{ state.data.content.stem }}</p>
            </section>
          }
          @if (state.data.content.choices?.length) {
            <section>
              <h3 class="text-lg font-black">Answer choices</h3>
              <ol class="grid list-none gap-3 p-0">
                @for (choice of state.data.content.choices; track choice.id) {
                  <li class="rounded-lg border p-3" [class.correct-choice]="isCorrect(choice, state.data)">
                    <strong>{{ choice.label || choice.id }}.</strong> {{ choice.text }}
                    @if (isCorrect(choice, state.data)) {
                      <span class="ml-2 font-bold text-[var(--b0-success)]">Correct answer</span>
                    }
                  </li>
                }
              </ol>
            </section>
          }
          @if (correctAnswer(state.data); as answer) {
            <p><strong>Correct answer:</strong> {{ answer }}</p>
          }
          @if (state.data.content.explanation?.correctRationale) {
            <section>
              <h3 class="text-lg font-black">Correct rationale</h3>
              <p class="leading-7">{{ state.data.content.explanation?.correctRationale }}</p>
            </section>
          }
          @if (memoryTip(state.data); as tip) {
            <section>
              <h3 class="text-lg font-black">Memory tip</h3>
              <p>{{ tip }}</p>
            </section>
          }
          @if (reference(state.data); as source) {
            <section>
              <h3 class="text-lg font-black">Reference</h3>
              <p>{{ source }}</p>
            </section>
          }
        </article>
      }
    }
  </section>`,
  styles: [
    `
      .correct-choice {
        border-color: var(--b0-success);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentReviewDetailPage {
  readonly #api = inject(ApiService);
  readonly #route = inject(ActivatedRoute);
  readonly state$ = this.#route.paramMap.pipe(
    map((params) => params.get('reviewId')?.trim() ?? ''),
    switchMap((reviewId) =>
      !reviewId
        ? of({ status: 'error', message: 'The route is missing the required review ID.' } satisfies ApiState)
        : this.#api.get<ContentReviewDetailResponse>(`/review/content/${encodeURIComponent(reviewId)}`).pipe(
            map((response): ApiState => {
              const item = this.#normalize(response);
              return item
                ? { status: 'loaded', data: item }
                : { status: 'error', message: 'The review service returned a malformed response.' };
            }),
            startWith({ status: 'loading' } satisfies ApiState),
            catchError((error: unknown) =>
              error instanceof HttpErrorResponse && error.status === 404
                ? of({ status: 'empty' } satisfies ApiState)
                : of({ status: 'error', message: this.#errorMessage(error) } satisfies ApiState),
            ),
          ),
    ),
  );

  isCorrect(choice: ContentReviewChoice, item: ContentReviewItem): boolean {
    return this.#canonical(choice.id) === this.#canonical(item.content.explanation?.correctChoiceId);
  }
  correctAnswer(item: ContentReviewItem): string | undefined {
    const id = item.content.explanation?.correctChoiceId;
    if (!id) return undefined;
    const choice = item.content.choices?.find((candidate) => this.isCorrect(candidate, item));
    return choice ? `${choice.label || choice.id}. ${choice.text}` : id.toUpperCase();
  }
  memoryTip(item: ContentReviewItem) {
    return item.content.memoryTip || item.content.explanation?.memoryTip;
  }
  reference(item: ContentReviewItem) {
    return item.content.reference || item.content.explanation?.reference;
  }
  #canonical(value: string | undefined) {
    return value?.trim().toLowerCase() ?? '';
  }
  #normalize(response: ContentReviewDetailResponse | null | undefined): ContentReviewItem | null {
    const candidate = response && typeof response === 'object' && 'data' in response ? response.data : response;
    return candidate &&
      typeof candidate.id === 'string' &&
      candidate.id.trim() &&
      candidate.content &&
      typeof candidate.content === 'object'
      ? candidate
      : null;
  }
  #errorMessage(error: unknown): string {
    const http = error as HttpErrorResponse;
    if (http.status === 401) return 'Your session has expired. Sign in again to continue.';
    if (http.status === 403) return 'You do not have permission to review this content.';
    const problem = http.error as { detail?: string; message?: string } | undefined;
    return problem?.detail || problem?.message || http.message || 'Unable to load the review record.';
  }
}
