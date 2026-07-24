import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RehearsalReason } from './rehearsal.models';

@Component({
  selector: 'b0-rehearsal-reason-badge',
  standalone: true,
  template: `<span class="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-800">{{ label() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RehearsalReasonBadgeComponent {
  reason = input<RehearsalReason>('weak_topic');

  label() {
    const labels: Record<string, string> = {
      previously_incorrect: 'Previously incorrect',
      marked_for_review: 'Marked for review',
      weak_topic: 'Weak topic',
      not_reviewed_recently: 'Not reviewed recently',
      memory_pearl_refresh: 'Memory-pearl refresh',
      assigned_by_administrator: 'Assigned by administrator',
    };
    return labels[this.reason()] ?? this.reason().replace(/[_-]/g, ' ');
  }
}
