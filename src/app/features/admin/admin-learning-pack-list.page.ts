import { AsyncPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';
import { AdminLearningPack, AdminLearningPackListResponse } from '../../core/api/api.types';
import { AdminLearningPackApiService } from '../../core/api/remaining-feature-api.services';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; packs: AdminLearningPack[] };

@Component({
  selector: 'b0-admin-learning-pack-list',
  standalone: true,
  imports: [AsyncPipe, DatePipe, EmptyStateComponent, ErrorStateComponent, FormsModule, LoadingSkeletonComponent, PageHeaderComponent, RouterLink, TitleCasePipe],
  template: `
    <b0-page-header title="Learning Pack Catalog" description="Manage, review, publish, and assign learning packs to scholars.">
      <a class="primary-button" routerLink="/admin/learning-packs/new">Create learning pack</a>
    </b0-page-header>

    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="4" />
      } @else if (state.status === 'error') {
        <b0-error-state [message]="state.message" (retry)="reload()" />
      } @else {
        <section class="catalog-tools" aria-label="Catalog filters">
          <label class="search-field">
            <span>Search learning packs</span>
            <input type="search" placeholder="Search title, code, topic, or ID" [ngModel]="query()" (ngModelChange)="query.set($event)" />
          </label>
          <label>
            <span>Publication status</span>
            <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
              <option value="all">All statuses</option>
              @for (status of statuses(); track status) { <option [value]="status">{{ status | titlecase }}</option> }
            </select>
          </label>
          <p class="result-count" aria-live="polite">{{ filteredPacks().length }} of {{ packs().length }} packs</p>
        </section>

        @if (packs().length === 0) {
          <b0-empty-state title="No learning packs yet" message="Create or import a learning pack to begin building the catalog." />
        } @else if (filteredPacks().length === 0) {
          <b0-empty-state title="No matching learning packs" message="Try a different search term or publication status." />
        } @else {
          <section class="catalog-grid" aria-label="Learning pack catalog">
            @for (pack of filteredPacks(); track pack.id) {
              <article class="pack-card">
                <div class="card-heading">
                  <div class="title-block">
                    <p class="pack-code">{{ pack.code || pack.externalId || 'No catalog code' }}</p>
                    <h2>{{ pack.title }}</h2>
                  </div>
                  <span class="status-badge" [class.published]="publicationStatus(pack) === 'published'">
                    {{ publicationStatus(pack) | titlecase }}
                  </span>
                </div>

                <p class="description">{{ pack.description || pack.summary || 'No description has been added.' }}</p>
                <div class="metadata">
                  @if (pack.topic) { <span>{{ pack.topic }}</span> }
                  @if (pack.audience) { <span>{{ pack.audience }}</span> }
                  @if (pack.updatedAtUtc) { <span>Updated {{ pack.updatedAtUtc | date: 'mediumDate' }}</span> }
                </div>
                <dl class="metrics">
                  <div><dt>Capsules</dt><dd>{{ capsuleCount(pack) }}</dd></div>
                  <div><dt>Questions</dt><dd>{{ questionCount(pack) }}</dd></div>
                  <div><dt>Assignments</dt><dd>{{ pack.assignmentCount ?? 0 }}</dd></div>
                </dl>
                <p class="record-id" [title]="pack.id">Record {{ shortId(pack.id) }}</p>
                <div class="card-actions">
                  <button type="button" class="primary-button" (click)="openAssignment(pack)">Assign</button>
                  <a class="secondary-button" [routerLink]="['/admin/learning-packs', pack.id]">Open details</a>
                  <a class="text-button" [routerLink]="['/admin/learning-packs', pack.id]">{{ publicationStatus(pack) === 'published' ? 'Review' : 'Review & publish' }}</a>
                </div>
              </article>
            }
          </section>
        }
      }
    }

    @if (assignmentPack(); as pack) {
      <div class="dialog-backdrop" role="presentation" (click)="closeAssignment()">
        <section class="assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="assign-title" (click)="$event.stopPropagation()">
          <p class="pack-code">Assign learning pack</p>
          <h2 id="assign-title">{{ pack.title }}</h2>
          <p>Enter one or more scholar IDs, separated by commas. Existing assignments are safely ignored by the API.</p>
          <label><span>Scholar IDs</span><textarea rows="4" [(ngModel)]="scholarIds" placeholder="scholar-123, scholar-456"></textarea></label>
          @if (assignmentError()) { <p class="form-error" role="alert">{{ assignmentError() }}</p> }
          <div class="dialog-actions">
            <button type="button" class="secondary-button" (click)="closeAssignment()">Cancel</button>
            <button type="button" class="primary-button" [disabled]="assigning()" (click)="assign()">{{ assigning() ? 'Assigning…' : 'Assign scholars' }}</button>
          </div>
        </section>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .catalog-tools { align-items: end; background: var(--surface, #fff); border: 1px solid #dbe3ec; border-radius: 14px; display: grid; gap: 1rem; grid-template-columns: minmax(16rem, 2fr) minmax(12rem, 1fr) auto; margin: 1.5rem 0; padding: 1rem; }
    label { display: grid; font-size: .82rem; font-weight: 700; gap: .4rem; }
    input, select, textarea { background: #fff; border: 1px solid #aebdca; border-radius: 8px; color: #17212b; font: inherit; padding: .7rem .8rem; width: 100%; }
    .result-count { color: #526170; margin: 0 0 .75rem; white-space: nowrap; }
    .catalog-grid { display: grid; gap: 1.25rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pack-card { background: var(--surface, #fff); border: 1px solid #dbe3ec; border-radius: 16px; box-shadow: 0 2px 8px rgb(20 40 60 / 6%); display: flex; flex-direction: column; min-height: 22rem; padding: 1.35rem; }
    .card-heading { align-items: start; display: flex; gap: 1rem; justify-content: space-between; }
    .title-block { min-width: 0; } h2 { font-size: 1.2rem; line-height: 1.3; margin: .25rem 0 0; }
    .pack-code, .record-id { color: #617080; font-size: .75rem; letter-spacing: .04em; margin: 0; text-transform: uppercase; }
    .status-badge { background: #fff3d6; border-radius: 999px; color: #755000; font-size: .72rem; font-weight: 800; padding: .35rem .65rem; white-space: nowrap; }
    .status-badge.published { background: #dcf7e7; color: #166534; }
    .description { color: #435363; display: -webkit-box; line-height: 1.55; margin: 1rem 0; min-height: 3em; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
    .metadata { display: flex; flex-wrap: wrap; gap: .45rem; min-height: 2rem; }
    .metadata span { background: #f1f5f8; border-radius: 6px; color: #526170; font-size: .76rem; padding: .3rem .5rem; }
    .metrics { border-block: 1px solid #e4eaf0; display: grid; grid-template-columns: repeat(3, 1fr); margin: 1rem 0 .7rem; padding: .9rem 0; text-align: center; }
    .metrics div + div { border-left: 1px solid #e4eaf0; } .metrics dt { color: #657383; font-size: .72rem; } .metrics dd { font-size: 1.15rem; font-weight: 800; margin: .2rem 0 0; }
    .record-id { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .card-actions, .dialog-actions { align-items: center; display: flex; flex-wrap: wrap; gap: .65rem; margin-top: auto; padding-top: 1rem; }
    .primary-button, .secondary-button, .text-button { border-radius: 8px; cursor: pointer; display: inline-flex; font: inherit; font-size: .86rem; font-weight: 750; justify-content: center; padding: .65rem .9rem; text-decoration: none; }
    .primary-button { background: #075f8f; border: 1px solid #075f8f; color: white; } .secondary-button { background: white; border: 1px solid #8da0b1; color: #17324a; } .text-button { background: transparent; border: 0; color: #075f8f; }
    button:disabled { cursor: wait; opacity: .6; }
    .dialog-backdrop { align-items: center; background: rgb(8 20 31 / 60%); display: flex; inset: 0; justify-content: center; padding: 1rem; position: fixed; z-index: 1000; }
    .assignment-dialog { background: white; border-radius: 16px; box-shadow: 0 20px 50px rgb(0 0 0 / 30%); max-width: 34rem; padding: 1.5rem; width: 100%; }
    .assignment-dialog h2 { margin-bottom: .5rem; } .assignment-dialog p { color: #526170; } .dialog-actions { justify-content: flex-end; }
    .form-error { color: #a51d2d !important; font-weight: 700; }
    @media (max-width: 760px) { .catalog-tools, .catalog-grid { grid-template-columns: 1fr; } .result-count { margin: 0; } .pack-card { min-height: 0; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLearningPackListPage {
  readonly #api = inject(AdminLearningPackApiService);
  readonly #reload = new Subject<void>();
  readonly packs = signal<AdminLearningPack[]>([]);
  readonly query = signal('');
  readonly statusFilter = signal('all');
  readonly assignmentPack = signal<AdminLearningPack | null>(null);
  readonly assignmentError = signal('');
  readonly assigning = signal(false);
  scholarIds = '';

  readonly state$ = this.#reload.pipe(
    startWith(undefined),
    switchMap(() => this.#api.catalog().pipe(
      map((response) => {
        const packs = this.unwrap(response);
        this.packs.set(packs);
        return { status: 'loaded', packs } satisfies LoadState;
      }),
      startWith({ status: 'loading' } satisfies LoadState),
      catchError((error: unknown) => of({ status: 'error', message: error instanceof Error ? error.message : 'Learning packs could not be loaded.' } satisfies LoadState)),
    )),
  );
  readonly statuses = computed(() => [...new Set(this.packs().map((pack) => this.publicationStatus(pack)))].sort());
  readonly filteredPacks = computed(() => {
    const query = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    return this.packs().filter((pack) =>
      (status === 'all' || this.publicationStatus(pack) === status) &&
      (!query || [pack.title, pack.code, pack.externalId, pack.topic, pack.id].some((value) => value?.toLowerCase().includes(query))),
    );
  });

  reload() { this.#reload.next(); }
  publicationStatus(pack: AdminLearningPack) { return (pack.publicationStatus || pack.status || 'draft').toLowerCase(); }
  capsuleCount(pack: AdminLearningPack) { return pack.capsuleCount ?? pack.totalCapsules ?? pack.capsules?.length ?? 0; }
  questionCount(pack: AdminLearningPack) { return pack.questionCount ?? pack.totalQuestions ?? pack.capsules?.reduce((sum, item) => sum + (item.questionCount ?? item.totalQuestions ?? 0), 0) ?? 0; }
  shortId(id: string) { return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id; }
  openAssignment(pack: AdminLearningPack) { this.assignmentError.set(''); this.scholarIds = ''; this.assignmentPack.set(pack); }
  closeAssignment() { if (!this.assigning()) this.assignmentPack.set(null); }
  assign() {
    const pack = this.assignmentPack();
    const scholarIds = [...new Set(this.scholarIds.split(',').map((id) => id.trim()).filter(Boolean))];
    if (!pack || scholarIds.length === 0) { this.assignmentError.set('Enter at least one scholar ID.'); return; }
    this.assigning.set(true); this.assignmentError.set('');
    this.#api.assign(pack.id, scholarIds).subscribe({
      next: () => { this.assigning.set(false); this.assignmentPack.set(null); this.reload(); },
      error: () => { this.assigning.set(false); this.assignmentError.set('The scholars could not be assigned. Check the IDs and try again.'); },
    });
  }
  unwrap(response: AdminLearningPackListResponse | AdminLearningPack[]) {
    if (Array.isArray(response)) return response;
    return response.items ?? response.data ?? [];
  }
}
