import { Component, input } from '@angular/core';
import { DeliveryChannelResult } from '../models/whisper.models';
@Component({
  selector: 'b0-delivery-result',
  standalone: true,
  template: `<ul aria-label="Delivery results">
    @for (result of results(); track result.channel) {
      <li>
        <strong>{{ result.channel }}</strong
        >: {{ result.status }}
        @if (result.message) {
          — {{ result.message }}
        }
      </li>
    }
  </ul>`,
})
export class DeliveryResultComponent {
  readonly results = input.required<DeliveryChannelResult[]>();
}
