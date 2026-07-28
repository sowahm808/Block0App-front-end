import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PublicUnwrapResponse } from '../models/whisper.models';
import { WhisperApiService } from '../services/whisper-api.service';
import { WhisperPreviewComponent } from '../components/whisper-preview.component';
type ViewState =
  | 'loading'
  | 'consent_required'
  | 'accepted'
  | 'opening'
  | 'opened'
  | 'listened'
  | 'expired'
  | 'revoked'
  | 'not_found'
  | 'error';
@Component({
  standalone: true,
  imports: [MatButtonModule, WhisperPreviewComponent],
  host: { class: 'block mx-auto max-w-2xl p-4' },
  template: `<main>
    <h1>A private encouragement is waiting</h1>
    <div aria-live="polite">
      @if (state() === 'loading') {
        <p>Checking your private link…</p>
      } @else if (state() === 'consent_required') {
        <section class="b0-card">
          <h2>Before you unwrap</h2>
          <p>By continuing, you agree to reveal this private message. You can close this page instead.</p>
          <button mat-flat-button type="button" [disabled]="busy()" (click)="accept()">Accept and unwrap</button>
        </section>
      } @else if (state() === 'opened' || state() === 'listened') {
        @if (response()?.content; as content) {
          <b0-whisper-preview [content]="content" />
        }
        @if (response()?.audioPlaybackUrl; as audio) {
          <audio controls [src]="audio" (play)="recordListened()">Your browser does not support audio playback.</audio>
        }
      } @else if (state() === 'expired' || state() === 'revoked') {
        <p>This private link is no longer available.</p>
      } @else if (state() === 'not_found') {
        <p>This private link could not be found.</p>
      } @else if (state() === 'error') {
        <p>We could not open this message. Please try again later.</p>
      } @else {
        <p>Opening your encouragement…</p>
      }
    </div>
  </main>`,
})
export class UnwrapWhisperPage implements OnDestroy {
  readonly #api = inject(WhisperApiService);
  readonly #document = inject(DOCUMENT);
  readonly token = inject(ActivatedRoute).snapshot.paramMap.get('token') ?? '';
  readonly state = signal<ViewState>('loading');
  readonly response = signal<PublicUnwrapResponse | null>(null);
  readonly busy = signal(false);
  #listened = false;
  #robots = this.#document.createElement('meta');
  constructor() {
    this.#robots.name = 'robots';
    this.#robots.content = 'noindex,nofollow,noarchive';
    this.#document.head.appendChild(this.#robots);
    this.#api
      .unwrap(this.token)
      .subscribe({
        next: (r) => this.apply(r),
        error: (e) => this.state.set(e?.status === 410 ? 'expired' : e?.status === 404 ? 'not_found' : 'error'),
      });
  }
  accept() {
    if (this.busy()) return;
    this.busy.set(true);
    this.#api.accept(this.token).subscribe({
      next: (r) => {
        this.busy.set(false);
        this.response.set(r);
        this.state.set('opened');
      },
      error: (e) => {
        this.busy.set(false);
        this.state.set(e?.status === 410 ? 'expired' : 'error');
      },
    });
  }
  recordListened() {
    if (this.#listened) return;
    this.#listened = true;
    this.#api.listened(this.token).subscribe({ next: () => this.state.set('listened') });
  }
  apply(r: PublicUnwrapResponse) {
    this.response.set(r);
    this.state.set(r.state === 'accepted' ? 'opened' : r.state);
  }
  ngOnDestroy() {
    this.#robots.remove();
  }
}
