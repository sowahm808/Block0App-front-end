import { AsyncPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { AdminCohortListItem, AdminCohortListResponse } from '../../core/api/api.types';
import { AdminCohortApiService } from '../../core/api/remaining-feature-api.services';
import { AuthStore } from '../../core/auth/auth.store';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

type ApiState<T> =
  | { status: 'loading' }
  | { status: 'loaded'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string };
type SortOption = 'updated' | 'name' | 'start' | 'members' | 'utilization';

export function normalizeCohortList(response: AdminCohortListItem[] | AdminCohortListResponse): AdminCohortListItem[] {
  if (Array.isArray(response)) return response;
  const items = response.items ?? response.data ?? response.cohorts;
  if (!items) throw new Error('Malformed cohort-list response.');
  return items;
}

@Component({
  selector: 'b0-admin-cohort-list',
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
    MatProgressBarModule,
    MatTooltipModule,
    PageHeaderComponent,
    RouterLink,
  ],
  template: ` <b0-page-header
      title="Cohort Management"
      description="Create cohorts, manage scholars and mentors, and coordinate challenge delivery."
    >
      @if (can('cohorts.create')) {
        <a mat-flat-button color="primary" routerLink="/admin/cohorts/new"><mat-icon>add</mat-icon>Create cohort</a>
      }
    </b0-page-header>
    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="6" />
      } @else if (state.status === 'error') {
        <div role="alert"><b0-error-state [message]="state.message" (retry)="refresh()" /></div>
      } @else {
        <section class="summary" aria-label="Cohort summary">
          <div>
            <strong>{{ cohorts().length }}</strong
            ><span>Total cohorts</span>
          </div>
          <div>
            <strong>{{ countStatus('active') }}</strong
            ><span>Active</span>
          </div>
          <div>
            <strong>{{ countStatus('upcoming') }}</strong
            ><span>Upcoming</span>
          </div>
          <div>
            <strong>{{ fullCount() }}</strong
            ><span>Full</span>
          </div>
          <div>
            <strong>{{ enrolledCount() }}</strong
            ><span>Enrolled scholars</span>
          </div>
        </section>
        <section class="toolbar" aria-label="Cohort list controls">
          <label class="search"
            ><span>Search</span>
            <div>
              <mat-icon>search</mat-icon
              ><input
                type="search"
                placeholder="Name, challenge, mentor, or description"
                [ngModel]="query()"
                (ngModelChange)="setQuery($event)"
              /></div
          ></label>
          <label
            ><span>Challenge</span
            ><select [ngModel]="challenge()" (ngModelChange)="challenge.set($event); resetPage()">
              <option value="all">All challenges</option>
              @for (value of challenges(); track value) {
                <option [value]="value">{{ value }}</option>
              }
            </select></label
          >
          <label
            ><span>Status</span
            ><select [ngModel]="status()" (ngModelChange)="status.set($event); resetPage()">
              <option value="all">All statuses</option>
              @for (value of statuses(); track value) {
                <option [value]="value">{{ statusLabel(value) }}</option>
              }
            </select></label
          >
          <label
            ><span>Mentor</span
            ><select [ngModel]="mentor()" (ngModelChange)="mentor.set($event); resetPage()">
              <option value="all">All mentors</option>
              <option value="unassigned">Unassigned</option>
              @for (value of mentors(); track value) {
                <option [value]="value">{{ value }}</option>
              }
            </select></label
          >
          <label
            ><span>Capacity</span
            ><select [ngModel]="capacity()" (ngModelChange)="capacity.set($event); resetPage()">
              <option value="all">Any capacity</option>
              <option value="available">Space available</option>
              <option value="near-full">Near full</option>
              <option value="full">Full / over</option>
            </select></label
          >
          <label
            ><span>Dates</span
            ><select [ngModel]="schedule()" (ngModelChange)="schedule.set($event); resetPage()">
              <option value="all">Any schedule</option>
              <option value="scheduled">Scheduled</option>
              <option value="unscheduled">Unscheduled</option>
            </select></label
          >
          <label
            ><span>Sort</span
            ><select [ngModel]="sort()" (ngModelChange)="sort.set($event); resetPage()">
              <option value="updated">Recently updated</option>
              <option value="name">Name</option>
              <option value="start">Start date</option>
              <option value="members">Member count</option>
              <option value="utilization">Capacity utilization</option>
            </select></label
          >
          <div class="toolbar-actions">
            <button mat-stroked-button type="button" (click)="clearFilters()">Clear</button
            ><button
              mat-icon-button
              type="button"
              matTooltip="Refresh cohorts"
              aria-label="Refresh cohorts"
              (click)="refresh()"
            >
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </section>
        @if (state.status === 'empty') {
          <b0-empty-state title="No cohorts yet" message="Create a cohort to coordinate challenge delivery." />
        } @else if (filtered().length === 0) {
          <b0-empty-state title="No matching cohorts" message="Clear or change the cohort filters." />
        } @else {
          <section class="table-shell" aria-label="Cohorts">
            <table>
              <thead>
                <tr>
                  <th>Cohort</th>
                  <th>Challenge</th>
                  <th>Status</th>
                  <th>Schedule</th>
                  <th>Capacity</th>
                  <th>Scholars</th>
                  <th>Mentors</th>
                  <th>Learning Packs</th>
                  <th>Updated</th>
                  <th><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                @for (cohort of page(); track cohort.id) {
                  <tr>
                    <td>
                      <a class="name" [routerLink]="['/admin/cohorts', cohort.id]">{{
                        cohort.name || 'Untitled cohort'
                      }}</a
                      ><span>{{ cohort.description || 'No description' }}</span
                      ><small>{{ cohort.code || cohort.id }}</small>
                    </td>
                    <td>
                      <strong>{{ cohort.challengeTitle || 'No challenge assigned' }}</strong>
                      @if (cohort.challengeCode) {
                        <small>{{ cohort.challengeCode }}</small>
                      }
                    </td>
                    <td>
                      <span class="badge" [attr.data-status]="normalizedStatus(cohort)">{{
                        statusLabel(normalizedStatus(cohort))
                      }}</span
                      ><small>{{ readiness(cohort) }}</small>
                    </td>
                    <td>
                      @if (cohort.startsAtUtc) {
                        <strong>{{ cohort.startsAtUtc | date: 'MMM d, y' }}</strong>
                        @if (cohort.endsAtUtc) {
                          <span>to {{ cohort.endsAtUtc | date: 'MMM d, y' }}</span>
                        }
                      } @else {
                        <span>Not scheduled</span>
                      }
                    </td>
                    <td>
                      <strong>{{ members(cohort) }} / {{ cohort.capacity ?? 'No limit' }}</strong>
                      @if (cohort.capacity) {
                        <mat-progress-bar
                          [value]="utilization(cohort)"
                          [attr.aria-label]="capacityLabel(cohort)"
                        /><small>{{ capacityLabel(cohort) }}</small>
                      }
                    </td>
                    <td>
                      <strong>{{ cohort.activeScholarCount ?? cohort.memberCount ?? 0 }} active</strong
                      ><span
                        >{{ cohort.pendingEnrollmentCount ?? 0 }} pending ·
                        {{ cohort.completedScholarCount ?? 0 }} completed</span
                      >
                    </td>
                    <td>
                      <strong>{{ cohort.mentorNames?.join(', ') || 'No mentor assigned' }}</strong
                      ><span>{{ cohort.mentorCount ?? cohort.mentorNames?.length ?? 0 }} assigned</span>
                    </td>
                    <td>
                      <strong>{{ cohort.learningPackCount ?? 0 }} packs</strong
                      ><span>{{ cohort.assignmentCount ?? 0 }} assignments</span>
                    </td>
                    <td>{{ cohort.updatedAtUtc ? (cohort.updatedAtUtc | date: 'MMM d, y') : '—' }}</td>
                    <td>
                      <button mat-icon-button [matMenuTriggerFor]="menu" [attr.aria-label]="'Manage ' + cohort.name">
                        <mat-icon>more_vert</mat-icon></button
                      ><mat-menu #menu="matMenu">
                        <a mat-menu-item [routerLink]="['/admin/cohorts', cohort.id]">View details</a>
                        @if (can('cohorts.update')) {
                          <a mat-menu-item [routerLink]="['/admin/cohorts', cohort.id]" [queryParams]="{ mode: 'edit' }"
                            >Edit cohort</a
                          >
                        }
                        @if (can('cohorts.members.manage')) {
                          <a
                            mat-menu-item
                            [routerLink]="['/admin/cohorts', cohort.id]"
                            [queryParams]="{ tab: 'scholars' }"
                            >Manage scholars</a
                          >
                        }
                        @if (can('cohorts.mentors.manage')) {
                          <a
                            mat-menu-item
                            [routerLink]="['/admin/cohorts', cohort.id]"
                            [queryParams]="{ tab: 'mentors' }"
                            >Manage mentors</a
                          >
                        }
                        @if (can('cohorts.learning-packs.manage')) {
                          <a
                            mat-menu-item
                            [routerLink]="['/admin/cohorts', cohort.id]"
                            [queryParams]="{ tab: 'learning-packs' }"
                            >Manage learning packs</a
                          >
                        }
                        @if (can('cohorts.schedule.manage')) {
                          <a
                            mat-menu-item
                            [routerLink]="['/admin/cohorts', cohort.id]"
                            [queryParams]="{ tab: 'schedule' }"
                            >Manage schedule</a
                          >
                        }
                        @if (can('cohorts.enrollment.manage')) {
                          <a
                            mat-menu-item
                            [routerLink]="['/admin/cohorts', cohort.id]"
                            [queryParams]="{ tab: 'enrollment' }"
                            >Manage enrollment</a
                          >
                        }
                        @if (can('cohorts.create')) {
                          <button mat-menu-item (click)="duplicate(cohort)">Duplicate</button>
                        }
                        @if (can('cohorts.archive') && normalizedStatus(cohort) !== 'archived') {
                          <button mat-menu-item (click)="transition(cohort, 'archived')">Archive</button>
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
            aria-label="Cohort pages"
          />
        }
        @if (actionError()) {
          <p class="error" role="alert">{{ actionError() }}</p>
        }
      }
    }`,
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
      .summary div,
      .toolbar {
        border: 1px solid #dbe3ec;
        border-radius: 12px;
        background: #fff;
        padding: 1rem;
      }
      .summary strong,
      .summary span,
      td span,
      td small {
        display: block;
      }
      .summary strong {
        font-size: 1.5rem;
      }
      .toolbar {
        display: grid;
        grid-template-columns: 2fr repeat(6, minmax(8rem, 1fr));
        gap: 0.75rem;
        align-items: end;
        background: #f7f9fb;
      }
      .toolbar label > span {
        display: block;
        font-size: 0.75rem;
        font-weight: 700;
        margin-bottom: 0.35rem;
      }
      .toolbar input,
      .toolbar select {
        border: 1px solid #aebdcc;
        border-radius: 7px;
        min-height: 2.5rem;
        padding: 0.4rem;
        width: 100%;
      }
      .search div {
        display: flex;
        align-items: center;
        background: #fff;
        border-radius: 7px;
      }
      .search input {
        border: 0;
      }
      .toolbar-actions {
        display: flex;
      }
      .table-shell {
        overflow-x: auto;
        margin-top: 1rem;
        border: 1px solid #dbe3ec;
        border-radius: 12px;
      }
      table {
        border-collapse: collapse;
        min-width: 1250px;
        width: 100%;
      }
      th,
      td {
        border-bottom: 1px solid #e5eaf0;
        padding: 0.75rem;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #f7f9fb;
        font-size: 0.75rem;
        text-transform: uppercase;
      }
      td {
        font-size: 0.86rem;
      }
      .name {
        display: block;
        font-size: 1rem;
        font-weight: 700;
        color: #086b9c;
      }
      .badge {
        border-radius: 999px;
        background: #e8edf2;
        display: inline-block;
        padding: 0.25rem 0.55rem;
        font-weight: 700;
      }
      .badge[data-status='active'] {
        background: #d9f4e5;
        color: #17633a;
      }
      .badge[data-status='archived'] {
        background: #e5e7eb;
      }
      .badge[data-status='paused'] {
        background: #fff0c7;
        color: #754f00;
      }
      mat-progress-bar {
        margin: 0.4rem 0;
        width: 8rem;
      }
      .error {
        color: #a61b1b;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }
      @media (max-width: 1100px) {
        .toolbar {
          grid-template-columns: repeat(3, 1fr);
        }
        th:nth-child(7),
        td:nth-child(7),
        th:nth-child(8),
        td:nth-child(8),
        th:nth-child(9),
        td:nth-child(9) {
          display: none;
        }
      }
      @media (max-width: 700px) {
        .summary {
          grid-template-columns: repeat(2, 1fr);
        }
        .toolbar {
          grid-template-columns: 1fr;
        }
        .table-shell table {
          min-width: 800px;
        }
        th:nth-child(4),
        td:nth-child(4),
        th:nth-child(7),
        td:nth-child(7),
        th:nth-child(8),
        td:nth-child(8),
        th:nth-child(9),
        td:nth-child(9) {
          display: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCohortListPage {
  readonly #api = inject(AdminCohortApiService);
  readonly #auth = inject(AuthStore);
  readonly #refresh$ = new BehaviorSubject<void>(undefined);
  readonly #search$ = new BehaviorSubject('');
  readonly cohorts = signal<AdminCohortListItem[]>([]);
  readonly query = signal('');
  readonly challenge = signal('all');
  readonly status = signal('all');
  readonly mentor = signal('all');
  readonly capacity = signal('all');
  readonly schedule = signal('all');
  readonly sort = signal<SortOption>('updated');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly actionError = signal('');
  readonly state$ = this.#refresh$.pipe(
    switchMap(() =>
      this.#search$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(() =>
          this.#api.cohorts().pipe(
            map(normalizeCohortList),
            map((items) => {
              this.cohorts.set(items);
              return items.length ? ({ status: 'loaded', data: items } as const) : ({ status: 'empty' } as const);
            }),
            startWith({ status: 'loading' } as const),
            catchError((error) => of({ status: 'error', message: this.errorMessage(error) } as const)),
          ),
        ),
      ),
    ),
    startWith({ status: 'loading' } as ApiState<AdminCohortListItem[]>),
  );
  readonly challenges = computed(() =>
    [
      ...new Set(
        this.cohorts()
          .map((c) => c.challengeTitle)
          .filter((v): v is string => !!v),
      ),
    ].sort(),
  );
  readonly statuses = computed(() => [...new Set(this.cohorts().map((c) => this.normalizedStatus(c)))].sort());
  readonly mentors = computed(() => [...new Set(this.cohorts().flatMap((c) => c.mentorNames ?? []))].sort());
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const result = this.cohorts().filter(
      (c) =>
        (!q ||
          [c.name, c.description, c.challengeTitle, ...(c.mentorNames ?? [])].some((v) =>
            v?.toLowerCase().includes(q),
          )) &&
        (this.challenge() === 'all' || c.challengeTitle === this.challenge()) &&
        (this.status() === 'all' || this.normalizedStatus(c) === this.status()) &&
        (this.mentor() === 'all' ||
          (this.mentor() === 'unassigned' ? !c.mentorNames?.length : c.mentorNames?.includes(this.mentor()))) &&
        (this.schedule() === 'all' || (this.schedule() === 'scheduled' ? !!c.startsAtUtc : !c.startsAtUtc)) &&
        this.capacityMatches(c),
    );
    return [...result].sort((a, b) => this.compare(a, b));
  });
  readonly page = computed(() =>
    this.filtered().slice(this.pageIndex() * this.pageSize(), (this.pageIndex() + 1) * this.pageSize()),
  );
  readonly fullCount = computed(
    () => this.cohorts().filter((c) => !!c.capacity && this.members(c) >= c.capacity).length,
  );
  readonly enrolledCount = computed(() => this.cohorts().reduce((n, c) => n + this.members(c), 0));
  setQuery(value: string) {
    this.query.set(value);
    this.resetPage();
    this.#search$.next(value);
  }
  refresh() {
    this.#refresh$.next();
  }
  resetPage() {
    this.pageIndex.set(0);
  }
  paginate(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }
  can(p: string) {
    return this.#auth.hasPermission([p]);
  }
  countStatus(s: string) {
    return this.cohorts().filter((c) => this.normalizedStatus(c) === s).length;
  }
  members(c: AdminCohortListItem) {
    return c.memberCount ?? c.activeScholarCount ?? 0;
  }
  utilization(c: AdminCohortListItem) {
    return c.capacity ? (this.members(c) / c.capacity) * 100 : 0;
  }
  capacityLabel(c: AdminCohortListItem) {
    const u = this.utilization(c);
    return u > 100
      ? 'Over capacity'
      : u >= 100
        ? 'Full'
        : u >= 90
          ? 'Near full'
          : u >= 70
            ? 'Filling'
            : 'Space available';
  }
  normalizedStatus(c: AdminCohortListItem) {
    return (c.status ?? 'draft').trim().toLowerCase().replaceAll(' ', '_');
  }
  statusLabel(v: string) {
    return v.replaceAll('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
  readiness(c: AdminCohortListItem) {
    const done = [
      !!c.challengeId,
      !!c.startsAtUtc,
      this.members(c) > 0,
      (c.mentorCount ?? c.mentorNames?.length ?? 0) > 0,
      (c.learningPackCount ?? 0) > 0,
      !!c.capacity,
    ].filter(Boolean).length;
    return `${done} of 6 setup steps complete`;
  }
  clearFilters() {
    this.query.set('');
    this.challenge.set('all');
    this.status.set('all');
    this.mentor.set('all');
    this.capacity.set('all');
    this.schedule.set('all');
    this.sort.set('updated');
    this.resetPage();
    this.#search$.next('');
  }
  duplicate(c: AdminCohortListItem) {
    this.actionError.set('');
    this.#api
      .duplicate(c.id)
      .subscribe({
        next: (item) => this.cohorts.update((v) => [item, ...v]),
        error: (e) => this.actionError.set(this.errorMessage(e)),
      });
  }
  transition(c: AdminCohortListItem, status: string) {
    this.actionError.set('');
    this.#api
      .transition(c.id, status, c.version)
      .subscribe({
        next: (item) => this.cohorts.update((v) => v.map((x) => (x.id === item.id ? item : x))),
        error: (e) => this.actionError.set(this.errorMessage(e)),
      });
  }
  private capacityMatches(c: AdminCohortListItem) {
    if (this.capacity() === 'all') return true;
    const u = this.utilization(c);
    return this.capacity() === 'full' ? u >= 100 : this.capacity() === 'near-full' ? u >= 70 && u < 100 : u < 70;
  }
  private compare(a: AdminCohortListItem, b: AdminCohortListItem) {
    switch (this.sort()) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'start':
        return (a.startsAtUtc ?? '9999').localeCompare(b.startsAtUtc ?? '9999');
      case 'members':
        return this.members(b) - this.members(a);
      case 'utilization':
        return this.utilization(b) - this.utilization(a);
      default:
        return (b.updatedAtUtc ?? '').localeCompare(a.updatedAtUtc ?? '');
    }
  }
  private errorMessage(e: unknown) {
    if (e instanceof HttpErrorResponse) {
      if (e.status === 401) return 'Your session has expired. Sign in again.';
      if (e.status === 403) return 'You do not have access to cohorts.';
      if (e.status === 404) return 'The cohort endpoint is not available.';
      if (e.status === 0) return 'The backend is unavailable. Check your connection and try again.';
    }
    return e instanceof Error ? e.message : 'Unable to load cohorts.';
  }
}
