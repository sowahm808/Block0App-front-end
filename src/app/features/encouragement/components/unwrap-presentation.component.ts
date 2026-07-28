import { Component, input } from '@angular/core';
import { GeneratedContent } from '../models/whisper.models';
import { WhisperPreviewComponent } from './whisper-preview.component';
@Component({
  selector: 'b0-unwrap-presentation',
  standalone: true,
  imports: [WhisperPreviewComponent],
  template: `<div class="unwrap" [class.reduce-motion]="reducedMotion()">
    <b0-whisper-preview [content]="content()" />
  </div>`,
  styles: [
    `
      .unwrap {
        animation: reveal 0.35s ease-out;
      }
      .reduce-motion {
        animation: none;
      }
      @media (prefers-reduced-motion: reduce) {
        .unwrap {
          animation: none;
        }
      }
      @keyframes reveal {
        from {
          opacity: 0;
          transform: translateY(0.5rem);
        }
      }
    `,
  ],
})
export class UnwrapPresentationComponent {
  readonly content = input.required<GeneratedContent>();
  readonly reducedMotion = input(false);
}
