import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { WhisperPreviewComponent } from '../components/whisper-preview.component';
import { AudioUploadComponent } from '../components/audio-upload.component';
import { WhisperRecord } from '../models/whisper.models';
import { WhisperApiService } from '../services/whisper-api.service';
import { WhisperDraftStore } from '../stores/whisper-draft.store';
@Component({
  standalone: true,
  imports: [MatButtonModule, PageHeaderComponent, WhisperPreviewComponent, AudioUploadComponent],
  template: `<b0-page-header
      title="Review whisper"
      description="Review the canonical message before confirming and sending."
    />
    @if (loading()) {
      <p role="status">Loading…</p>
    } @else if (error()) {
      <p role="alert">{{ error() }}</p>
    } @else if (whisper(); as w) {
      <section class="b0-card grid gap-4">
        <b0-whisper-preview [content]="w.content!" />
        @if (w.deliveryFormat !== 'text') {
          <b0-audio-upload [whisperId]="w.id" (completed)="audioReady.set(true)" />
        }
        <div class="flex flex-wrap gap-2">
          <button mat-button type="button" [disabled]="busy() || !editable(w)" (click)="regenerate()">Regenerate</button
          ><button mat-flat-button type="button" [disabled]="busy() || !editable(w)" (click)="confirm()">
            Confirm content</button
          ><button
            mat-flat-button
            type="button"
            [disabled]="busy() || !w.confirmedAt || (w.deliveryFormat !== 'text' && !audioReady())"
            (click)="send()"
          >
            Send consent request
          </button>
        </div>
      </section>
    }`,
})
export class ReviewWhisperPage {
  readonly #api = inject(WhisperApiService);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #draft = inject(WhisperDraftStore);
  readonly id = this.#route.snapshot.paramMap.get('whisperId') ?? '';
  readonly whisper = signal<WhisperRecord | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly audioReady = signal(false);
  readonly error = signal('');
  constructor() {
    this.load();
  }
  editable(w: WhisperRecord) {
    return ['draft', 'generated'].includes(w.status);
  }
  load() {
    this.#api
      .get(this.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (w) => {
          this.whisper.set(w);
          this.audioReady.set(!!w.audioReady);
        },
        error: () => this.error.set('This whisper is unavailable or you do not own it.'),
      });
  }
  regenerate() {
    if (this.busy() || !confirm('Regeneration replaces your current edits. Continue?')) return;
    this.action(this.#api.regenerate(this.id));
  }
  confirm() {
    this.action(this.#api.confirm(this.id));
  }
  send() {
    if (this.busy() || !confirm('Send this private consent request now?')) return;
    this.busy.set(true);
    this.#api
      .sendConsent(this.id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.#draft.clear();
          void this.#router.navigate(['/encouragement/sent', this.id]);
        },
        error: () => this.error.set('Consent could not be sent. No delivery is being claimed; please retry.'),
      });
  }
  action(request: ReturnType<WhisperApiService['confirm']>) {
    this.busy.set(true);
    request
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (w) => this.whisper.set(w),
        error: () => this.error.set('The whisper state changed. Refresh and try again.'),
      });
  }
}
