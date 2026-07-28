import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { WhisperRecord } from '../models/whisper.models';
import { WhisperApiService } from '../services/whisper-api.service';
import { WhisperErrorMapperService } from '../services/whisper-error-mapper.service';
import { WhisperStatusBadgeComponent } from '../components/whisper-status-badge.component';
@Component({
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    PageHeaderComponent,
    ErrorStateComponent,
    LoadingSpinnerComponent,
    WhisperStatusBadgeComponent,
  ],
  template: `<b0-page-header title="Encouragement Center" description="Create and follow the encouragement you send." />
    <div class="flex justify-end"><a class="b0-button" routerLink="create">Create a whisper</a></div>
    @if (loading()) {
      <b0-loading-spinner label="Loading whispers" />
    } @else if (error()) {
      <b0-error-state title="We couldn't load your whispers" [message]="error()!" (retry)="load()" />
    } @else if (!items().length) {
      <section class="b0-card">
        <h2>No whispers yet</h2>
        <p>Your sent encouragement will appear here.</p>
      </section>
    } @else {
      <div class="grid gap-3">
        @for (item of items(); track item.id) {
          <a class="b0-card block" [routerLink]="[item.id]"
            ><div class="flex justify-between gap-2">
              <strong>{{ item.recipientDisplayName }}</strong
              ><b0-whisper-status-badge [status]="item.status" />
            </div>
            <p>{{ item.whisperType }} · Updated {{ item.updatedAt | date: 'medium' }}</p></a
          >
        }
      </div>
    }`,
})
export class EncouragementDashboardPage {
  readonly #api = inject(WhisperApiService);
  readonly #errors = inject(WhisperErrorMapperService);
  readonly items = signal<WhisperRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.#api
      .list({ pageSize: 20 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (r) => this.items.set(r.items), error: (e) => this.error.set(this.#errors.map(e).message) });
  }
}
