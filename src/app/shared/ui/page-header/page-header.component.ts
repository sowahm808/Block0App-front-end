import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'b0-page-header',
  standalone: true,
  template: `<header class="page-header" [attr.aria-labelledby]="titleId()">
    <div class="min-w-0">
      @if (eyebrow()) {
        <p class="eyebrow">{{ eyebrow() }}</p>
      }
      <h1 class="page-title" [id]="titleId()">{{ title() }}</h1>
      @if (description()) {
        <p class="page-description">{{ description() }}</p>
      }
    </div>
    <div class="page-actions"><ng-content /></div>
  </header>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  title = input.required<string>();
  description = input<string>('');
  eyebrow = input<string>('');
  titleId = input<string>('page-title');
}
