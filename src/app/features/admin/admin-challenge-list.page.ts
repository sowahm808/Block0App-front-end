import { AsyncPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';
import { AdminChallenge, AdminChallengeListResponse } from '../../core/api/api.types';
import { AdminChallengeApiService } from '../../core/api/remaining-feature-api.services';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'loaded' };
type SortOption = 'updated-desc' | 'start-asc' | 'title-asc';

@Component({
  selector: 'b0-admin-challenge-list',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    EmptyStateComponent,
    ErrorStateComponent,
    FormsModule,
    LoadingSkeletonComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    PageHeaderComponent,
    RouterLink,
    TitleCasePipe,
  ],
  template: `
    <b0-page-header
      title="Challenge management"
      description="Plan, schedule, publish, and configure every challenge program."
    >
      <a mat-flat-button color="primary" routerLink="/admin/challenges/new"><mat-icon>add</mat-icon>Create challenge</a>
    </b0-page-header>

    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="5" />
      } @else if (state.status === 'error') {
        <b0-error-state [message]="state.message" (retry)="reload()" />
      } @else {
        <section class="summary" aria-label="Challenge status summary">
          <button type="button" [class.selected]="statusFilter() === 'all'" (click)="setStatus('all')">
            <strong>{{ challenges().length }}</strong
            ><span>All challenges</span>
          </button>
          @for (item of statusSummary(); track item.status) {
            <button type="button" [class.selected]="statusFilter() === item.status" (click)="setStatus(item.status)">
              <strong>{{ item.count }}</strong
              ><span>{{ item.status | titlecase }}</span>
            </button>
          }
        </section>

        <section class="toolbar" aria-label="Challenge list controls">
          <label class="search"
            ><span>Search challenges</span>
            <div>
              <mat-icon>search</mat-icon
              ><input
                type="search"
                placeholder="Search name, slug, audience, or ID"
                [ngModel]="query()"
                (ngModelChange)="updateQuery($event)"
              /></div
          ></label>
          <label
            ><span>Status</span
            ><select [ngModel]="statusFilter()" (ngModelChange)="setStatus($event)">
              <option value="all">All statuses</option>
              @for (status of statuses(); track status) {
                <option [value]="status">{{ status | titlecase }}</option>
              }
            </select></label
          >
          <label
            ><span>Sort by</span
            ><select [ngModel]="sort()" (ngModelChange)="updateSort($event)">
              <option value="updated-desc">Recently updated</option>
              <option value="start-asc">Start date</option>
              <option value="title-asc">Challenge name</option>
            </select></label
          >
          <p aria-live="polite">{{ filtered().length }} result{{ filtered().length === 1 ? '' : 's' }}</p>
        </section>

        @if (challenges().length === 0) {
          <b0-empty-state title="No challenges yet" message="Create a challenge to start building a program." />
        } @else if (filtered().length === 0) {
          <b0-empty-state title="No matching challenges" message="Clear or change the search and status filters." />
        } @else {
          <section class="table-shell" aria-label="Challenges">
            <table>
              <thead>
                <tr>
                  <th>Challenge</th>
                  <th>Status</th>
                  <th>Schedule</th>
                  <th>Program</th>
                  <th>Last updated</th>
                  <th><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                @for (challenge of page(); track challenge.id) {
                  <tr>
                    <td>
                      <a class="name" [routerLink]="['/admin/challenges', challenge.id]">{{
                        challenge.title || 'Untitled challenge'
                      }}</a>
                      @if (challenge.description) {
                        <span class="description">{{ challenge.description }}</span>
                      }
                      @if (challenge.slug) {
                        <span class="slug">{{ challenge.slug }}</span>
                      }
                    </td>
                    <td>
                      <span class="badge" [attr.data-status]="status(challenge)">{{
                        status(challenge) | titlecase
                      }}</span>
                    </td>
                    <td>
                      @if (challenge.startsAtUtc) {
                        <strong>{{ challenge.startsAtUtc | date: 'mediumDate' }}</strong
                        ><span>{{ scheduleDetail(challenge) }}</span>
                      } @else {
                        <span class="muted">Unscheduled</span>
                      }
                    </td>
                    <td>
                      <strong>{{ challenge.learningPackCount ?? 0 }} packs</strong
                      ><span
                        >{{ challenge.cohortCount ?? 0 }} cohorts · {{ challenge.enrollmentCount ?? 0 }} enrolled</span
                      >
                    </td>
                    <td>
                      @if (updatedAt(challenge); as updated) {
                        {{ updated | date: 'mediumDate' }}
                      } @else {
                        <span class="muted">—</span>
                      }
                    </td>
                    <td class="actions">
                      <a mat-stroked-button [routerLink]="['/admin/challenges', challenge.id]">View</a
                      ><button
                        mat-icon-button
                        [matMenuTriggerFor]="actions"
                        [attr.aria-label]="'Manage ' + challenge.title"
                      >
                        <mat-icon>more_vert</mat-icon></button
                      ><mat-menu #actions="matMenu"
                        ><a mat-menu-item [routerLink]="['/admin/challenges', challenge.id]">Edit challenge</a
                        ><a
                          mat-menu-item
                          [routerLink]="['/admin/challenges', challenge.id]"
                          [queryParams]="{ section: 'schedule' }"
                          >Manage schedule</a
                        ><a
                          mat-menu-item
                          routerLink="/admin/learning-packs"
                          [queryParams]="{ challengeId: challenge.id }"
                          >Manage learning packs</a
                        ><a mat-menu-item routerLink="/admin/cohorts" [queryParams]="{ challengeId: challenge.id }"
                          >Assign cohort</a
                        >
                        @if (
                          status(challenge) !== 'published' &&
                          status(challenge) !== 'active' &&
                          status(challenge) !== 'archived'
                        ) {
                          <button
                            mat-menu-item
                            [disabled]="busyId() === challenge.id"
                            (click)="changeLifecycle(challenge, 'publish')"
                          >
                            Publish
                          </button>
                        }
                        @if (status(challenge) !== 'archived') {
                          <button
                            mat-menu-item
                            class="danger"
                            [disabled]="busyId() === challenge.id"
                            (click)="changeLifecycle(challenge, 'archive')"
                          >
                            Archive
                          </button>
                        }
                      </mat-menu>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </section>
          <mat-paginator
            [length]="filtered().length"
            [pageIndex]="pageIndex()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="paginate($event)"
            aria-label="Challenge pages"
          />
        }
        @if (actionError()) {
          <p class="action-error" role="alert">{{ actionError() }}</p>
        }
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .summary {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 0.75rem;
        margin: 1.5rem 0;
      }
      .summary button {
        background: #fff;
        border: 1px solid #dbe3ec;
        border-radius: 12px;
        color: #526170;
        cursor: pointer;
        padding: 1rem;
        text-align: left;
      }
      .summary button.selected {
        border-color: #0874aa;
        box-shadow: inset 0 0 0 1px #0874aa;
      }
      .summary strong,
      .summary span {
        display: block;
      }
      .summary strong {
        color: #17212b;
        font-size: 1.45rem;
        margin-bottom: 0.2rem;
      }
      .toolbar {
        align-items: end;
        background: #f7f9fb;
        border: 1px solid #dbe3ec;
        border-radius: 14px;
        display: grid;
        gap: 1rem;
        grid-template-columns: minmax(16rem, 2fr) minmax(10rem, 1fr) minmax(11rem, 1fr) auto;
        margin-bottom: 1rem;
        padding: 1rem;
      }
      .toolbar label {
        display: grid;
        font-size: 0.78rem;
        font-weight: 750;
        gap: 0.35rem;
      }
      .toolbar input,
      .toolbar select {
        background: #fff;
        border: 1px solid #aebdca;
        border-radius: 8px;
        color: #17212b;
        font: inherit;
        padding: 0.65rem;
        width: 100%;
      }
      .search div {
        align-items: center;
        display: flex;
        position: relative;
      }
      .search mat-icon {
        color: #617080;
        left: 0.6rem;
        position: absolute;
      }
      .search input {
        padding-left: 2.4rem;
      }
      .toolbar p {
        color: #526170;
        margin: 0 0 0.7rem;
        white-space: nowrap;
      }
      .table-shell {
        background: #fff;
        border: 1px solid #dbe3ec;
        border-radius: 14px;
        overflow: auto;
      }
      table {
        border-collapse: collapse;
        min-width: 900px;
        width: 100%;
      }
      th {
        background: #f7f9fb;
        color: #526170;
        font-size: 0.72rem;
        letter-spacing: 0.04em;
        text-align: left;
        text-transform: uppercase;
      }
      th,
      td {
        border-bottom: 1px solid #e5ebf0;
        padding: 1rem;
        vertical-align: middle;
      }
      tbody tr:last-child td {
        border-bottom: 0;
      }
      .name {
        color: #075f8f;
        display: block;
        font-size: 1rem;
        font-weight: 800;
        text-decoration: none;
      }
      .description {
        color: #526170;
        display: -webkit-box;
        font-size: 0.8rem;
        max-width: 24rem;
        overflow: hidden;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
      }
      .slug,
      td span {
        color: #657383;
        display: block;
        font-size: 0.76rem;
        margin-top: 0.2rem;
      }
      .badge {
        background: #e9eef3 !important;
        border-radius: 999px;
        color: #354554 !important;
        display: inline-block !important;
        font-weight: 800;
        margin: 0 !important;
        padding: 0.35rem 0.65rem;
      }
      .badge[data-status='active'],
      .badge[data-status='published'] {
        background: #dcf7e7 !important;
        color: #166534 !important;
      }
      .badge[data-status='scheduled'] {
        background: #e5efff !important;
        color: #194e91 !important;
      }
      .badge[data-status='draft'] {
        background: #fff3d6 !important;
        color: #755000 !important;
      }
      .badge[data-status='archived'] {
        background: #edf0f2 !important;
        color: #59636d !important;
      }
      .actions {
        align-items: center;
        display: flex;
        justify-content: flex-end;
        white-space: nowrap;
      }
      .muted {
        color: #7d8994;
      }
      .danger {
        color: #a51d2d;
      }
      .action-error {
        background: #fff1f2;
        border: 1px solid #fecdd3;
        border-radius: 8px;
        color: #9f1239;
        padding: 0.75rem;
      }
      .sr-only {
        clip: rect(0, 0, 0, 0);
        clip-path: inset(50%);
        height: 1px;
        overflow: hidden;
        position: absolute;
        white-space: nowrap;
        width: 1px;
      }
      @media (max-width: 850px) {
        .summary {
          grid-template-columns: repeat(2, 1fr);
        }
        .toolbar {
          grid-template-columns: 1fr;
        }
        .toolbar p {
          margin: 0;
        }
        .table-shell {
          border: 0;
          overflow: visible;
        }
        table,
        tbody {
          display: block;
          min-width: 0;
        }
        thead {
          display: none;
        }
        tr {
          background: #fff;
          border: 1px solid #dbe3ec;
          border-radius: 14px;
          display: grid;
          gap: 0.8rem;
          margin-bottom: 1rem;
          padding: 1rem;
        }
        td {
          border: 0;
          display: block;
          padding: 0;
        }
        .actions {
          justify-content: flex-start;
        }
        .description {
          max-width: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminChallengeListPage {
  readonly #api = inject(AdminChallengeApiService);
  readonly #reload = new Subject<void>();
  readonly challenges = signal<AdminChallenge[]>([]);
  readonly query = signal('');
  readonly statusFilter = signal('all');
  readonly sort = signal<SortOption>('updated-desc');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly busyId = signal('');
  readonly actionError = signal('');
  readonly state$ = this.#reload.pipe(
    startWith(undefined),
    switchMap(() =>
      this.#api.challenges().pipe(
        map((response) => {
          this.challenges.set(this.unwrap(response));
          return { status: 'loaded' } satisfies LoadState;
        }),
        startWith({ status: 'loading' } satisfies LoadState),
        catchError((error: unknown) =>
          of({
            status: 'error',
            message: error instanceof Error ? error.message : 'Challenges could not be loaded.',
          } satisfies LoadState),
        ),
      ),
    ),
  );
  readonly statuses = computed(() => [...new Set(this.challenges().map((item) => this.status(item)))].sort());
  readonly statusSummary = computed(() =>
    this.statuses().map((status) => ({
      status,
      count: this.challenges().filter((item) => this.status(item) === status).length,
    })),
  );
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase(),
      filter = this.statusFilter();
    return this.challenges()
      .filter(
        (c) =>
          (filter === 'all' || this.status(c) === filter) &&
          (!q || [c.title, c.slug, c.audience, c.id].some((v) => v?.toLowerCase().includes(q))),
      )
      .sort((a, b) => this.compare(a, b));
  });
  readonly page = computed(() =>
    this.filtered().slice(this.pageIndex() * this.pageSize(), (this.pageIndex() + 1) * this.pageSize()),
  );
  reload() {
    this.#reload.next();
  }
  status(c: AdminChallenge) {
    return (c.publicationStatus || c.status || 'draft').toLowerCase();
  }
  updatedAt(c: AdminChallenge) {
    return c.updatedAtUtc || c.updatedUtc || c.createdAtUtc || c.createdUtc;
  }
  scheduleDetail(c: AdminChallenge) {
    if (c.endsAtUtc)
      return `Ends ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(c.endsAtUtc))}`;
    return c.durationDays ? `${c.durationDays} days` : 'Start date set';
  }
  setStatus(value: string) {
    this.statusFilter.set(value);
    this.pageIndex.set(0);
  }
  updateQuery(value: string) {
    this.query.set(value);
    this.pageIndex.set(0);
  }
  updateSort(value: SortOption) {
    this.sort.set(value);
    this.pageIndex.set(0);
  }
  paginate(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
  changeLifecycle(challenge: AdminChallenge, action: 'publish' | 'archive') {
    if (
      action === 'archive' &&
      !window.confirm(`Archive ${challenge.title}? Scholars will no longer see it as active.`)
    )
      return;
    this.busyId.set(challenge.id);
    this.actionError.set('');
    this.#api[action](challenge.id).subscribe({
      next: () => {
        this.busyId.set('');
        this.reload();
      },
      error: () => {
        this.busyId.set('');
        this.actionError.set(
          `${challenge.title} could not be ${action === 'publish' ? 'published' : 'archived'}. Try again or check the audit log.`,
        );
      },
    });
  }
  unwrap(response: AdminChallengeListResponse | AdminChallenge[]) {
    return Array.isArray(response) ? response : (response.items ?? response.data ?? []);
  }
  private compare(a: AdminChallenge, b: AdminChallenge) {
    if (this.sort() === 'title-asc') return a.title.localeCompare(b.title);
    if (this.sort() === 'start-asc') return (a.startsAtUtc || '9999').localeCompare(b.startsAtUtc || '9999');
    return (this.updatedAt(b) || '').localeCompare(this.updatedAt(a) || '');
  }
}
