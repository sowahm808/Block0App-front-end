import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { DataTemplateComponent } from '../../shared/components/data-template.component';

interface ApiState<T> { status: 'loading' | 'loaded' | 'empty' | 'error'; data?: T; message?: string }

@Component({
  selector: 'b0-scenario-review', standalone: true,
  imports: [AsyncPipe, RouterLink, MatButtonModule, DataTemplateComponent, PageHeaderComponent, LoadingSkeletonComponent, EmptyStateComponent, ErrorStateComponent],
  template: `<nav class="mb-4 text-sm"><a mat-button routerLink="/review/scenarios">← Back</a></nav>
    <b0-page-header title="Scenario review" description="Loads this detail page with a resolved route identifier before calling the backend." />
    @if (state$ | async; as state) {
      @if (state.status === 'loading') { <b0-loading-skeleton [rows]="4" /> }
      @else if (state.status === 'error') { <b0-error-state [message]="state.message || 'Unable to load this record.'" (retry)="reload()" /> }
      @else if (state.status === 'empty') { <b0-empty-state title="Record not available" message="The record was deleted, is inaccessible, or the identifier is missing." /> }
      @else { <b0-data-template [data]="state.data" ariaLabel="Scenario review content" /> }
    } @else { <b0-empty-state title="Scenario review is starting" message="The page will show a safe error instead of going blank if the record cannot be loaded." /> }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioReviewPage {
  readonly #api = inject(ApiService); readonly #route = inject(ActivatedRoute);
  readonly state$ = this.#route.paramMap.pipe(switchMap((params) => {
    const id = params.get('scenarioId');
    if (!id) return of({ status: 'error', message: 'Missing required route id: scenarioId.' } satisfies ApiState<unknown>);
    return this.#api.get<unknown>('/review/scenarios/{scenarioId}'.replace('{scenarioId}', encodeURIComponent(id))).pipe(
      map((result) => ({ status: result ? 'loaded' : 'empty', data: result }) satisfies ApiState<unknown>),
      startWith({ status: 'loading' } satisfies ApiState<unknown>),
      catchError((error: unknown) => of({ status: 'error', message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.' } satisfies ApiState<unknown>)),
    );
  }));
  reload() { window.location.reload(); }
}
