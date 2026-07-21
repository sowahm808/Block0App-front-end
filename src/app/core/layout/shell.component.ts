import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore } from '../auth/auth.store';
@Component({
  selector: 'b0-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule],
  template: `<a class="skip-link" href="#main">Skip to content</a>
    <div class="app-shell min-h-screen text-slate-950">
      <mat-toolbar class="glass-nav sticky top-0 z-50 border-b border-white/60 px-4 md:px-8">
        <a class="brand-lockup" routerLink="/dashboard" aria-label="Mind Unlocking Academy dashboard">
          <span class="brand-mark" aria-hidden="true">M</span>
          <span class="hidden text-left leading-tight sm:grid">
            <span class="text-sm font-black uppercase tracking-[0.22em] text-slate-900">Mind Unlocking</span>
            <span class="text-xs font-semibold text-indigo-700">Academy</span>
          </span>
        </a>
        <span class="flex-1"></span>
        <nav class="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          <a mat-button routerLink="/dashboard">Dashboard</a>
          <a mat-button routerLink="/challenge/today">Today</a>
          <a mat-button routerLink="/team">Team</a>
          <a mat-button routerLink="/admin">Admin</a>
        </nav>
        <a class="ml-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-900/20" routerLink="/challenge/today">
          Start focus
        </a>
      </mat-toolbar>

      <main id="main" class="relative mx-auto min-h-[calc(100vh-64px)] w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <div class="ambient-orb ambient-orb-indigo" aria-hidden="true"></div>
        <div class="ambient-orb ambient-orb-amber" aria-hidden="true"></div>
        <router-outlet />
      </main>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  store = inject(AuthStore);
}
