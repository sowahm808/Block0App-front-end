import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../../core/theme/theme.service';

@Component({
  selector: 'b0-theme-toggle',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `<button
    mat-icon-button
    type="button"
    [matTooltip]="label()"
    [attr.aria-label]="label()"
    (click)="theme.toggleTheme()"
  >
    <mat-icon aria-hidden="true">{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
  </button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
  label() {
    return this.theme.isDark() ? 'Switch to light theme' : 'Switch to dark theme';
  }
}
