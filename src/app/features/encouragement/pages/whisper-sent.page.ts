import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DeliveryResultComponent } from '../components/delivery-result.component';
import { WhisperRecord } from '../models/whisper.models';
import { WhisperApiService } from '../services/whisper-api.service';
@Component({
  standalone: true,
  imports: [RouterLink, DeliveryResultComponent],
  template: `<section class="b0-card">
    <h1>Consent request delivery</h1>
    <p>Only channels reported by the backend are shown as successful.</p>
    @if (whisper()?.deliveryResults; as results) {
      <b0-delivery-result [results]="results" />
    }
    <a routerLink="/encouragement">Back to Encouragement Center</a>
  </section>`,
})
export class WhisperSentPage {
  readonly whisper = signal<WhisperRecord | null>(null);
  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('whisperId') ?? '';
    inject(WhisperApiService)
      .get(id)
      .subscribe((w) => this.whisper.set(w));
  }
}
