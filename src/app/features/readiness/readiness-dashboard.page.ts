import { AsyncPipe, DatePipe, DecimalPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';

interface ReadinessComponentScore {
  key: string;
  label: string;
  score: number;
  description?: string;
}

interface ReadinessDashboardDto {
  readinessLevel: string;
  academicScore: number;
  engagementScore: number;
  lastCalculatedAt: string;
  formulaVersion: string;
  academicComponents: ReadinessComponentScore[];
  engagementComponents: ReadinessComponentScore[];
  improvementActions: string[];
}

interface ApiState<T> { status: 'loading' | 'loaded' | 'empty' | 'error'; data?: T; message?: string }

type RawReadiness = Partial<ReadinessDashboardDto> & Record<string, unknown>;

const academicLabels: Record<string, string> = {
  knowledgeAccuracy: 'Knowledge accuracy',
  clinicalScenarioPerformance: 'Clinical scenario performance',
  rehearsalPerformance: 'Rehearsal performance',
  topicCoverage: 'Topic coverage',
  completion: 'Completion',
};

const engagementLabels: Record<string, string> = {
  consistency: 'Consistency',
  checkInParticipation: 'Check-in participation',
  studyStreak: 'Study streak',
  teamParticipation: 'Team participation',
};

@Component({
  selector: 'b0-readiness-dashboard',
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, NgClass, NgTemplateOutlet, PageHeaderComponent, LoadingSkeletonComponent, EmptyStateComponent, ErrorStateComponent],
  template: `<section class="grid gap-6" aria-labelledby="readiness-title">
    <b0-page-header
      titleId="readiness-title"
      eyebrow="Readiness"
      title="Your Block Zero Readiness"
      description="Review academic readiness and engagement habits as separate preparation signals."
    />

    @if (state$ | async; as state) {
      @if (state.status === 'loading') { <b0-loading-skeleton [rows]="8" label="Loading readiness dashboard" /> }
      @else if (state.status === 'error') { <b0-error-state title="Readiness unavailable" [message]="state.message || 'Unable to load readiness data.'" (retry)="reload()" /> }
      @else if (state.status === 'empty') { <b0-empty-state title="Readiness is not calculated yet" message="Complete questions, scenarios, rehearsal, check-ins, and team activities to generate your readiness indicators." /> }
      @else if (state.data; as data) {
        <article class="rounded-3xl border border-[var(--b0-border)] bg-white p-5 shadow-sm" aria-labelledby="primary-readiness-title">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="m-0 text-sm font-bold uppercase tracking-wide text-[var(--b0-primary)]">Primary readiness card</p>
              <h2 id="primary-readiness-title" class="m-0 mt-1 text-3xl font-black text-[var(--b0-text)]">{{ data.readinessLevel }}</h2>
              <p class="m-0 mt-2 text-sm text-[var(--b0-text-muted)]">Last calculated {{ data.lastCalculatedAt | date:'medium' }} · Formula {{ data.formulaVersion }}</p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2 lg:min-w-[28rem]" aria-label="Separated readiness scores">
              <div class="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
                <p class="m-0 text-sm font-bold text-blue-900">Academic score</p>
                <p class="m-0 mt-2 text-4xl font-black text-blue-950">{{ data.academicScore | number:'1.0-0' }}%</p>
                <p class="m-0 mt-2 text-xs text-blue-900">Exam-preparation performance signal</p>
              </div>
              <div class="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
                <p class="m-0 text-sm font-bold text-emerald-900">Engagement score</p>
                <p class="m-0 mt-2 text-4xl font-black text-emerald-950">{{ data.engagementScore | number:'1.0-0' }}%</p>
                <p class="m-0 mt-2 text-xs text-emerald-900">Participation and consistency signal</p>
              </div>
            </div>
          </div>
        </article>

        <div class="grid gap-5 lg:grid-cols-2">
          <section class="rounded-3xl border border-blue-200 bg-white p-5 shadow-sm" aria-labelledby="academic-components-title">
            <h2 id="academic-components-title" class="m-0 text-2xl font-black text-blue-950">Academic components</h2>
            <p class="m-0 mt-1 text-sm text-[var(--b0-text-muted)]">Academic results are shown independently so weak performance remains visible.</p>
            <div class="mt-4 grid gap-3">
              @for (component of data.academicComponents; track component.key) { <ng-container [ngTemplateOutlet]="scoreRow" [ngTemplateOutletContext]="{ $implicit: component, tone: 'academic' }" /> }
            </div>
          </section>

          <section class="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm" aria-labelledby="engagement-components-title">
            <h2 id="engagement-components-title" class="m-0 text-2xl font-black text-emerald-950">Engagement components</h2>
            <p class="m-0 mt-1 text-sm text-[var(--b0-text-muted)]">Engagement is helpful context, not a cover for academic gaps.</p>
            <div class="mt-4 grid gap-3">
              @for (component of data.engagementComponents; track component.key) { <ng-container [ngTemplateOutlet]="scoreRow" [ngTemplateOutletContext]="{ $implicit: component, tone: 'engagement' }" /> }
            </div>
          </section>
        </div>

        <section class="rounded-3xl border border-[var(--b0-border)] bg-white p-5 shadow-sm" aria-labelledby="actions-title">
          <h2 id="actions-title" class="m-0 text-2xl font-black">Improvement actions</h2>
          <ul class="mt-4 grid gap-3 p-0 sm:grid-cols-2" role="list">
            @for (action of data.improvementActions; track action) { <li class="flex gap-3 rounded-2xl bg-[var(--b0-surface)] p-4"><span aria-hidden="true">→</span><span>{{ action }}</span></li> }
          </ul>
        </section>

        <p class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950" role="note">This is a preparation indicator only. It does not guarantee exam success.</p>
      }
    }

    <ng-template #scoreRow let-component let-tone="tone">
      <div class="grid gap-2 rounded-2xl border border-[var(--b0-border)] p-4">
        <div class="flex items-center justify-between gap-3">
          <span class="font-bold">{{ component.label }}</span>
          <span class="font-black">{{ component.score | number:'1.0-0' }}%</span>
        </div>
        <div class="h-3 overflow-hidden rounded-full bg-slate-100" [attr.aria-label]="component.label + ' score ' + component.score + '%'">
          <div class="h-full rounded-full" [ngClass]="tone === 'academic' ? 'bg-blue-600' : 'bg-emerald-600'" [style.width.%]="component.score"></div>
        </div>
        @if (component.description) { <p class="m-0 text-sm text-[var(--b0-text-muted)]">{{ component.description }}</p> }
      </div>
    </ng-template>
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadinessDashboardPage {
  #api = inject(ApiService);
  #route = inject(ActivatedRoute);
  #refresh$ = new BehaviorSubject<void>(undefined);

  readonly state$: Observable<ApiState<ReadinessDashboardDto>> = this.#refresh$.pipe(
    switchMap(() => this.#route.data.pipe(
      switchMap((data) => this.#api.get<RawReadiness>(String(data['apiPath'] ?? '/readiness/current')).pipe(
        map((result) => result ? ({ status: 'loaded', data: this.normalize(result) } satisfies ApiState<ReadinessDashboardDto>) : ({ status: 'empty' } satisfies ApiState<ReadinessDashboardDto>)),
        startWith({ status: 'loading' } satisfies ApiState<ReadinessDashboardDto>),
        catchError((error: unknown) => of({ status: 'error', message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.' } satisfies ApiState<ReadinessDashboardDto>)),
      )),
    )),
  );

  normalize(result: RawReadiness): ReadinessDashboardDto {
    return {
      readinessLevel: String(result['readinessLevel'] ?? result['level'] ?? 'Readiness pending'),
      academicScore: this.score(result['academicScore']),
      engagementScore: this.score(result['engagementScore']),
      lastCalculatedAt: String(result['lastCalculatedAt'] ?? result['lastCalculatedDate'] ?? new Date().toISOString()),
      formulaVersion: String(result['formulaVersion'] ?? 'v1'),
      academicComponents: this.components(result['academicComponents'], academicLabels),
      engagementComponents: this.components(result['engagementComponents'], engagementLabels),
      improvementActions: this.actions(result['improvementActions']),
    };
  }

  reload() { this.#refresh$.next(); }

  private components(value: unknown, labels: Record<string, string>): ReadinessComponentScore[] {
    const source = (value && typeof value === 'object' && !Array.isArray(value)) ? value as Record<string, unknown> : {};
    return Object.entries(labels).map(([key, label]) => ({ key, label, score: this.score(source[key]) }));
  }

  private actions(value: unknown): string[] {
    const fallback = ['Review cardiovascular questions', 'Complete two pending scenarios', 'Revisit marked questions', 'Improve daily consistency'];
    return Array.isArray(value) && value.length ? value.map(String) : fallback;
  }

  private score(value: unknown): number {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) ? Math.min(100, Math.max(0, numeric)) : 0;
  }
}
