import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore } from '../auth/auth.store';
@Component({
  selector: 'b0-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule],
  template: `<a class="skip-link" href="#main">Skip to content</a
    ><mat-toolbar color="primary"
      ><span>Mind Unlocking Academy</span><span class="flex-1"></span><a mat-button routerLink="/dashboard">Dashboard</a
      ><a mat-button routerLink="/challenge/today">Today</a><a mat-button routerLink="/team">Team</a
      ><a mat-button routerLink="/admin">Admin</a></mat-toolbar
    >
    <main id="main" class="min-h-screen bg-slate-50 p-4 md:p-8"><router-outlet /></main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  store = inject(AuthStore);
}
