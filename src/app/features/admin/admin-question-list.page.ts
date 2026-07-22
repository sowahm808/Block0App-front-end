import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { DataTemplateComponent } from '../../shared/components/data-template.component';

interface ApiState<T> { status: 'loading' | 'loaded' | 'empty' | 'error'; data?: T; message?: string }

@Component({
  selector: 'b0-admin-question-list',
  standalone: true,
  imports: [AsyncPipe, DataTemplateComponent, PageHeaderComponent, LoadingSkeletonComponent, EmptyStateComponent, ErrorStateComponent],
  template: `<b0-page-header title="Admin Question List" description="Production page for Block Zero workflows." />
  @if (state$ | async; as state) {
    @if (state.status === 'loading') { <b0-loading-skeleton [rows]="4" /> }
    @else if (state.status === 'error') { <b0-error-state [message]="state.message || 'Unable to load data.'" (retry)="reload()" /> }
    @else if (state.status === 'empty') { <b0-empty-state title="No records available" message="The backend has no records for this view yet. Unsupported actions stay disabled until API support exists." /> }
    @else { <b0-data-template [data]="state.data" ariaLabel="Admin Question List content" /> }
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminQuestionListPage {
  #api = inject(ApiService);
  #route = inject(ActivatedRoute);
  readonly state$ = this.#route.data.pipe(
    switchMap((data) => this.#api.get<unknown>(String(data['apiPath'] ?? '/health')).pipe(
      map((result) => ({ status: result ? 'loaded' : 'empty', data: result }) satisfies ApiState<unknown>),
      startWith({ status: 'loading' } satisfies ApiState<unknown>),
      catchError((error: unknown) => of({ status: 'error', message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.' } satisfies ApiState<unknown>)),
    )),
  );
  reload() { window.location.reload(); }
}
