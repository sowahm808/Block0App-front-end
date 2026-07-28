import { Component, input, output } from '@angular/core';
import { InternalRecipientSummary } from '../models/whisper.models';
@Component({
  selector: 'b0-recipient-selector',
  standalone: true,
  template: `<fieldset>
    <legend>MUA recipient</legend>
    <select aria-label="Select recipient" (change)="select.emit($any($event.target).value)">
      <option value="">Choose a recipient</option>
      @for (recipient of recipients(); track recipient.userId) {
        <option [value]="recipient.userId">{{ recipient.displayName }}</option>
      }
    </select>
  </fieldset>`,
})
export class RecipientSelectorComponent {
  readonly recipients = input.required<InternalRecipientSummary[]>();
  readonly select = output<string>();
}
