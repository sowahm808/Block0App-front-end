import { Component, input } from '@angular/core';
import { GeneratedContent } from '../models/whisper.models';
@Component({
  selector: 'b0-whisper-preview',
  standalone: true,
  template: `<article class="grid gap-3" aria-label="Whisper preview">
    <h2>{{ content().title }}</h2>
    <p class="whitespace-pre-wrap">{{ content().message }}</p>
    <blockquote>
      {{ content().scriptureText }} <cite>{{ content().scriptureReference }}</cite>
    </blockquote>
    <h3>Prayer</h3>
    <p>{{ content().shortPrayer }}</p>
  </article>`,
})
export class WhisperPreviewComponent {
  readonly content = input.required<GeneratedContent>();
}
