import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ContentImportService } from '../data-access/content-import.service';
import {
  LearningPackImportRecord,
  LearningPackImportRequest,
  LearningPackImportSummary,
  ProblemDetails,
} from '../../../core/api/api.types';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatCardModule],
  template: `<section class="grid gap-5" aria-labelledby="review-title">
    <header>
      <a class="font-bold" routerLink="/admin/learning-packs/import">← Import history</a>
      <p class="eyebrow mt-4">Administrator workflow</p>
      <h1 id="review-title">Review learning pack import</h1>
    </header>
    @if (loading()) {
      <mat-card class="p-5">Loading extracted content…</mat-card>
    }
    @if (record(); as item) {
      <mat-card class="grid gap-3 p-5"
        ><div class="flex flex-wrap justify-between gap-3">
          <div>
            <h2 class="m-0">{{ item.packTitle || item.draft?.learningPack?.title || 'Untitled learning pack' }}</h2>
            <p class="m-0">{{ item.sourceFileName }}</p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 font-bold">{{ statusLabel(item.status) }}</span>
        </div>
        <p class="m-0">
          External IDs identify updates. Keep them stable after the first commit. Committed content remains in draft
          status.
        </p></mat-card
      >
      @if (item.extractionWarnings?.length) {
        <mat-card class="border border-amber-300 bg-amber-50 p-5"
          ><h2>Extraction warnings</h2>
          <ul>
            @for (warning of item.extractionWarnings; track $index) {
              <li>{{ issueText(warning) }}</li>
            }
          </ul></mat-card
        >
      }
      @if (item.validationErrors?.length) {
        <mat-card class="border border-red-300 bg-red-50 p-5"
          ><h2>Blocking validation errors</h2>
          <ul>
            @for (error of item.validationErrors; track $index) {
              <li>{{ issueText(error) }}</li>
            }
          </ul></mat-card
        >
      }
      <mat-card class="grid gap-4 p-5"
        ><div>
          <h2 class="m-0">Extracted draft</h2>
          <p>
            Edit the complete payload below. Correct-answer data must remain inside each question's
            <code>explanation</code> object; choice IDs must be lowercase <code>a</code> through <code>f</code>.
          </p>
        </div>
        <label class="font-bold" for="draft-json">LearningPackImportPayload</label
        ><textarea
          id="draft-json"
          class="min-h-[34rem] w-full rounded border p-3 font-mono text-sm"
          [(ngModel)]="draftJson"
          (ngModelChange)="checkJson()"
          spellcheck="false"
        ></textarea>
        @if (jsonError()) {
          <p class="m-0 text-red-700" role="alert">{{ jsonError() }}</p>
        }
        <div class="flex flex-wrap gap-2">
          <button mat-flat-button color="primary" type="button" [disabled]="busy() || !!jsonError()" (click)="save()">
            Save draft</button
          ><button mat-stroked-button type="button" [disabled]="busy() || dirty()" (click)="validate()">Validate</button
          ><button
            mat-flat-button
            color="primary"
            type="button"
            [disabled]="busy() || dirty() || !canCommit()"
            (click)="commit()"
          >
            Commit draft content</button
          ><button mat-button type="button" (click)="load()">Refresh</button>
        </div>
        @if (dirty()) {
          <p class="m-0 text-sm">Save your changes before validating or committing.</p>
        }
      </mat-card>
      @if (summary(); as result) {
        <mat-card class="p-5"
          ><h2>Commit complete</h2>
          <p>
            {{ result.created }} created · {{ result.updated }} updated · {{ result.skipped }} unchanged ·
            {{ result.failed }} failed
          </p>
          <p>Imported content is still draft and must be published separately.</p></mat-card
        >
      }
    }
    @if (problem()) {
      <mat-card class="border border-red-300 bg-red-50 p-5" role="alert"
        ><h2>{{ problem()!.title || 'Request failed' }}</h2>
        <p>{{ problem()!.detail || 'The backend is unavailable. Please retry.' }}</p>
        @for (issue of problemIssues(); track $index) {
          <p class="m-0">{{ issue }}</p>
        }
        @if (problem()!.traceId) {
          <p class="mt-3 text-sm">Support trace ID: {{ problem()!.traceId }}</p>
        }
        @if (problem()!.status === 409) {
          <button mat-stroked-button type="button" (click)="load()">Refresh current version</button>
        }
      </mat-card>
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewLearningPackImportPage {
  readonly #service = inject(ContentImportService);
  readonly importId = inject(ActivatedRoute).snapshot.paramMap.get('importId') ?? '';
  record = signal<LearningPackImportRecord | null>(null);
  loading = signal(false);
  busy = signal(false);
  jsonError = signal<string | null>(null);
  dirty = signal(false);
  problem = signal<ProblemDetails | null>(null);
  summary = signal<LearningPackImportSummary | null>(null);
  draftJson = '';
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.problem.set(null);
    this.#service.detail(this.importId).subscribe({
      next: (item) => {
        this.record.set(item);
        this.draftJson = JSON.stringify(item.draft ?? {}, null, 2);
        this.dirty.set(false);
        this.loading.set(false);
      },
      error: (error) => {
        this.problem.set(this.toProblem(error));
        this.loading.set(false);
      },
    });
  }
  checkJson() {
    this.dirty.set(true);
    try {
      JSON.parse(this.draftJson);
      this.jsonError.set(null);
    } catch (error) {
      this.jsonError.set(`Invalid JSON: ${(error as Error).message}`);
    }
  }
  save() {
    const draft = this.parseDraft();
    if (!draft) return;
    this.run(this.#service.save(this.importId, draft), (item) => {
      this.record.set(item);
      this.draftJson = JSON.stringify(item.draft ?? draft, null, 2);
      this.dirty.set(false);
    });
  }
  validate() {
    this.run(this.#service.validate(this.importId), (item) => {
      this.record.set(item);
      if (item.draft) this.draftJson = JSON.stringify(item.draft, null, 2);
    });
  }
  commit() {
    this.run(this.#service.commit(this.importId), (result) => this.summary.set(result));
  }
  canCommit() {
    const item = this.record();
    return item?.valid === true && item.status.toLowerCase() === 'validated';
  }
  parseDraft() {
    try {
      return JSON.parse(this.draftJson) as LearningPackImportRequest;
    } catch (error) {
      this.jsonError.set(`Invalid JSON: ${(error as Error).message}`);
      return null;
    }
  }
  run<T>(request: import('rxjs').Observable<T>, next: (result: T) => void) {
    this.busy.set(true);
    this.problem.set(null);
    request.subscribe({
      next: (result) => {
        next(result);
        this.busy.set(false);
      },
      error: (error) => {
        this.problem.set(this.toProblem(error));
        this.busy.set(false);
      },
    });
  }
  issueText(issue: string | { path?: string; message: string }) {
    return typeof issue === 'string' ? issue : `${issue.path ? `${issue.path}: ` : ''}${issue.message}`;
  }
  statusLabel(status: string) {
    return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  problemIssues() {
    const errors = this.problem()?.errors;
    if (!errors) return [];
    if (Array.isArray(errors)) return errors.map((entry) => this.issueText(entry));
    return Object.entries(errors).flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`));
  }
  toProblem(error: { status?: number; error?: ProblemDetails }): ProblemDetails {
    const body = error.error ?? {};
    return {
      ...body,
      status: error.status,
      title: error.status === 403 ? 'Access denied' : error.status === 409 ? 'Import changed' : body.title,
      detail:
        error.status === 403
          ? body.detail || 'You do not have permission to manage learning-pack imports.'
          : error.status === 409
            ? body.detail ||
              'This import changed or is no longer in the required workflow state. Refresh before trying again.'
            : body.detail,
    };
  }
}
