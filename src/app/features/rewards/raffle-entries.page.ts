import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { RaffleEntry, RaffleEntryCardComponent } from './raffle-entry-card.component';

interface ApiState<T> {
  status: 'loading' | 'loaded' | 'empty' | 'error';
  data?: T;
  message?: string;
}

interface RaffleEntriesResponse {
  summary?: RaffleEntriesSummary;
  entries?: RaffleEntry[];
  items?: RaffleEntry[];
}

interface RaffleEntriesSummary {
  totalActiveEntries: number;
  currentRaffle: string;
  drawingDate: string;
  rulesUrl: string;
}

interface RaffleEntriesViewModel {
  summary: RaffleEntriesSummary;
  entries: RaffleEntry[];
}

const EMPTY_SUMMARY: RaffleEntriesSummary = {
  totalActiveEntries: 0,
  currentRaffle: 'No active raffle',
  drawingDate: 'To be announced',
  rulesUrl: '/rewards',
};

@Component({
  selector: 'b0-raffle-entries',
  standalone: true,
  imports: [
    AsyncPipe,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingSkeletonComponent,
    PageHeaderComponent,
    RaffleEntryCardComponent,
  ],
  template: `
    <b0-page-header
      title="My Raffle Entries"
      description="Review active drawing eligibility, entry history, source activities, and raffle rules."
    />

    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="5" />
      } @else if (state.status === 'error') {
        <b0-error-state [message]="state.message || 'Unable to load raffle entries.'" (retry)="reload()" />
      } @else if (state.status === 'empty') {
        <b0-empty-state
          title="No raffle entries yet"
          message="Eligible activities will appear here after the backend awards raffle entries."
        />
      } @else {
        <section class="space-y-6" aria-label="My raffle entries">
          <div class="grid gap-4 md:grid-cols-4">
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="text-sm font-medium text-slate-500">Total active entries</p>
              <p class="mt-2 text-3xl font-bold text-slate-950">{{ state.data!.summary.totalActiveEntries }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="text-sm font-medium text-slate-500">Current raffle</p>
              <p class="mt-2 text-lg font-semibold text-slate-950">{{ state.data!.summary.currentRaffle }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="text-sm font-medium text-slate-500">Drawing date</p>
              <p class="mt-2 text-lg font-semibold text-slate-950">{{ state.data!.summary.drawingDate }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="text-sm font-medium text-slate-500">Rules</p>
              <a class="mt-2 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-900" [href]="state.data!.summary.rulesUrl">
                View rules
              </a>
            </div>
          </div>

          <div class="grid gap-4">
            @for (entry of state.data!.entries; track entry.id) {
              <b0-raffle-entry-card [entry]="entry" />
            }
          </div>

          <p class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Raffle entries provide eligibility for a drawing. They do not guarantee a prize.
          </p>
        </section>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaffleEntriesPage {
  #api = inject(ApiService);
  #reload$ = new BehaviorSubject<void>(undefined);

  readonly state$: Observable<ApiState<RaffleEntriesViewModel>> = this.#reload$.pipe(
    switchMap(() =>
      this.#api.get<RaffleEntriesResponse | RaffleEntry[]>('/raffle-entries').pipe(
        map((result) => this.#normalize(result)),
        map((data) => ({ status: data.entries.length ? 'loaded' : 'empty', data }) satisfies ApiState<RaffleEntriesViewModel>),
        startWith({ status: 'loading' } satisfies ApiState<RaffleEntriesViewModel>),
        catchError((error: unknown) =>
          of({
            status: 'error',
            message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.',
          } satisfies ApiState<RaffleEntriesViewModel>),
        ),
      ),
    ),
  );

  reload() {
    this.#reload$.next();
  }

  #normalize(result: RaffleEntriesResponse | RaffleEntry[]): RaffleEntriesViewModel {
    if (Array.isArray(result)) {
      return { summary: { ...EMPTY_SUMMARY, totalActiveEntries: this.#activeCount(result) }, entries: result };
    }

    const entries = result.entries ?? result.items ?? [];
    return {
      summary: { ...EMPTY_SUMMARY, totalActiveEntries: this.#activeCount(entries), ...result.summary },
      entries,
    };
  }

  #activeCount(entries: RaffleEntry[]) {
    return entries.filter((entry) => entry.status === 'active').length;
  }
}
