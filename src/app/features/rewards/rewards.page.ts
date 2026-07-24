import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { Reward, RewardCardComponent, RewardStatus } from './reward-card.component';

interface ApiState<T> {
  status: 'loading' | 'loaded' | 'empty' | 'error';
  data?: T;
  message?: string;
}
type RewardTab = 'earned' | 'in_progress' | 'all';

interface RewardsResponse {
  rewards?: Reward[];
  items?: Reward[];
}

@Component({
  selector: 'b0-rewards',
  standalone: true,
  imports: [
    AsyncPipe,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingSkeletonComponent,
    PageHeaderComponent,
    RewardCardComponent,
  ],
  template: `
    <b0-page-header
      title="Rewards"
      description="Track earned badges, recognitions, raffle entries, certificate milestones, and physical reward eligibility."
    />

    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="5" />
      } @else if (state.status === 'error') {
        <b0-error-state [message]="state.message || 'Unable to load rewards.'" (retry)="reload()" />
      } @else if (state.status === 'empty') {
        <b0-empty-state
          title="No rewards available"
          message="Rewards appear here once the backend returns reward definitions or scholar progress."
        />
      } @else {
        <section class="space-y-6" aria-label="Rewards dashboard">
          <div class="grid gap-4 md:grid-cols-3">
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="text-sm font-medium text-slate-500">Earned</p>
              <p class="mt-2 text-3xl font-bold text-slate-950">{{ countByStatus(state.data!, 'earned') }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="text-sm font-medium text-slate-500">In Progress</p>
              <p class="mt-2 text-3xl font-bold text-slate-950">{{ countByStatus(state.data!, 'in_progress') }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="text-sm font-medium text-slate-500">All Rewards</p>
              <p class="mt-2 text-3xl font-bold text-slate-950">{{ state.data!.length }}</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2" role="tablist" aria-label="Reward filters">
            @for (tab of tabs; track tab.id) {
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="activeTab === tab.id"
                (click)="setTab(tab.id)"
                [class]="tabClass(tab.id)"
              >
                {{ tab.label }}
              </button>
            }
          </div>

          <div class="grid gap-4">
            @for (reward of filteredRewards(state.data!); track reward.id) {
              <b0-reward-card [reward]="reward" />
            } @empty {
              <b0-empty-state
                title="No rewards in this tab"
                message="Try All Rewards to see every reward and eligibility requirement."
              />
            }
          </div>
        </section>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RewardsPage {
  #api = inject(ApiService);
  #reload$ = new BehaviorSubject<void>(undefined);
  activeTab: RewardTab = 'earned';
  readonly tabs: { id: RewardTab; label: string }[] = [
    { id: 'earned', label: 'Earned' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'all', label: 'All Rewards' },
  ];

  readonly state$: Observable<ApiState<Reward[]>> = this.#reload$.pipe(
    switchMap(() =>
      this.#api.get<RewardsResponse | Reward[]>('/rewards').pipe(
        map((result) => this.#normalizeRewards(result)),
        map((rewards) => ({ status: rewards.length ? 'loaded' : 'empty', data: rewards }) satisfies ApiState<Reward[]>),
        startWith({ status: 'loading' } satisfies ApiState<Reward[]>),
        catchError((error: unknown) =>
          of({
            status: 'error',
            message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.',
          } satisfies ApiState<Reward[]>),
        ),
      ),
    ),
  );

  reload() {
    this.#reload$.next();
  }
  setTab(tab: RewardTab) {
    this.activeTab = tab;
  }
  countByStatus(rewards: Reward[], status: RewardStatus) {
    return rewards.filter((reward) => reward.status === status).length;
  }
  filteredRewards(rewards: Reward[]) {
    return this.activeTab === 'all' ? rewards : rewards.filter((reward) => reward.status === this.activeTab);
  }
  tabClass(tab: RewardTab) {
    const base = 'rounded-full border px-4 py-2 text-sm font-semibold transition';
    return this.activeTab === tab
      ? `${base} border-indigo-600 bg-indigo-600 text-white`
      : `${base} border-slate-200 bg-white text-slate-700 hover:border-indigo-300`;
  }

  #normalizeRewards(result: RewardsResponse | Reward[]): Reward[] {
    if (Array.isArray(result)) return result;
    return result.rewards ?? result.items ?? [];
  }
}
