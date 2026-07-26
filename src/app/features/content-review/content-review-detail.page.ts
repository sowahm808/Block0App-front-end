import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, map, Observable, of, startWith, switchMap } from 'rxjs';
import { ContentReviewChoice, ContentReviewItem } from '../../core/api/api.types';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { ContentReviewService } from './content-review.service';

type ApiState =
  | { status: 'loading' }
  | { status: 'loaded' }
  | { status: 'empty' }
  | { status: 'error'; message: string };

@Component({
  selector: 'b0-content-review-detail',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
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
      } @else if (item(); as review) {
        <article
          class="grid gap-6 rounded-xl border border-[var(--b0-border)] bg-[var(--b0-surface)] p-5 shadow-sm sm:p-6"
        >
          <header>
            <p class="m-0 text-xs font-bold uppercase tracking-wide text-[var(--b0-text-muted)]">
              {{ review.entityType }} · {{ review.status }}
            </p>
            <h2 class="mt-2 text-2xl font-black">
              {{ review.title || review.content.title || review.content.stem || review.entityId }}
            </h2>
            <dl class="grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt class="font-bold">Review ID</dt>
                <dd class="m-0">{{ review.id }}</dd>
              </div>
              <div>
                <dt class="font-bold">Entity ID</dt>
                <dd class="m-0">{{ review.entityId }}</dd>
              </div>
              <div>
                <dt class="font-bold">Status</dt>
                <dd class="m-0">{{ review.status }}</dd>
              </div>
            </dl>
          </header>
          @if (review.content.stem) {
            <section>
              <h3 class="text-lg font-black">Question</h3>
              <p class="leading-7">{{ review.content.stem }}</p>
            </section>
          }
          @if (review.content.choices?.length) {
            <section>
              <h3 class="text-lg font-black">Answer choices</h3>
              <ol class="grid list-none gap-3 p-0">
                @for (choice of review.content.choices; track choice.id) {
                  <li class="rounded-lg border p-3" [class.correct-choice]="isCorrect(choice, review)">
                    <strong>{{ choice.label || choice.id }}.</strong> {{ choice.text }}
                    @if (isCorrect(choice, review)) {
                      <span class="ml-2 font-bold text-[var(--b0-success)]">Correct answer</span>
                    }
                  </li>
                }
              </ol>
            </section>
          }
          @if (correctAnswer(review); as answer) {
            <p><strong>Correct answer:</strong> {{ answer }}</p>
          }
          @if (review.content.explanation?.correctRationale) {
            <section>
              <h3 class="text-lg font-black">Correct rationale</h3>
              <p class="leading-7">{{ review.content.explanation?.correctRationale }}</p>
            </section>
          }
          @if (memoryTip(review); as tip) {
            <section>
              <h3 class="text-lg font-black">Memory tip</h3>
              <p>{{ tip }}</p>
            </section>
          }
          @if (reference(review); as source) {
            <section>
              <h3 class="text-lg font-black">Reference</h3>
              <p>{{ source }}</p>
            </section>
          }
        </article>

        <mat-card class="grid gap-4 p-5">
          <div>
            <h2 class="m-0">Reviewer decision</h2>
            <p class="m-0">Approve the content, request revisions, or reject it.</p>
          </div>
          <label for="review-notes" class="font-bold">Reviewer notes</label>
          <textarea
            id="review-notes"
            class="min-h-32 w-full rounded border p-3"
            [(ngModel)]="notes"
            [disabled]="busy()"
            placeholder="Add reviewer comments"
          ></textarea>
          @if (actionError()) {
            <p class="m-0 text-red-700" role="alert">{{ actionError() }}</p>
          }
          @if (actionMessage()) {
            <p class="m-0 text-emerald-700" role="status">{{ actionMessage() }}</p>
          }
          <div class="flex flex-wrap gap-2">
            <button
              mat-flat-button
              color="primary"
              type="button"
              [disabled]="busy() || isFinalStatus()"
              (click)="approve()"
            >
              Approve
            </button>
            <button
              mat-stroked-button
              type="button"
              [disabled]="busy() || !notes.trim() || isFinalStatus()"
              (click)="requestChanges()"
            >
              Request changes
            </button>
            <button
              mat-stroked-button
              type="button"
              [disabled]="busy() || !notes.trim() || isFinalStatus()"
              (click)="reject()"
            >
              Reject
            </button>
          </div>
        </mat-card>
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
  readonly #reviews = inject(ContentReviewService);
  readonly #route = inject(ActivatedRoute);
  readonly item = signal<ContentReviewItem | null>(null);
  notes = '';
  readonly busy = signal(false);
  readonly actionMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly state$ = this.#route.paramMap.pipe(
    map((params) => params.get('reviewId')?.trim() ?? ''),
    switchMap((reviewId) =>
      !reviewId
        ? of({ status: 'error', message: 'The route is missing the required review ID.' } satisfies ApiState)
        : this.#reviews.get(reviewId).pipe(
            map((item): ApiState => {
              this.item.set(item);
              this.notes = item.notes ?? '';
              return { status: 'loaded' };
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

  approve(): void {
    const item = this.item();
    if (item && !this.isFinalStatus()) this.runAction(this.#reviews.approve(item.id, this.notes), 'Content approved.');
  }

  requestChanges(): void {
    const item = this.item();
    if (!this.notes.trim()) return this.#notesRequired();
    if (item && !this.isFinalStatus())
      this.runAction(this.#reviews.requestChanges(item.id, this.notes), 'Changes requested.');
  }

  reject(): void {
    const item = this.item();
    if (!this.notes.trim()) return this.#notesRequired();
    if (item && !this.isFinalStatus()) this.runAction(this.#reviews.reject(item.id, this.notes), 'Content rejected.');
  }

  isFinalStatus(): boolean {
    const status = this.item()?.status?.trim().toLowerCase();
    return status === 'approved' || status === 'rejected';
  }

  private runAction(request: Observable<ContentReviewItem>, successMessage: string): void {
    if (this.busy()) return;
    this.actionMessage.set(null);
    this.actionError.set(null);
    this.busy.set(true);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (item) => {
        this.item.set(item);
        this.notes = item.notes ?? '';
        this.actionMessage.set(successMessage);
      },
      error: (error: unknown) => this.actionError.set(this.#errorMessage(error)),
    });
  }

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
  #notesRequired(): void {
    this.actionMessage.set(null);
    this.actionError.set('Reviewer notes are required for this decision.');
  }
  #errorMessage(error: unknown): string {
    const http = error as HttpErrorResponse;
    const messages: Record<number, string> = {
      400: 'The review request is invalid. Check the notes and try again.',
      401: 'Your session has expired. Sign in again to continue.',
      403: 'You do not have permission to review this content.',
      404: 'The review record was not found. It may have been removed.',
      409: 'This review changed since it was loaded. Reload the page and try again.',
      422: 'The decision is not allowed, or the reviewer notes are invalid.',
    };
    const problem = http.error as { detail?: string; message?: string } | undefined;
    return (
      messages[http.status] ||
      problem?.detail ||
      problem?.message ||
      http.message ||
      'Unable to update the review record.'
    );
  }
}
