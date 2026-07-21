import { ChangeDetectionStrategy, Component, input } from '@angular/core';
export type StatusTone = 'neutral' | 'success' | 'warning' | 'error' | 'info';
@Component({
  selector: 'b0-status-badge',
  standalone: true,
  template: `<span class="status-badge" [attr.data-tone]="tone()"
    ><span class="status-dot" aria-hidden="true"></span>{{ label() }}</span
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  label = input.required<string>();
  tone = input<StatusTone>('neutral');
}
