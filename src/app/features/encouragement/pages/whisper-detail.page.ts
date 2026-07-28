import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { WhisperPreviewComponent } from '../components/whisper-preview.component';
import { DeliveryResultComponent } from '../components/delivery-result.component';
import { WhisperRecord } from '../models/whisper.models';
import { WhisperApiService } from '../services/whisper-api.service';
@Component({
  standalone: true,
  imports: [PageHeaderComponent, WhisperPreviewComponent, DeliveryResultComponent],
  template: `<b0-page-header title="Whisper details" />
    @if (error()) {
      <p role="alert">{{ error() }}</p>
    } @else if (whisper(); as w) {
      <section class="b0-card">
        <p><strong>Recipient:</strong> {{ w.recipientDisplayName }}</p>
        <p><strong>Status:</strong> {{ w.status }}</p>
        @if (w.content) {
          <b0-whisper-preview [content]="w.content" />
        }
        @if (w.deliveryResults) {
          <b0-delivery-result [results]="w.deliveryResults" />
        }
      </section>
    }`,
})
export class WhisperDetailPage {
  readonly whisper = signal<WhisperRecord | null>(null);
  readonly error = signal('');
  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('whisperId') ?? '';
    inject(WhisperApiService)
      .get(id)
      .subscribe({
        next: (w) => this.whisper.set(w),
        error: () => this.error.set('This whisper is unavailable or you do not own it.'),
      });
  }
}
