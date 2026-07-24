import { AsyncPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

interface CheckInHistoryResponse {
  items?: CheckInHistoryItem[];
  summary?: {
    totalCheckIns?: number;
    averageMorningConfidence?: number;
    averageEveningConfidence?: number;
    totalStudyMinutes?: number;
    goalCompletionRate?: number;
  };
}

interface CheckInHistoryItem {
  id?: string;
  date: string;
  morningConfidence: number | null;
  eveningConfidence: number | null;
  capsuleGoal: string;
  capsulesCompleted: number;
  goalResult: 'completed' | 'partial' | 'missed' | 'not_set' | string;
  studyMinutes: number;
  supportRequested: boolean;
}

interface ApiState<T> {
  status: 'loading' | 'loaded' | 'empty' | 'error';
  data?: T;
  message?: string;
}

@Component({
  selector: 'b0-check-in-history',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    DecimalPipe,
    EmptyStateComponent,
    ErrorStateComponent,
    FormsModule,
    LoadingSkeletonComponent,
    PageHeaderComponent,
    PercentPipe,
  ],
  template: `
    <b0-page-header
      eyebrow="Check-in history"
      title="Check-In History"
      description="Review confidence, study time, goal completion, and support signals across previous check-ins."
    />

    <section class="filters" aria-label="Check-in history filters">
      <label>Start date <input type="date" [ngModel]="startDate()" (ngModelChange)="startDate.set($event)" /></label>
      <label>End date <input type="date" [ngModel]="endDate()" (ngModelChange)="endDate.set($event)" /></label>
      <label
        >Min confidence
        <input type="number" min="1" max="10" [ngModel]="minConfidence()" (ngModelChange)="minConfidence.set($event)"
      /></label>
      <label
        >Max confidence
        <input type="number" min="1" max="10" [ngModel]="maxConfidence()" (ngModelChange)="maxConfidence.set($event)"
      /></label>
      <label
        >Goal completion
        <select [ngModel]="goalCompletion()" (ngModelChange)="goalCompletion.set($event)">
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="partial">Partial</option>
          <option value="missed">Missed</option>
        </select>
      </label>
      <label
        >Support requested
        <select [ngModel]="supportRequested()" (ngModelChange)="supportRequested.set($event)">
          <option value="all">All</option>
          <option value="true">Requested</option>
          <option value="false">Not requested</option>
        </select>
      </label>
      <button type="button" (click)="reload()">Refresh</button>
    </section>

    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="6" />
      } @else if (state.status === 'error') {
        <b0-error-state [message]="state.message || 'Unable to load check-in history.'" (retry)="reload()" />
      } @else if (state.status === 'empty') {
        <b0-empty-state
          title="No check-ins yet"
          message="Complete morning and evening check-ins to build your history."
        />
      } @else if (state.status === 'loaded' && state.data; as data) {
        <section class="summary" aria-label="Check-in history summary">
          <article>
            <span>Total check-ins</span><strong>{{ data.summary?.totalCheckIns ?? data.items?.length ?? 0 }}</strong>
          </article>
          <article>
            <span>Avg morning confidence</span
            ><strong>{{
              data.summary?.averageMorningConfidence ?? average(data.items ?? [], 'morningConfidence') | number: '1.0-1'
            }}</strong>
          </article>
          <article>
            <span>Avg evening confidence</span
            ><strong>{{
              data.summary?.averageEveningConfidence ?? average(data.items ?? [], 'eveningConfidence') | number: '1.0-1'
            }}</strong>
          </article>
          <article>
            <span>Goal completion</span
            ><strong>{{ data.summary?.goalCompletionRate ?? completionRate(data.items ?? []) | percent }}</strong>
          </article>
        </section>

        <section class="cards" aria-label="History cards">
          @for (item of data.items; track item.id ?? item.date) {
            <article class="history-card">
              <div>
                <p class="eyebrow">{{ item.date | date: 'mediumDate' }}</p>
                <h2>{{ item.capsuleGoal || 'No capsule goal recorded' }}</h2>
              </div>
              <dl>
                <div>
                  <dt>Morning confidence</dt>
                  <dd>{{ item.morningConfidence ?? '—' }}</dd>
                </div>
                <div>
                  <dt>Evening confidence</dt>
                  <dd>{{ item.eveningConfidence ?? '—' }}</dd>
                </div>
                <div>
                  <dt>Capsules completed</dt>
                  <dd>{{ item.capsulesCompleted }}</dd>
                </div>
                <div>
                  <dt>Goal result</dt>
                  <dd>{{ label(item.goalResult) }}</dd>
                </div>
                <div>
                  <dt>Study time</dt>
                  <dd>{{ item.studyMinutes }} min</dd>
                </div>
                <div>
                  <dt>Support indicator</dt>
                  <dd [class.support]="item.supportRequested">
                    {{ item.supportRequested ? 'Support requested' : 'No support requested' }}
                  </dd>
                </div>
              </dl>
            </article>
          }
        </section>

        @for (chart of charts(data.items ?? []); track chart.title) {
          <section class="chart-panel">
            <div class="chart-header">
              <h2>{{ chart.title }}</h2>
              <p>{{ chart.description }}</p>
            </div>
            <div class="bar-chart" [attr.aria-label]="chart.title + ' chart'">
              @for (point of chart.points; track point.label) {
                <div class="bar" [style.height.%]="point.percent">
                  <span>{{ point.value }}</span
                  ><small>{{ point.label }}</small>
                </div>
              }
            </div>
            <div class="table-wrap">
              <table>
                <caption>
                  {{
                    chart.title
                  }}
                  table view
                </caption>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>{{ chart.valueLabel }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (point of chart.points; track point.label) {
                    <tr>
                      <td>{{ point.fullDate | date: 'mediumDate' }}</td>
                      <td>{{ point.value }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
      }
    }
  `,
  styles: [
    `
      .filters,
      .summary,
      .cards {
        display: grid;
        gap: 1rem;
        margin: 1.5rem 0;
      }
      .filters {
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        align-items: end;
        padding: 1rem;
        border: 1px solid var(--border-color, #d8dee9);
        border-radius: 1rem;
        background: var(--surface, #fff);
      }
      label {
        display: grid;
        gap: 0.35rem;
        font-weight: 600;
      }
      input,
      select,
      button {
        min-height: 2.5rem;
        border-radius: 0.6rem;
        border: 1px solid #c8d0dc;
        padding: 0.4rem 0.65rem;
      }
      .summary {
        grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
      }
      .summary article,
      .history-card,
      .chart-panel {
        border: 1px solid var(--border-color, #d8dee9);
        border-radius: 1rem;
        background: var(--surface, #fff);
        padding: 1rem;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
      }
      .summary span,
      dt,
      .chart-header p {
        color: #64748b;
      }
      .summary strong {
        display: block;
        font-size: 1.7rem;
        margin-top: 0.25rem;
      }
      .cards {
        grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
      }
      .eyebrow {
        color: #4f46e5;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      h2 {
        margin: 0.2rem 0 1rem;
      }
      dl {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
      }
      dt {
        font-size: 0.8rem;
      }
      dd {
        margin: 0;
        font-weight: 700;
      }
      .support {
        color: #b45309;
      }
      .chart-panel {
        margin: 1.5rem 0;
      }
      .bar-chart {
        min-height: 15rem;
        display: flex;
        gap: 0.75rem;
        align-items: end;
        padding: 1rem;
        border-radius: 0.75rem;
        background: #f8fafc;
        overflow-x: auto;
      }
      .bar {
        min-width: 4.5rem;
        display: grid;
        align-content: end;
        justify-items: center;
        border-radius: 0.5rem 0.5rem 0 0;
        background: linear-gradient(180deg, #6366f1, #22c55e);
        color: white;
        padding: 0.35rem;
      }
      .bar small {
        color: #0f172a;
        transform: translateY(1.6rem);
      }
      .table-wrap {
        overflow-x: auto;
        margin-top: 1rem;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      caption {
        text-align: left;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }
      th,
      td {
        padding: 0.65rem;
        border-bottom: 1px solid #e2e8f0;
        text-align: left;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckInHistoryPage {
  #api = inject(ApiService);
  #reload = new Subject<void>();
  startDate = signal('');
  endDate = signal('');
  minConfidence = signal<number | ''>('');
  maxConfidence = signal<number | ''>('');
  goalCompletion = signal('all');
  supportRequested = signal('all');
  #params = computed(() => {
    const params: Record<string, string | number | boolean> = {};
    if (this.startDate()) params['startDate'] = this.startDate();
    if (this.endDate()) params['endDate'] = this.endDate();
    if (this.minConfidence() !== '') params['minConfidence'] = this.minConfidence();
    if (this.maxConfidence() !== '') params['maxConfidence'] = this.maxConfidence();
    if (this.goalCompletion() !== 'all') params['goalCompletion'] = this.goalCompletion();
    if (this.supportRequested() !== 'all') params['supportRequested'] = this.supportRequested() === 'true';
    return params;
  });
  readonly state$ = this.#reload.pipe(
    startWith(void 0),
    switchMap(() =>
      this.#api.get<CheckInHistoryResponse>('/check-ins/history', this.#params()).pipe(
        map(
          (result) =>
            ({
              status: result.items?.length ? 'loaded' : 'empty',
              data: result,
            }) satisfies ApiState<CheckInHistoryResponse>,
        ),
        startWith({ status: 'loading' } satisfies ApiState<CheckInHistoryResponse>),
        catchError((error: unknown) =>
          of({
            status: 'error',
            message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.',
          } satisfies ApiState<CheckInHistoryResponse>),
        ),
      ),
    ),
  );
  reload() {
    this.#reload.next();
  }
  average(items: CheckInHistoryItem[], key: 'morningConfidence' | 'eveningConfidence') {
    const values = items.map((item) => item[key]).filter((value): value is number => typeof value === 'number');
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }
  completionRate(items: CheckInHistoryItem[]) {
    return items.length ? items.filter((item) => item.goalResult === 'completed').length / items.length : 0;
  }
  label(value: string) {
    return value.replace(/_/g, ' ').replace(/^./, (char) => char.toUpperCase());
  }
  charts(items: CheckInHistoryItem[]) {
    const recent = [...items].sort((a, b) => a.date.localeCompare(b.date));
    return [
      {
        title: 'Confidence trend',
        description: 'Morning-to-evening confidence average by day.',
        valueLabel: 'Average confidence',
        points: recent.map((item) => this.point(item.date, this.avgPair(item), 10)),
      },
      {
        title: 'Study-time trend',
        description: 'Minutes studied by check-in date.',
        valueLabel: 'Study minutes',
        points: recent.map((item) =>
          this.point(item.date, item.studyMinutes, Math.max(60, ...recent.map((entry) => entry.studyMinutes))),
        ),
      },
      {
        title: 'Goal-completion trend',
        description: 'Completed goals score 100, partial goals score 50, and missed goals score 0.',
        valueLabel: 'Goal score',
        points: recent.map((item) =>
          this.point(item.date, item.goalResult === 'completed' ? 100 : item.goalResult === 'partial' ? 50 : 0, 100),
        ),
      },
    ];
  }
  avgPair(item: CheckInHistoryItem) {
    const values = [item.morningConfidence, item.eveningConfidence].filter(
      (value): value is number => typeof value === 'number',
    );
    return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : 0;
  }
  point(date: string, value: number, max: number) {
    return {
      label: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      fullDate: date,
      value,
      percent: max ? Math.max(4, (value / max) * 100) : 4,
    };
  }
}
