import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgTemplateOutlet, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { catchError, map, of, startWith } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { ReviewerDashboardDto, ReviewerDashboardService } from './reviewer-dashboard.service';

interface ApiState<T> { status: 'loading' | 'loaded' | 'empty' | 'error'; data?: T; message?: string }
interface ReviewCard { title: string; description: string; icon: string; route: string; permissions: string[]; metric?: keyof ReviewerDashboardDto; }

const REVIEW_CARDS: ReviewCard[] = [
  { title: 'Review queue', description: 'Triage content waiting for reviewer action.', icon: 'inbox', route: '/review/content', permissions: ['content.review'], metric: 'pendingReviews' },
  { title: 'Question reviews', description: 'Open question-level submissions with real review IDs.', icon: 'quiz', route: '/review/questions', permissions: ['content.read'], metric: 'questionReviews' },
  { title: 'Scenario reviews', description: 'Review clinical scenario drafts and revisions.', icon: 'psychology_alt', route: '/review/scenarios', permissions: ['content.read'], metric: 'scenarioReviews' },
  { title: 'AI drafts', description: 'Inspect AI-generated drafts before publication.', icon: 'smart_toy', route: '/review/ai-drafts', permissions: ['content.review'], metric: 'aiDrafts' },
  { title: 'Review history', description: 'Audit previous approval and rejection decisions.', icon: 'history', route: '/review/history', permissions: ['content.read'], metric: 'completedReviews' },
  { title: 'Import learning pack', description: 'Upload learning-pack content when the backend grants import authorization.', icon: 'upload_file', route: '/review/import-learning-pack', permissions: ['content.import'], metric: 'imports' },
];

@Component({
  selector: 'b0-review-dashboard', standalone: true,
  imports: [AsyncPipe, NgTemplateOutlet, RouterLink, MatButtonModule, MatCardModule, MatIconModule, PageHeaderComponent, LoadingSkeletonComponent, EmptyStateComponent, ErrorStateComponent],
  template: `<b0-page-header title="Review dashboard" description="Content-review workspace for queues, drafts, history, and import workflows." />
    @if (state$ | async; as state) {
      @if (state.status === 'loading') { <b0-loading-skeleton [rows]="4" /> }
      @else if (state.status === 'error') {
        <b0-error-state [message]="state.message || 'Unable to load review dashboard metrics. Navigation remains available below.'" (retry)="reload()" />
        <ng-container [ngTemplateOutlet]="cards" [ngTemplateOutletContext]="{ data: undefined }" />
      } @else {
        <ng-container [ngTemplateOutlet]="cards" [ngTemplateOutletContext]="{ data: state.data }" />
      }
    } @else { <b0-empty-state title="Review dashboard is starting" message="Navigation will appear shortly." /> }
    <ng-template #cards let-data="data">
      @let visible = visibleCards();
      @if (!visible.length) { <b0-empty-state title="No review pages available" message="Your active account does not currently include any review permissions." /> }
      @else { <section class="feature-card-grid" aria-label="Review navigation cards">
        @for (card of visible; track card.route) { <mat-card class="feature-data-card">
          <mat-card-header><mat-icon mat-card-avatar>{{ card.icon }}</mat-icon><mat-card-title>{{ card.title }}</mat-card-title><mat-card-subtitle>{{ card.description }}</mat-card-subtitle></mat-card-header>
          <mat-card-content>@if (metric(data, card)) { <p class="text-2xl font-black">{{ metric(data, card) }}</p> }</mat-card-content>
          <mat-card-actions><a mat-flat-button color="primary" [routerLink]="card.route">Open {{ card.title }}</a></mat-card-actions>
        </mat-card> }
      </section> }
    </ng-template>`, changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewDashboardPage {
  readonly #service = inject(ReviewerDashboardService); readonly #store = inject(AuthStore);
  readonly state$ = this.#service.getDashboard().pipe(map((data) => ({ status: data ? 'loaded' : 'empty', data }) satisfies ApiState<ReviewerDashboardDto>), startWith({ status: 'loading' } satisfies ApiState<ReviewerDashboardDto>), catchError((error: unknown) => of({ status: 'error', message: error instanceof Error ? error.message : 'Backend endpoint /review/dashboard is unavailable.' } satisfies ApiState<ReviewerDashboardDto>)));
  visibleCards() { return REVIEW_CARDS.filter((card) => this.#store.hasPermission(card.permissions)); }
  metric(data: ReviewerDashboardDto | undefined, card: ReviewCard) { const value = card.metric ? data?.[card.metric] : undefined; return value == null ? '' : String(value); }
  reload() { window.location.reload(); }
}
