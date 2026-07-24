import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

type NotificationType = 'study' | 'team' | 'support' | 'rewards' | 'certificates' | 'system';
type NotificationFilter = 'all' | 'unread' | NotificationType;

interface ApiState<T> {
  status: 'loading' | 'loaded' | 'empty' | 'error';
  data?: T;
  message?: string;
}

interface NotificationAction {
  label: string;
  route: string;
}

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
  action?: NotificationAction;
}

interface NotificationsResponse {
  notifications?: NotificationItem[];
  items?: NotificationItem[];
}

@Component({
  selector: 'b0-notification-center',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingSkeletonComponent,
    PageHeaderComponent,
  ],
  template: `
    <b0-page-header
      title="Notification Center"
      description="Review study, team, support, rewards, certificate, and system updates in one place."
    />

    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="6" />
      } @else if (state.status === 'error') {
        <b0-error-state [message]="state.message || 'Unable to load notifications.'" (retry)="reload()" />
      } @else if (state.status === 'empty') {
        <b0-empty-state
          title="No notifications yet"
          message="Study reminders, team activity, rewards, certificates, support updates, and system messages will appear here."
        />
      } @else {
        <section class="space-y-5" aria-label="Notification center">
          <div
            class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p class="text-sm font-medium text-slate-500">Unread count</p>
              <p class="mt-1 text-3xl font-bold text-slate-950">{{ unreadCount(state.data!) }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                (click)="markAllAsRead(state.data!)"
              >
                Mark all as read
              </button>
              <a
                class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-300"
                href="/notification-preferences"
              >
                Notification preferences
              </a>
            </div>
          </div>

          <div class="flex flex-wrap gap-2" role="tablist" aria-label="Notification filters">
            @for (filter of filters; track filter.id) {
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="activeFilter === filter.id"
                [class]="filterClass(filter.id)"
                (click)="setFilter(filter.id)"
              >
                {{ filter.label }}
              </button>
            }
          </div>

          <div class="grid gap-3">
            @for (notification of filteredNotifications(state.data!); track notification.id) {
              <article [class]="itemClass(notification)" [attr.aria-label]="notification.title">
                <div class="flex gap-4">
                  <div
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xl"
                    aria-hidden="true"
                  >
                    {{ iconFor(notification.type) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div class="flex flex-wrap items-center gap-2">
                          <h2 class="font-semibold text-slate-950">{{ notification.title }}</h2>
                          <span [class]="statusClass(notification)">{{ notification.readAt ? 'Read' : 'Unread' }}</span>
                        </div>
                        <p class="mt-1 text-sm text-slate-600">{{ notification.message }}</p>
                      </div>
                      <time class="text-sm text-slate-500" [attr.datetime]="notification.createdAt">
                        {{ notification.createdAt | date: 'medium' }}
                      </time>
                    </div>
                    @if (notification.action) {
                      <a
                        class="mt-3 inline-flex rounded-full border border-indigo-200 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                        [href]="notification.action.route"
                      >
                        {{ notification.action.label }}
                      </a>
                    }
                  </div>
                </div>
              </article>
            } @empty {
              <b0-empty-state
                title="No notifications match this filter"
                message="Try All or Unread to review more updates."
              />
            }
          </div>
        </section>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterPage {
  #api = inject(ApiService);
  #reload$ = new BehaviorSubject<void>(undefined);
  #locallyReadIds = new Set<string>();
  activeFilter: NotificationFilter = 'all';
  readonly filters: { id: NotificationFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'study', label: 'Study' },
    { id: 'team', label: 'Team' },
    { id: 'support', label: 'Support' },
    { id: 'rewards', label: 'Rewards' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'system', label: 'System' },
  ];

  readonly state$: Observable<ApiState<NotificationItem[]>> = this.#reload$.pipe(
    switchMap(() =>
      this.#api.get<NotificationsResponse | NotificationItem[]>('/notifications').pipe(
        map((result) => this.#normalize(result)),
        map((items) =>
          items.map((item) =>
            this.#locallyReadIds.has(item.id) ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item,
          ),
        ),
        map(
          (items) =>
            ({ status: items.length ? 'loaded' : 'empty', data: items }) satisfies ApiState<NotificationItem[]>,
        ),
        startWith({ status: 'loading' } satisfies ApiState<NotificationItem[]>),
        catchError((error: unknown) =>
          of({
            status: 'error',
            message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.',
          } satisfies ApiState<NotificationItem[]>),
        ),
      ),
    ),
  );

  reload() {
    this.#reload$.next();
  }
  setFilter(filter: NotificationFilter) {
    this.activeFilter = filter;
  }
  unreadCount(items: NotificationItem[]) {
    return items.filter((item) => !item.readAt).length;
  }
  markAllAsRead(items: NotificationItem[]) {
    items.forEach((item) => this.#locallyReadIds.add(item.id));
    this.#api
      .post('/notifications/mark-all-read', {})
      .pipe(catchError(() => of(null)))
      .subscribe(() => this.reload());
  }
  filteredNotifications(items: NotificationItem[]) {
    if (this.activeFilter === 'all') return items;
    if (this.activeFilter === 'unread') return items.filter((item) => !item.readAt);
    return items.filter((item) => item.type === this.activeFilter);
  }
  filterClass(filter: NotificationFilter) {
    const base = 'rounded-full border px-4 py-2 text-sm font-semibold transition';
    return this.activeFilter === filter
      ? `${base} border-indigo-600 bg-indigo-600 text-white`
      : `${base} border-slate-200 bg-white text-slate-700 hover:border-indigo-300`;
  }
  itemClass(item: NotificationItem) {
    return `rounded-2xl border p-4 shadow-sm ${item.readAt ? 'border-slate-200 bg-white' : 'border-indigo-200 bg-indigo-50/40'}`;
  }
  statusClass(item: NotificationItem) {
    return `rounded-full px-2 py-0.5 text-xs font-semibold ${item.readAt ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-700'}`;
  }
  iconFor(type: NotificationType) {
    return { study: '📚', team: '👥', support: '🎧', rewards: '🏆', certificates: '🎓', system: '⚙️' }[type];
  }
  #normalize(result: NotificationsResponse | NotificationItem[]): NotificationItem[] {
    return Array.isArray(result) ? result : (result.notifications ?? result.items ?? []);
  }
}
