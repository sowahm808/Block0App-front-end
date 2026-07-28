import { Component, output } from '@angular/core';
@Component({
  selector: 'b0-consent-screen',
  standalone: true,
  template: `<section>
    <h2>Before you unwrap</h2>
    <p>This reveals a private message intended for you.</p>
    <button type="button" (click)="accepted.emit()">Accept and unwrap</button>
  </section>`,
})
export class ConsentScreenComponent {
  readonly accepted = output<void>();
}
