import { Component, input } from '@angular/core';
@Component({
  selector: 'b0-whisper-composer',
  standalone: true,
  template: `<section aria-label="Whisper composer">
    <ng-content />
    @if (busy()) {
      <p role="status">Generating…</p>
    }
  </section>`,
})
export class WhisperComposerComponent {
  readonly busy = input(false);
}
