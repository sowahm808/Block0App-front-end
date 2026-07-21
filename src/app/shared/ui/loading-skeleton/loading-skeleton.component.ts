import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'b0-loading-skeleton',
  standalone: true,
  template: `<div class="skeleton-stack" role="status" aria-live="polite" [attr.aria-label]="label()">
    @for (row of rowsArray(); track $index) {
      <span class="skeleton-line"></span>
    }
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSkeletonComponent {
  rows = input(3);
  label = input('Loading content');
  rowsArray() {
    return Array.from({ length: this.rows() });
  }
}
