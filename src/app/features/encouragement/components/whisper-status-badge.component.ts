import { Component, input } from '@angular/core';
import { WhisperStatus } from '../models/whisper.models';
@Component({
  selector: 'b0-whisper-status-badge',
  standalone: true,
  template: `<span class="status" [attr.aria-label]="'Status: ' + status()">{{ status().replace('_', ' ') }}</span>`,
  styles: [
    `
      .status {
        display: inline-block;
        padding: 0.25rem 0.65rem;
        border: 1px solid var(--b0-border);
        border-radius: 999px;
        font-weight: 700;
        text-transform: capitalize;
      }
    `,
  ],
})
export class WhisperStatusBadgeComponent {
  readonly status = input.required<WhisperStatus>();
}
