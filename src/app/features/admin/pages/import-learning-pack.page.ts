import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ContentImportService } from '../data-access/content-import.service';
import { LearningPackImportRecord, ProblemDetails } from '../../../core/api/api.types';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatCardModule],
  template: `<section class="grid gap-5" aria-labelledby="imports-title">
    <header>
      <p class="eyebrow">Administrator workflow</p>
      <h1 id="imports-title">Learning pack imports</h1>
      <p>Upload source documents, review extracted content, validate it, and commit it as draft content.</p>
    </header>
    <mat-card class="grid gap-4 p-5">
      <div>
        <h2 class="m-0">Upload a learning pack</h2>
        <p>Choose a non-empty PDF or Word document up to 20 MB.</p>
      </div>
      <input
        #picker
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        (change)="selectFile($event)"
      />
      <div>
        <button
          mat-flat-button
          color="primary"
          type="button"
          [disabled]="!selectedFile() || uploading()"
          (click)="upload()"
        >
          {{ uploading() ? 'Uploading…' : 'Upload and extract' }}
        </button>
      </div>
      @if (fileError()) {
        <p class="m-0 text-red-700" role="alert">{{ fileError() }}</p>
      }
      @if (problem()) {
        <div class="rounded border border-red-300 bg-red-50 p-3" role="alert">
          <b>{{ problem()!.title || 'Import request failed' }}</b>
          <p>{{ problem()!.detail || fallbackError }}</p>
          @if (problem()!.traceId) {
            <p class="m-0 text-sm">Support trace ID: {{ problem()!.traceId }}</p>
          }
        </div>
      }
    </mat-card>
    <div class="flex items-center justify-between">
      <h2 class="m-0">Import history</h2>
      <button mat-stroked-button type="button" (click)="load()">Refresh</button>
    </div>
    @if (loading()) {
      <mat-card class="p-5">Loading imports…</mat-card>
    }
    @for (item of imports(); track item.importId) {
      <mat-card class="grid gap-3 p-5"
        ><div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="m-0">{{ item.packTitle || 'Untitled learning pack' }}</h3>
            <p class="m-0">{{ item.sourceFileName }}</p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 font-bold">{{ statusLabel(item.status) }}</span>
        </div>
        <div class="grid gap-2 text-sm sm:grid-cols-3">
          <span
            >Uploaded by <b>{{ item.uploadedBy || 'Unknown' }}</b></span
          ><span>{{ item.uploadedAt ? (item.uploadedAt | date: 'medium') : 'Upload time unavailable' }}</span
          ><span>{{ validationCount(item) }} validation issue(s)</span>
        </div>
        <p class="m-0 text-sm">
          Writes: {{ item.created || 0 }} created · {{ item.updated || 0 }} updated · {{ item.skipped || 0 }} unchanged
          · {{ item.failed || 0 }} failed
        </p>
        <div>
          <a mat-stroked-button [routerLink]="['/admin/learning-packs/import', item.importId]">Review import</a>
        </div></mat-card
      >
    } @empty {
      @if (!loading()) {
        <mat-card class="p-5">No learning-pack imports yet.</mat-card>
      }
    }
    @if (nextCursor()) {
      <button mat-stroked-button type="button" (click)="load(nextCursor()!)">Load more</button>
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportLearningPackPage {
  readonly #service = inject(ContentImportService);
  readonly #router = inject(Router);
  imports = signal<LearningPackImportRecord[]>([]);
  nextCursor = signal<string | null>(null);
  loading = signal(false);
  uploading = signal(false);
  selectedFile = signal<File | null>(null);
  fileError = signal<string | null>(null);
  problem = signal<ProblemDetails | null>(null);
  fallbackError = 'The backend is unavailable. Please retry.';
  constructor() {
    this.load();
  }
  load(cursor?: string) {
    this.loading.set(true);
    this.problem.set(null);
    this.#service.list(cursor).subscribe({
      next: (result) => {
        const items = Array.isArray(result) ? result : result.items;
        this.imports.update((current) => (cursor ? [...current, ...items] : items));
        this.nextCursor.set(Array.isArray(result) ? null : (result.nextCursor ?? null));
        this.loading.set(false);
      },
      error: (error) => {
        this.problem.set(this.toProblem(error));
        this.loading.set(false);
      },
    });
  }
  selectFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.fileError.set(null);
    this.selectedFile.set(null);
    if (!file) return;
    const extension = file.name.toLowerCase();
    if (!extension.endsWith('.pdf') && !extension.endsWith('.docx')) {
      this.fileError.set('Choose a PDF or DOCX file.');
      return;
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      this.fileError.set('Choose a non-empty file up to 20 MB.');
      return;
    }
    this.selectedFile.set(file);
  }
  upload() {
    const file = this.selectedFile();
    if (!file) return;
    this.uploading.set(true);
    this.problem.set(null);
    this.#service.upload(file).subscribe({
      next: (result) => {
        this.uploading.set(false);
        void this.#router.navigate(['/admin/learning-packs/import', result.importId]);
      },
      error: (error) => {
        this.problem.set(this.toProblem(error));
        this.uploading.set(false);
      },
    });
  }
  validationCount(item: LearningPackImportRecord) {
    return item.validationCount ?? item.validationErrors?.length ?? 0;
  }
  statusLabel(status: string) {
    return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  toProblem(error: { status?: number; error?: ProblemDetails }): ProblemDetails {
    const body = error.error ?? {};
    return {
      ...body,
      status: error.status,
      title: error.status === 403 ? 'Access denied' : body.title,
      detail:
        error.status === 403 ? body.detail || 'You do not have permission to import learning packs.' : body.detail,
    };
  }
}
