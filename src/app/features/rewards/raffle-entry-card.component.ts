import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type RaffleEntryStatus = 'active' | 'drawn' | 'expired' | 'void';

export interface RaffleEntry {
  id: string;
  entryReason: string;
  dateEarned: string;
  sourceActivity: string;
  raffleName: string;
  status: RaffleEntryStatus;
}

const STATUS_LABELS: Record<RaffleEntryStatus, string> = {
  active: 'Active',
  drawn: 'Drawn',
  expired: 'Expired',
  void: 'Void',
};

@Component({
  selector: 'b0-raffle-entry-card',
  standalone: true,
  template: `
    <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Raffle entry</span>
            <span [class]="statusClass">{{ statusLabel }}</span>
          </div>
          <h3 class="text-lg font-semibold text-slate-950">{{ entry.entryReason }}</h3>
          <p class="text-sm leading-6 text-slate-600">Earned from {{ entry.sourceActivity }}.</p>
        </div>
        <div class="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:min-w-40">
          <p class="font-medium text-slate-500">Date earned</p>
          <p class="font-semibold text-slate-900">{{ entry.dateEarned }}</p>
        </div>
      </div>

      <dl class="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt class="font-medium text-slate-500">Source activity</dt>
          <dd class="mt-1 text-slate-800">{{ entry.sourceActivity }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Raffle name</dt>
          <dd class="mt-1 text-slate-800">{{ entry.raffleName }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Status</dt>
          <dd class="mt-1 text-slate-800">{{ statusLabel }}</dd>
        </div>
      </dl>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaffleEntryCardComponent {
  @Input({ required: true }) entry!: RaffleEntry;

  get statusLabel() {
    return STATUS_LABELS[this.entry.status] ?? this.entry.status;
  }

  get statusClass() {
    const base = 'rounded-full px-3 py-1 text-xs font-semibold';
    if (this.entry.status === 'active') return `${base} bg-emerald-50 text-emerald-700`;
    if (this.entry.status === 'drawn') return `${base} bg-blue-50 text-blue-700`;
    if (this.entry.status === 'expired') return `${base} bg-amber-50 text-amber-700`;
    return `${base} bg-slate-100 text-slate-600`;
  }
}
