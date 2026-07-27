import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, Subject, switchMap } from 'rxjs';
import { AdminAuditApiService } from '../../core/api/remaining-feature-api.services';
import { AdminAuditEvent } from '../../core/api/api.types';
import { AuthStore } from '../../core/auth/auth.store';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AuditEventDetailDialog } from './audit-event-detail.dialog';
import { actionLabel, normalizeAuditResponse } from './audit-event.utils';

type AuditState =
  | { status: 'loading' }
  | { status: 'loaded'; data: AdminAuditEvent[]; total: number; nextCursor?: string }
  | { status: 'empty' }
  | { status: 'error'; message: string };

@Component({
  selector: 'b0-admin-audit',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, MatButtonModule, MatChipsModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule, MatSortModule, MatTableModule, MatTooltipModule, PageHeaderComponent, LoadingSkeletonComponent, EmptyStateComponent, ErrorStateComponent],
  template: `
    <b0-page-header title="Audit Log" description="Review administrative, content, enrollment, assignment, and security activity across the academy.">
      @if (canExport) { <button mat-stroked-button type="button" (click)="exportCsv()" [disabled]="exporting()"><mat-icon>download</mat-icon>{{ exporting() ? 'Exporting…' : 'Export CSV' }}</button> }
      <button mat-icon-button type="button" aria-label="Refresh audit events" matTooltip="Refresh" (click)="refresh()"><mat-icon>refresh</mat-icon></button>
    </b0-page-header>

    <form class="filters" [formGroup]="filters" aria-label="Audit log filters">
      <mat-form-field appearance="outline" class="search"><mat-label>Search audit activity</mat-label><mat-icon matPrefix>search</mat-icon><input matInput formControlName="search" placeholder="Actor, entity, event or trace ID" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Date range</mat-label><mat-select formControlName="range"><mat-option value="today">Today</mat-option><mat-option value="7d">Last 7 days</mat-option><mat-option value="30d">Last 30 days</mat-option><mat-option value="month">This month</mat-option><mat-option value="custom">Custom</mat-option></mat-select></mat-form-field>
      @if (filters.controls.range.value === 'custom') {
        <mat-form-field appearance="outline"><mat-label>Start date</mat-label><input matInput [matDatepicker]="startPicker" formControlName="start" /><mat-datepicker-toggle matIconSuffix [for]="startPicker"/><mat-datepicker #startPicker/></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>End date</mat-label><input matInput [matDatepicker]="endPicker" formControlName="end" /><mat-datepicker-toggle matIconSuffix [for]="endPicker"/><mat-datepicker #endPicker/></mat-form-field>
      }
      <mat-form-field appearance="outline"><mat-label>Actor</mat-label><input matInput formControlName="actor" placeholder="Name, email, or ID" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Action</mat-label><input matInput formControlName="action" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Entity type</mat-label><mat-select formControlName="entityType"><mat-option value="">All</mat-option>@for(option of entityTypes;track option){<mat-option [value]="option">{{ option }}</mat-option>}</mat-select></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Entity</mat-label><input matInput formControlName="entity" placeholder="Title or ID" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Category</mat-label><mat-select formControlName="category"><mat-option value="">All</mat-option>@for(option of categories;track option){<mat-option [value]="option">{{ option }}</mat-option>}</mat-select></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Outcome</mat-label><mat-select formControlName="outcome"><mat-option value="">All</mat-option>@for(option of outcomes;track option){<mat-option [value]="option">{{ option }}</mat-option>}</mat-select></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Source</mat-label><input matInput formControlName="source" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Severity</mat-label><mat-select formControlName="severity"><mat-option value="">All</mat-option>@for(option of severities;track option){<mat-option [value]="option">{{ option }}</mat-option>}</mat-select></mat-form-field>
      <button mat-button type="button" (click)="clearFilters()"><mat-icon>filter_alt_off</mat-icon>Clear filters</button>
    </form>
    @if (dateError()) { <p class="validation" role="alert">Start date cannot be after end date.</p> }

    @switch (state().status) {
      @case ('loading') { <b0-loading-skeleton [rows]="8" /> }
      @case ('error') { <b0-error-state [message]="errorMessage()" (retry)="refresh()" /> }
      @case ('empty') { <b0-empty-state icon="manage_search" title="No audit events" message="No audit events match the selected filters." /> }
      @case ('loaded') {
        <section class="table-card" aria-live="polite">
          <div class="table-scroll">
            <table mat-table matSort (matSortChange)="sortChanged($event)" [dataSource]="events()" aria-label="Audit events">
              <ng-container matColumnDef="time"><th mat-header-cell *matHeaderCellDef mat-sort-header="createdAtUtc">Time</th><td mat-cell *matCellDef="let event"><strong>{{ event.createdAtUtc | date:'medium' }}</strong></td></ng-container>
              <ng-container matColumnDef="actor"><th mat-header-cell *matHeaderCellDef mat-sort-header="actor">Actor</th><td mat-cell *matCellDef="let event"><strong>{{ actorName(event) }}</strong>@if(event.actorEmail){<small>{{ event.actorEmail }}</small>}</td></ng-container>
              <ng-container matColumnDef="action"><th mat-header-cell *matHeaderCellDef mat-sort-header="action">Action</th><td mat-cell *matCellDef="let event"><strong>{{ label(event.action) }}</strong>@if(event.severity){<span class="severity severity-{{event.severity}}">{{ event.severity }}</span>}</td></ng-container>
              <ng-container matColumnDef="entity"><th mat-header-cell *matHeaderCellDef>Entity</th><td mat-cell *matCellDef="let event"><strong>{{ event.entityTitle || 'Unknown entity' }}</strong><small>{{ event.entityType || 'Unknown type' }} @if(event.entityId){ · <span class="id">{{ event.entityId }}</span>}</small></td></ng-container>
              <ng-container matColumnDef="outcome"><th mat-header-cell *matHeaderCellDef mat-sort-header="outcome">Outcome</th><td mat-cell *matCellDef="let event"><span class="badge outcome-{{ event.outcome || 'unknown' }}">{{ event.outcome || 'Unknown' }}</span></td></ng-container>
              <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef mat-sort-header="category">Category</th><td mat-cell *matCellDef="let event"><mat-chip>{{ event.category || 'Uncategorized' }}</mat-chip></td></ng-container>
              <ng-container matColumnDef="summary"><th mat-header-cell *matHeaderCellDef>Summary</th><td mat-cell *matCellDef="let event"><span class="summary">{{ summary(event) }}</span></td></ng-container>
              <ng-container matColumnDef="source"><th mat-header-cell *matHeaderCellDef>Source</th><td mat-cell *matCellDef="let event">{{ event.source || '—' }}</td></ng-container>
              <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let event"><button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Actions for audit event" matTooltip="Event actions"><mat-icon>more_vert</mat-icon></button><mat-menu #menu="matMenu"><button mat-menu-item (click)="openDetails(event)"><mat-icon>visibility</mat-icon>View details</button>@if(actorRoute(event);as route){<a mat-menu-item [routerLink]="route"><mat-icon>person</mat-icon>Open actor profile</a>}@if(entityRoute(event);as route){<a mat-menu-item [routerLink]="route"><mat-icon>open_in_new</mat-icon>Open related entity</a>}<button mat-menu-item (click)="copy(event.id)"><mat-icon>content_copy</mat-icon>Copy event ID</button>@if(event.traceId){<button mat-menu-item (click)="copy(event.traceId)"><mat-icon>content_copy</mat-icon>Copy trace ID</button>}</mat-menu></td></ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>
          <footer><span>Showing {{ events().length }} of {{ total() }} events</span>@if(nextCursor()){<button mat-stroked-button type="button" (click)="loadMore()" [disabled]="loadingMore()">{{loadingMore()?'Loading…':'Load more'}}</button>}</footer>
        </section>
      }
    }
  `,
  styles: [`
    :host{display:block}.filters{display:grid;grid-template-columns:2fr repeat(5,minmax(9rem,1fr));gap:.65rem;align-items:start;margin:1rem 0}.filters .search{grid-column:span 2}.filters button{height:3.5rem}.validation{color:var(--b0-error)}.table-card{background:var(--b0-surface-strong);border:1px solid var(--b0-border);border-radius:var(--b0-radius-md);overflow:hidden}.table-scroll{overflow:auto}table{width:100%;min-width:1050px}th{font-weight:700;color:var(--b0-text)}td{vertical-align:top;padding-top:.75rem!important;padding-bottom:.75rem!important}td strong,td small{display:block}td small,.id{color:var(--b0-text-muted);font-size:.76rem}.id{font-family:monospace}.badge,.severity{display:inline-block;border-radius:999px;padding:.15rem .5rem;text-transform:capitalize;font-size:.75rem;font-weight:700}.severity{margin-top:.25rem}.outcome-success{color:var(--b0-success);background:color-mix(in srgb,var(--b0-success) 13%,transparent)}.outcome-failed,.outcome-denied,.severity-error,.severity-critical{color:var(--b0-error);background:color-mix(in srgb,var(--b0-error) 13%,transparent)}.outcome-partial,.outcome-pending,.severity-warning{color:var(--b0-warning);background:color-mix(in srgb,var(--b0-warning) 13%,transparent)}.summary{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:18rem}footer{display:flex;align-items:center;justify-content:space-between;padding:.8rem 1rem;border-top:1px solid var(--b0-border);color:var(--b0-text-muted)}@media(max-width:1050px){.filters{grid-template-columns:repeat(3,1fr)}.mat-column-source,.mat-column-category{display:none}}@media(max-width:700px){.filters{grid-template-columns:1fr}.filters .search{grid-column:auto}.mat-column-category,.mat-column-source,.mat-column-summary{display:none}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAuditPage {
  readonly #api = inject(AdminAuditApiService);
  readonly #auth = inject(AuthStore);
  readonly #dialog = inject(MatDialog);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #destroyRef = inject(DestroyRef);
  readonly #requests = new Subject<void>();
  readonly state = signal<AuditState>({ status: 'loading' });
  readonly events = signal<AdminAuditEvent[]>([]);
  readonly total = signal(0);
  readonly nextCursor = signal<string | undefined>(undefined);
  readonly loadingMore = signal(false);
  readonly exporting = signal(false);
  readonly dateError = signal(false);
  readonly columns = ['time', 'actor', 'action', 'entity', 'outcome', 'category', 'summary', 'source', 'actions'];
  readonly categories = ['content', 'user', 'security', 'enrollment', 'assignment', 'challenge', 'cohort', 'system'];
  readonly outcomes = ['success', 'failed', 'denied', 'partial', 'skipped', 'pending'];
  readonly severities = ['info', 'warning', 'error', 'critical'];
  readonly entityTypes = ['user', 'learningPack', 'cohort', 'challenge', 'assignment', 'review'];
  readonly label = actionLabel;
  readonly canExport = this.#auth.hasPermission(['audit.export']);
  readonly filters = new FormGroup({
    search: new FormControl(this.query('search'), { nonNullable: true }), actor: new FormControl(this.query('actor'), { nonNullable: true }), action: new FormControl(this.query('action'), { nonNullable: true }), entityType: new FormControl(this.query('entityType'), { nonNullable: true }), entity: new FormControl(this.query('entity'), { nonNullable: true }), category: new FormControl(this.query('category'), { nonNullable: true }), outcome: new FormControl(this.query('outcome'), { nonNullable: true }), source: new FormControl(this.query('source'), { nonNullable: true }), severity: new FormControl(this.query('severity'), { nonNullable: true }), range: new FormControl(this.query('range') || '30d', { nonNullable: true }), start: new FormControl<Date | null>(this.dateQuery('start')), end: new FormControl<Date | null>(this.dateQuery('end')), sort: new FormControl(this.query('sort') || 'createdAtUtc:desc', { nonNullable: true }),
  });

  constructor() {
    this.filters.valueChanges.pipe(debounceTime(300), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)), takeUntilDestroyed()).subscribe(() => { if (this.validDates()) { this.syncQuery(); this.#requests.next(); } });
    this.#requests.pipe(startWith(undefined), switchMap(() => { this.state.set({ status: 'loading' }); return this.#api.list(this.params()).pipe(map(normalizeAuditResponse), catchError((error: unknown) => of(error instanceof Error ? error : new Error('The audit service is unavailable.')))); }), takeUntilDestroyed()).subscribe((result) => {
      if (result instanceof Error) { this.state.set({ status: 'error', message: result.message }); return; }
      this.events.set(result.items); this.total.set(result.total); this.nextCursor.set(result.nextCursor); this.state.set(result.items.length ? { status: 'loaded', data: result.items, total: result.total, nextCursor: result.nextCursor } : { status: 'empty' });
    });
  }
  query(key: string) { return this.#route.snapshot.queryParamMap.get(key) ?? ''; }
  dateQuery(key: string) { const value = this.query(key); return value ? new Date(value) : null; }
  validDates() { const { start, end } = this.filters.getRawValue(); const valid = !start || !end || start <= end; this.dateError.set(!valid); return valid; }
  params(cursor?: string) { const raw = this.filters.getRawValue(); const params: Record<string, string | number | boolean> = { limit: 50, sort: raw.sort }; const dates = this.rangeDates(raw.range, raw.start, raw.end); Object.entries({ search: raw.search, actor: raw.actor, action: raw.action, entityType: raw.entityType, entity: raw.entity, category: raw.category, outcome: raw.outcome, source: raw.source, severity: raw.severity, start: dates.start, end: dates.end, cursor }).forEach(([key, value]) => { if (value) params[key] = value instanceof Date ? value.toISOString() : value; }); return params; }
  rangeDates(range: string, customStart: Date | null, customEnd: Date | null) { const end = new Date(); let start: Date | null = null; if (range === 'today') start = new Date(end.getFullYear(), end.getMonth(), end.getDate()); else if (range === '7d' || range === '30d') { start = new Date(end); start.setDate(start.getDate() - (range === '7d' ? 7 : 30)); } else if (range === 'month') start = new Date(end.getFullYear(), end.getMonth(), 1); else { start = customStart; end.setTime(customEnd?.getTime() ?? end.getTime()); } return { start, end }; }
  syncQuery() { const values = this.filters.getRawValue(); const queryParams = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value instanceof Date ? value.toISOString().slice(0, 10) : value || null])); void this.#router.navigate([], { relativeTo: this.#route, queryParams, replaceUrl: true }); }
  refresh() { this.#requests.next(); }
  clearFilters() { this.filters.reset({ search: '', actor: '', action: '', entityType: '', entity: '', category: '', outcome: '', source: '', severity: '', range: '30d', start: null, end: null, sort: 'createdAtUtc:desc' }); }
  sortChanged(sort: Sort) { if (!sort.direction) return; this.filters.controls.sort.setValue(`${sort.active}:${sort.direction}`); }
  loadMore() { const cursor = this.nextCursor(); if (!cursor) return; this.loadingMore.set(true); this.#api.list(this.params(cursor)).pipe(map(normalizeAuditResponse), takeUntilDestroyed(this.#destroyRef)).subscribe({ next: (page) => { const combined = new Map(this.events().map((event) => [event.id, event])); page.items.forEach((event) => combined.set(event.id, event)); this.events.set([...combined.values()]); this.total.set(page.total); this.nextCursor.set(page.nextCursor); this.state.set({ status: 'loaded', data: this.events(), total: page.total, nextCursor: page.nextCursor }); this.loadingMore.set(false); }, error: () => this.loadingMore.set(false) }); }
  openDetails(event: AdminAuditEvent) { this.#dialog.open(AuditEventDetailDialog, { data: event, width: '760px', maxWidth: '95vw', autoFocus: 'dialog' }); }
  actorName(event: AdminAuditEvent) { return event.actorDisplayName || (event.actorType === 'system' ? 'System' : event.actorId ? 'Unknown user' : 'System'); }
  summary(event: AdminAuditEvent) { return event.notes || (event.changedFields?.length ? `Changed ${event.changedFields.join(', ')}` : 'No additional summary'); }
  actorRoute(event: AdminAuditEvent) { return event.actorId && event.actorType !== 'system' ? ['/admin/users', event.actorId] : null; }
  entityRoute(event: AdminAuditEvent) { const routes: Record<string, string> = { user: 'users', cohort: 'cohorts', challenge: 'challenges', learningPack: 'learning-packs' }; const segment = routes[event.entityType ?? '']; return segment && event.entityId ? ['/admin', segment, event.entityId] : null; }
  copy(value: string) { void navigator.clipboard?.writeText(value); }
  exportCsv() { if (!this.canExport) return; this.exporting.set(true); this.#api.export(this.params()).pipe(takeUntilDestroyed(this.#destroyRef)).subscribe({ next: (blob) => { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = this.exportName(); anchor.click(); URL.revokeObjectURL(url); this.exporting.set(false); }, error: () => this.exporting.set(false) }); }
  exportName() { const { start, end } = this.rangeDates(this.filters.controls.range.value, this.filters.controls.start.value, this.filters.controls.end.value); const date = (value: Date) => value.toISOString().slice(0, 10); return start ? `audit-log-${date(start)}-to-${date(end)}.csv` : `audit-log-${date(end)}.csv`; }
  errorMessage() { const current = this.state(); return current.status === 'error' ? current.message : 'Unable to load audit events.'; }
}
