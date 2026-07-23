import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { catchError, map, of, startWith } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { AuthStore } from '../../core/auth/auth.store';
import { Permission } from '../../core/models/roles';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';

interface ApiState<T> { status: 'loading' | 'loaded' | 'empty' | 'error'; data?: T; message?: string }
type AdminDashboardDto = Record<string, unknown>;
interface AdminCard { title: string; description: string; icon: string; route: string; metricKeys: string[]; permissions?: Permission[]; }

const ADMIN_CARDS: AdminCard[] = [
  { title: 'Users', description: 'Manage accounts, roles, and administrator access.', icon: 'manage_accounts', route: '/admin/users', permissions: ['admin.users.read'], metricKeys: ['users', 'userCount', 'totalUsers', 'activeUsers'] },
  { title: 'Challenges', description: 'Create and tune learner challenges, cohorts, and enrollments.', icon: 'flag', route: '/admin/challenges', metricKeys: ['challenges', 'challengeCount', 'activeChallenges'] },
  { title: 'Learning packs', description: 'Maintain learning packs, capsules, questions, and scenarios.', icon: 'library_books', route: '/admin/learning-packs', metricKeys: ['learningPacks', 'packs', 'contentItems', 'capsules'] },
  { title: 'Import content', description: 'Upload learning-pack content for backend processing.', icon: 'upload_file', route: '/admin/learning-packs/import', metricKeys: ['imports', 'pendingImports', 'lastImportCount'] },
  { title: 'Content review', description: 'Monitor review queues before learner-facing publication.', icon: 'rate_review', route: '/admin/content-review', metricKeys: ['pendingReviews', 'reviews', 'contentReview'] },
  { title: 'Reports', description: 'Open operational reports and learner progress analytics.', icon: 'analytics', route: '/admin/reports', metricKeys: ['reports', 'reportCount'] },
  { title: 'Audit', description: 'Inspect administrative audit events and policy-sensitive changes.', icon: 'policy', route: '/admin/audit', metricKeys: ['auditEvents', 'events', 'recentAuditEvents'] },
  { title: 'System settings', description: 'Configure production settings and feature availability.', icon: 'settings', route: '/admin/system-settings', metricKeys: ['settings', 'featureFlags', 'enabledFlags'] },
];

@Component({
  selector: 'b0-admin-dashboard',
  standalone: true,
  imports: [AsyncPipe, NgTemplateOutlet, RouterLink, MatButtonModule, MatCardModule, MatIconModule, PageHeaderComponent, LoadingSkeletonComponent, EmptyStateComponent, ErrorStateComponent],
  template: `<b0-page-header title="Admin Dashboard" description="Production workspace for managing Block Zero users, content, reporting, and platform settings." />
  @if (state$ | async; as state) {
    @if (state.status === 'loading') { <b0-loading-skeleton [rows]="4" /> }
    @else if (state.status === 'error') {
      <b0-error-state [message]="state.message || 'Unable to load admin dashboard metrics. Navigation remains available below.'" (retry)="reload()" />
      <ng-container [ngTemplateOutlet]="cards" [ngTemplateOutletContext]="{ data: undefined }" />
    } @else {
      <ng-container [ngTemplateOutlet]="cards" [ngTemplateOutletContext]="{ data: state.data }" />
    }
  } @else { <b0-empty-state title="Admin dashboard is starting" message="Navigation will appear shortly." /> }
  <ng-template #cards let-data="data">
    @let visible = visibleCards();
    @if (!visible.length) { <b0-empty-state title="No administration pages available" message="Your active account does not currently include administration access." /> }
    @else { <section class="feature-card-grid" aria-label="Admin navigation cards">
      @for (card of visible; track card.route) { <mat-card class="feature-data-card">
        <mat-card-header><mat-icon mat-card-avatar>{{ card.icon }}</mat-icon><mat-card-title>{{ card.title }}</mat-card-title><mat-card-subtitle>{{ card.description }}</mat-card-subtitle></mat-card-header>
        <mat-card-content>@if (metric(data, card)) { <p class="text-2xl font-black">{{ metric(data, card) }}</p> }</mat-card-content>
        <mat-card-actions><a mat-flat-button color="primary" [routerLink]="card.route">Open {{ card.title }}</a></mat-card-actions>
      </mat-card> }
    </section> }
  </ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage {
  readonly #api = inject(ApiService); readonly #store = inject(AuthStore);
  readonly state$ = this.#api.get<AdminDashboardDto>('/admin/dashboard').pipe(map((data) => ({ status: data ? 'loaded' : 'empty', data }) satisfies ApiState<AdminDashboardDto>), startWith({ status: 'loading' } satisfies ApiState<AdminDashboardDto>), catchError((error: unknown) => of({ status: 'error', message: error instanceof Error ? error.message : 'Backend endpoint /admin/dashboard is unavailable.' } satisfies ApiState<AdminDashboardDto>)));
  visibleCards() { return ADMIN_CARDS.filter((card) => !card.permissions || this.#store.hasPermission(card.permissions)); }
  metric(data: AdminDashboardDto | undefined, card: AdminCard) {
    const value = card.metricKeys.map((key) => data?.[key]).find((candidate) => typeof candidate === 'string' || typeof candidate === 'number');
    return value == null ? '' : String(value);
  }
  reload() { window.location.reload(); }
}
