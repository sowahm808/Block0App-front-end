import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'b0-error-state',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `<section class="state-card error" role="alert">
    <mat-icon aria-hidden="true">error</mat-icon>
    <h2>{{ title() }}</h2>
    <p>{{ message() }}</p>
    <button mat-stroked-button type="button" (click)="retry.emit()">Try again</button>
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  title = input('Something went wrong');
  message = input('Please try again.');
  retry = output<void>();
}
