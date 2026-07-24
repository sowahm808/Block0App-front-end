import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

interface ApiState<T> {
  status: 'loading' | 'loaded' | 'error';
  data?: T;
  message?: string;
}
interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
  studyReminders: boolean;
  teamActivity: boolean;
  supportUpdates: boolean;
  rewardUpdates: boolean;
  certificateUpdates: boolean;
  quietHours: { enabled: boolean; startTime: string; endTime: string; timeZone: string };
  pushPermissionStatus?: NotificationPermission | 'unsupported';
}
interface PreferencesResponse {
  preferences?: Partial<NotificationPreferences>;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  inApp: true,
  email: true,
  push: false,
  studyReminders: true,
  teamActivity: true,
  supportUpdates: true,
  rewardUpdates: true,
  certificateUpdates: true,
  quietHours: {
    enabled: false,
    startTime: '21:00',
    endTime: '07:00',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  pushPermissionStatus: typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
};

@Component({
  selector: 'b0-notification-preferences',
  standalone: true,
  imports: [AsyncPipe, FormsModule, ErrorStateComponent, LoadingSkeletonComponent, PageHeaderComponent],
  template: `
    <b0-page-header
      title="Notification Preferences"
      description="Control channels, topics, quiet hours, and push notification permission."
    />

    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="5" />
      } @else if (state.status === 'error') {
        <b0-error-state [message]="state.message || 'Unable to load preferences.'" (retry)="reload()" />
      } @else {
        <form class="space-y-6" aria-label="Notification preferences" (ngSubmit)="save(state.data!)">
          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-950">Channel fields</h2>
            <div class="mt-4 divide-y divide-slate-100">
              @for (field of channelFields; track field.key) {
                <label class="flex items-center justify-between gap-4 py-3">
                  <span>
                    <span class="block font-medium text-slate-900">{{ field.label }}</span>
                    <span class="text-sm text-slate-500">{{ field.description }}</span>
                  </span>
                  <input
                    type="checkbox"
                    class="h-5 w-5 rounded border-slate-300 text-indigo-600"
                    [(ngModel)]="state.data![field.key]"
                    [name]="field.key"
                  />
                </label>
              }
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-950">Quiet hours</h2>
            <label class="mt-4 flex items-center justify-between gap-4">
              <span class="font-medium text-slate-900">Enable quiet hours</span>
              <input
                type="checkbox"
                class="h-5 w-5 rounded border-slate-300 text-indigo-600"
                [(ngModel)]="state.data!.quietHours.enabled"
                name="quietHoursEnabled"
              />
            </label>
            <div class="mt-4 grid gap-4 md:grid-cols-3">
              <label class="grid gap-2 text-sm font-medium text-slate-700"
                >Start time<input
                  type="time"
                  class="rounded-xl border border-slate-200 px-3 py-2"
                  [(ngModel)]="state.data!.quietHours.startTime"
                  name="startTime"
              /></label>
              <label class="grid gap-2 text-sm font-medium text-slate-700"
                >End time<input
                  type="time"
                  class="rounded-xl border border-slate-200 px-3 py-2"
                  [(ngModel)]="state.data!.quietHours.endTime"
                  name="endTime"
              /></label>
              <label class="grid gap-2 text-sm font-medium text-slate-700"
                >Time zone<input
                  class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  [(ngModel)]="state.data!.quietHours.timeZone"
                  name="timeZone"
                  readonly
              /></label>
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-950">Push permission</h2>
            <p class="mt-2 text-sm text-slate-600">
              Push notifications require your browser permission. Permission is never requested automatically; use the
              button when you are ready.
            </p>
            <p class="mt-3 text-sm font-medium text-slate-900">
              Current permission status:
              <span class="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{{
                state.data!.pushPermissionStatus
              }}</span>
            </p>
            <button
              type="button"
              class="mt-4 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-300"
              [disabled]="state.data!.pushPermissionStatus === 'unsupported'"
              (click)="requestPushPermission(state.data!)"
            >
              Enable Push Notifications
            </button>
          </section>

          <button
            class="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            type="submit"
          >
            Save preferences
          </button>
        </form>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPreferencesPage {
  #api = inject(ApiService);
  #reload$ = new BehaviorSubject<void>(undefined);
  readonly channelFields: {
    key: keyof Omit<NotificationPreferences, 'quietHours' | 'pushPermissionStatus'>;
    label: string;
    description: string;
  }[] = [
    { key: 'inApp', label: 'In-app notifications', description: 'Show notifications inside Block Zero.' },
    { key: 'email', label: 'Email notifications', description: 'Send important updates by email.' },
    { key: 'push', label: 'Push notifications', description: 'Allow browser push after permission is granted.' },
    { key: 'studyReminders', label: 'Study reminders', description: 'Daily challenge and study continuation prompts.' },
    {
      key: 'teamActivity',
      label: 'Team activity',
      description: 'Team messages, mentor nudges, and collaboration updates.',
    },
    {
      key: 'supportUpdates',
      label: 'Support updates',
      description: 'Replies and status changes for support requests.',
    },
    { key: 'rewardUpdates', label: 'Reward updates', description: 'Reward and raffle progress notifications.' },
    {
      key: 'certificateUpdates',
      label: 'Certificate updates',
      description: 'Eligibility and issued certificate notifications.',
    },
  ];
  readonly state$: Observable<ApiState<NotificationPreferences>> = this.#reload$.pipe(
    switchMap(() =>
      this.#api.get<PreferencesResponse | Partial<NotificationPreferences>>('/notification-preferences').pipe(
        map((result) => this.#normalize(result)),
        map((data) => ({ status: 'loaded', data }) satisfies ApiState<NotificationPreferences>),
        startWith({ status: 'loading' } satisfies ApiState<NotificationPreferences>),
        catchError((error: unknown) =>
          of({
            status: 'error',
            message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.',
          } satisfies ApiState<NotificationPreferences>),
        ),
      ),
    ),
  );
  reload() {
    this.#reload$.next();
  }
  save(preferences: NotificationPreferences) {
    this.#api
      .put('/notification-preferences', preferences)
      .pipe(catchError(() => of(null)))
      .subscribe();
  }
  async requestPushPermission(preferences: NotificationPreferences) {
    if (typeof Notification === 'undefined') {
      preferences.pushPermissionStatus = 'unsupported';
      return;
    }
    preferences.pushPermissionStatus = await Notification.requestPermission();
    preferences.push = preferences.pushPermissionStatus === 'granted';
  }
  #normalize(result: PreferencesResponse | Partial<NotificationPreferences>): NotificationPreferences {
    const raw = this.#hasPreferences(result) ? (result.preferences ?? {}) : result;
    return {
      ...DEFAULT_PREFERENCES,
      ...raw,
      quietHours: { ...DEFAULT_PREFERENCES.quietHours, ...raw.quietHours },
      pushPermissionStatus: typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
    };
  }
  #hasPreferences(result: PreferencesResponse | Partial<NotificationPreferences>): result is PreferencesResponse {
    return 'preferences' in result;
  }
}
