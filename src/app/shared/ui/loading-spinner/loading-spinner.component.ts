import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'b0-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `<div class="state-card" role="status" aria-live="polite">
    <mat-progress-spinner mode="indeterminate" diameter="36" />
    <p>{{ label() }}</p>
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent {
  label = input('Loading…');
}
