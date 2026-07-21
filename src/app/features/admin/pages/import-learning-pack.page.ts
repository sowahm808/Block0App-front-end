import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ContentImportService } from '../data-access/content-import.service';
import { LearningPackImportRequest, LearningPackImportSummary } from '../../../core/api/api.types';

const STARTER_JSON = `{
  "sourceFileName": "bp-day-01-foundations.json",
  "learningPack": { "externalId": "bp-day-01-foundations", "title": "Block Zero Day 1 Foundations", "description": "Core concepts and baseline diagnostic practice.", "challengeId": "block-zero-21-day", "dayNumber": 1, "audience": "Scholar", "status": "draft" },
  "capsules": [{ "externalId": "bp-day-01-capsule-01", "title": "High-yield diagnostic reasoning", "summary": "Practice identifying the key finding before choosing an answer.", "sequence": 1, "estimatedMinutes": 12, "status": "draft", "questions": [{ "externalId": "bp-day-01-q001", "sequence": 1, "stem": "Question stem shown before submission.", "choices": [{ "id": "A", "label": "A", "text": "Choice A" }, { "id": "B", "label": "B", "text": "Choice B" }], "explanation": { "correctChoiceId": "A", "correctRationale": "Why A is correct.", "incorrectRationales": { "B": "Why B is incorrect." }, "reference": "Internal content reference or citation.", "memory": { "highYieldFact": "One memorable fact.", "pearl": "Clinical pearl.", "clinicalRelevance": "Why this matters.", "examTrap": "Common trap.", "mnemonic": "Optional mnemonic." } } }] }]
}`;

@Component({
  standalone: true,
  imports: [FormsModule, JsonPipe, MatButtonModule, MatCardModule],
  template: `<section class="grid gap-5"><h1>Import learning pack</h1><mat-card class="grid gap-4 p-5"><p>Paste the backend learning-pack JSON schema or upload a JSON file.</p><input type="file" accept="application/json,.json" (change)="readFile($event)" /><textarea class="min-h-96 rounded border p-3 font-mono" [(ngModel)]="jsonText" (ngModelChange)="validate()"></textarea><div class="flex gap-2"><button mat-stroked-button type="button" (click)="copyStarterJson()">Copy starter JSON</button><button mat-flat-button color="primary" type="button" [disabled]="!!parseError() || submitting()" (click)="submit()">{{ submitting() ? 'Importing…' : 'Import learning pack' }}</button></div>@if (parseError()) { <p class="text-red-700">{{ parseError() }}</p> }</mat-card>
  @if (preview(); as p) { <mat-card class="p-5"><h2>Preview</h2><p><strong>{{ p.title }}</strong> · {{ p.externalId }}</p><p>{{ p.capsuleCount }} capsules · {{ p.questionCount }} questions</p></mat-card> }
  @if (summary(); as s) { <mat-card class="p-5"><h2>Import summary</h2><p>Created {{ s.created }} · Updated {{ s.updated }} · Skipped {{ s.skipped }} · Failed {{ s.failed }}</p>@if (s.importedBy || s.importedAt || s.sourceFileName) { <p>Imported by {{ s.importedBy || 'unknown' }} at {{ s.importedAt || 'unknown time' }} from {{ s.sourceFileName || 'pasted JSON' }}</p> }@if (s.contentIds) { <pre>{{ s.contentIds | json }}</pre> }@if (s.validationErrors?.length) { <h3>Validation errors</h3><ul>@for (e of s.validationErrors; track $index) { <li>{{ validationErrorText(e) }}</li> }</ul> }</mat-card> }
  @if (serverError()) { <mat-card class="p-5"><h2>Import failed</h2><p>{{ serverError() }}</p></mat-card> }</section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportLearningPackPage {
  #service = inject(ContentImportService);
  jsonText = STARTER_JSON;
  parseError = signal<string | null>(null); summary = signal<LearningPackImportSummary | null>(null); serverError = signal<string | null>(null); submitting = signal(false);
  preview = computed(() => { const parsed = this.safeParse(); return parsed ? { title: parsed.learningPack.title, externalId: parsed.learningPack.externalId, capsuleCount: parsed.capsules?.length ?? 0, questionCount: parsed.capsules?.reduce((n, c) => n + (c.questions?.length ?? 0), 0) ?? 0 } : null; });
  validate() { this.parse(); }
  safeParse(): LearningPackImportRequest | null { try { return JSON.parse(this.jsonText) as LearningPackImportRequest; } catch { return null; } }
  parse(): LearningPackImportRequest | null { try { const parsed = JSON.parse(this.jsonText) as LearningPackImportRequest; this.parseError.set(null); return parsed; } catch (e) { this.parseError.set(`Invalid JSON: ${(e as Error).message}`); return null; } }
  copyStarterJson() { void navigator.clipboard?.writeText(STARTER_JSON); this.jsonText = STARTER_JSON; this.validate(); }
  readFile(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; file.text().then((text) => { this.jsonText = text; this.validate(); }); }
  submit() { const body = this.parse(); if (!body) return; this.submitting.set(true); this.serverError.set(null); this.#service.importLearningPack(body).subscribe({ next: (s) => { this.summary.set(s); this.submitting.set(false); }, error: (e) => { this.submitting.set(false); this.serverError.set(e.status === 403 ? 'You do not have permission to import content.' : e.status === 400 ? 'The backend rejected this import. Review validation errors and retry.' : 'Backend unavailable. Please retry.'); } }); }
  validationErrorText(e: string | { path?: string; message: string }) { return typeof e === 'string' ? e : `${e.path ? `${e.path}: ` : ''}${e.message}`; }
}
