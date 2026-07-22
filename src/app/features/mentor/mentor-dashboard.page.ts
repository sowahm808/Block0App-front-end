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
import { MentorDashboardDto, MentorDashboardService } from './mentor-dashboard.service';

interface ApiState<T> { status: 'loading' | 'loaded' | 'empty' | 'error'; data?: T; message?: string }
interface MentorCard { title: string; description: string; icon: string; route: string; permissions: string[]; metric?: keyof MentorDashboardDto; }

const MENTOR_CARDS: MentorCard[] = [
  { title: 'Mentor teams', description: 'Open assigned teams and drill into scholars with real IDs.', icon: 'groups', route: '/mentor/teams', permissions: ['mentor.teams.read'], metric: 'teams' },
  { title: 'Support requests', description: 'Review scholar support requests and open real request details.', icon: 'support_agent', route: '/mentor/support-requests', permissions: ['mentor.support.read'], metric: 'supportRequests' },
];

@Component({
  selector: 'b0-mentor-dashboard', standalone: true,
  imports: [AsyncPipe, NgTemplateOutlet, RouterLink, MatButtonModule, MatCardModule, MatIconModule, PageHeaderComponent, LoadingSkeletonComponent, EmptyStateComponent, ErrorStateComponent],
  template: `<b0-page-header title="Mentor dashboard" description="Mentor workspace for assigned teams, support requests, and scholar progress reached through real records." />
    @if (state$ | async; as state) {
      @if (state.status === 'loading') { <b0-loading-skeleton [rows]="4" /> }
      @else if (state.status === 'error') {
        <b0-error-state [message]="state.message || 'Unable to load mentor dashboard metrics. Navigation remains available below.'" (retry)="reload()" />
        <ng-container [ngTemplateOutlet]="cards" [ngTemplateOutletContext]="{ data: undefined }" />
      } @else {
        <ng-container [ngTemplateOutlet]="cards" [ngTemplateOutletContext]="{ data: state.data }" />
      }
    } @else { <b0-empty-state title="Mentor dashboard is starting" message="Navigation will appear shortly." /> }
    <ng-template #cards let-data="data">
      @let visible = visibleCards();
      @if (!visible.length) { <b0-empty-state title="No mentor pages available" message="Your active account does not currently include any mentor permissions." /> }
      @else { <section class="feature-card-grid" aria-label="Mentor navigation cards">
        @for (card of visible; track card.route) { <mat-card class="feature-data-card">
          <mat-card-header><mat-icon mat-card-avatar>{{ card.icon }}</mat-icon><mat-card-title>{{ card.title }}</mat-card-title><mat-card-subtitle>{{ card.description }}</mat-card-subtitle></mat-card-header>
          <mat-card-content>@if (metric(data, card)) { <p class="text-2xl font-black">{{ metric(data, card) }}</p> }</mat-card-content>
          <mat-card-actions><a mat-flat-button color="primary" [routerLink]="card.route">Open {{ card.title }}</a></mat-card-actions>
        </mat-card> }
      </section> }
    </ng-template>`, changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorDashboardPage {
  readonly #service = inject(MentorDashboardService); readonly #store = inject(AuthStore);
  readonly state$ = this.#service.getDashboard().pipe(map((data) => ({ status: data ? 'loaded' : 'empty', data }) satisfies ApiState<MentorDashboardDto>), startWith({ status: 'loading' } satisfies ApiState<MentorDashboardDto>), catchError((error: unknown) => of({ status: 'error', message: error instanceof Error ? error.message : 'Backend endpoint /mentor/dashboard is unavailable.' } satisfies ApiState<MentorDashboardDto>)));
  visibleCards() { return MENTOR_CARDS.filter((card) => this.#store.hasPermission(card.permissions)); }
  metric(data: MentorDashboardDto | undefined, card: MentorCard) { const value = card.metric ? data?.[card.metric] : undefined; return value == null ? '' : String(value); }
  reload() { window.location.reload(); }
}
