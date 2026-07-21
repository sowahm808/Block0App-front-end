import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'b0-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `<section class="state-card">
    <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
    <h2>{{ title() }}</h2>
    <p>{{ message() }}</p>
    <ng-content />
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  icon = input('inbox');
  title = input('Nothing here yet');
  message = input('When data is available, it will appear here.');
}
