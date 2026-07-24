import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type RewardStatus = 'earned' | 'in_progress' | 'locked';
export type RewardType = 'digital_badge' | 'recognition' | 'raffle_entry' | 'certificate_milestone' | 'physical_reward';

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  earnedDate?: string | null;
  progressCurrent: number;
  progressTarget: number;
  eligibilityRequirement: string;
  status: RewardStatus;
}

const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  digital_badge: 'Digital badge',
  recognition: 'Recognition',
  raffle_entry: 'Raffle entry',
  certificate_milestone: 'Certificate milestone',
  physical_reward: 'Physical reward',
};

const STATUS_LABELS: Record<RewardStatus, string> = {
  earned: 'Earned',
  in_progress: 'In Progress',
  locked: 'Not started',
};

@Component({
  selector: 'b0-reward-card',
  standalone: true,
  template: `
    <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{{
              typeLabel
            }}</span>
            <span [class]="statusClass">{{ statusLabel }}</span>
          </div>
          <h3 class="text-lg font-semibold text-slate-950">{{ reward.name }}</h3>
          <p class="text-sm leading-6 text-slate-600">{{ reward.description }}</p>
        </div>
        <div class="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:min-w-40">
          <p class="font-medium text-slate-500">Earned date</p>
          <p class="font-semibold text-slate-900">{{ reward.earnedDate || 'Not earned yet' }}</p>
        </div>
      </div>

      <div class="mt-5 space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="font-medium text-slate-700">Progress</span>
          <span class="text-slate-600">{{ reward.progressCurrent }} / {{ reward.progressTarget }}</span>
        </div>
        <div
          class="h-3 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          [attr.aria-valuenow]="progressPercent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="h-full rounded-full bg-emerald-500" [style.width.%]="progressPercent"></div>
        </div>
      </div>

      <dl class="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="font-medium text-slate-500">Eligibility requirement</dt>
          <dd class="mt-1 text-slate-800">{{ reward.eligibilityRequirement }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Reward type</dt>
          <dd class="mt-1 text-slate-800">{{ typeLabel }}</dd>
        </div>
      </dl>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RewardCardComponent {
  @Input({ required: true }) reward!: Reward;

  get typeLabel() {
    return REWARD_TYPE_LABELS[this.reward.type];
  }

  get statusLabel() {
    return STATUS_LABELS[this.reward.status];
  }

  get progressPercent() {
    return this.reward.progressTarget === 0
      ? 0
      : Math.min(100, Math.round((this.reward.progressCurrent / this.reward.progressTarget) * 100));
  }

  get statusClass() {
    const base = 'rounded-full px-3 py-1 text-xs font-semibold';
    if (this.reward.status === 'earned') return `${base} bg-emerald-50 text-emerald-700`;
    if (this.reward.status === 'in_progress') return `${base} bg-amber-50 text-amber-700`;
    return `${base} bg-slate-100 text-slate-600`;
  }
}
