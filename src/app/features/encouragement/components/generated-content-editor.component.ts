import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeneratedContent } from '../models/whisper.models';
@Component({
  selector: 'b0-generated-content-editor',
  standalone: true,
  imports: [FormsModule],
  template: `<label>Title<input [ngModel]="content().title" (ngModelChange)="change('title', $event)" /></label
    ><label
      >Message<textarea [ngModel]="content().message" (ngModelChange)="change('message', $event)"></textarea>
    </label>`,
})
export class GeneratedContentEditorComponent {
  readonly content = input.required<GeneratedContent>();
  readonly contentChange = output<GeneratedContent>();
  change(key: 'title' | 'message', value: string) {
    this.contentChange.emit({ ...this.content(), [key]: value });
  }
}
