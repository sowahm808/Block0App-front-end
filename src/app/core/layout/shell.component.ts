import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthStore } from '../auth/auth.store';

@Component({
  selector: 'b0-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  template: `<a class="skip-link" href="#main">Skip to content</a>
    <div class="app-shell min-h-screen text-slate-950">
      <mat-toolbar class="glass-nav sticky top-0 z-50 border-b border-white/60 px-3 sm:px-4 md:px-8">
        <a class="brand-lockup min-w-0" routerLink="/dashboard" aria-label="Mind Unlocking Academy dashboard">
          <span class="brand-mark shrink-0" aria-hidden="true">M</span>
          <span class="hidden min-w-0 text-left leading-tight sm:grid">
            <span class="truncate text-sm font-black uppercase tracking-[0.22em] text-slate-900">Mind Unlocking</span>
            <span class="text-xs font-semibold text-indigo-700">Academy</span>
          </span>
        </a>
        <span class="flex-1"></span>
        <nav class="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          @for (item of navItems; track item.href) {
            <a mat-button [routerLink]="item.href" routerLinkActive="active-nav">{{ item.label }}</a>
          }
        </nav>
        <a
          class="ml-2 hidden rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-900/20 sm:inline-flex"
          routerLink="/challenge/today"
        >
          Start focus
        </a>
        <button
          class="ml-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-black lg:hidden"
          type="button"
          (click)="toggleMobileNav()"
          [attr.aria-expanded]="mobileOpen()"
          aria-controls="mobile-nav"
        >
          Menu
        </button>
      </mat-toolbar>

      @if (mobileOpen()) {
        <nav id="mobile-nav" class="mobile-nav lg:hidden" aria-label="Mobile navigation">
          @for (item of navItems; track item.href) {
            <a [routerLink]="item.href" routerLinkActive="active-nav" (click)="mobileOpen.set(false)">{{
              item.label
            }}</a>
          }
          <a class="mobile-nav-cta" routerLink="/challenge/today" (click)="mobileOpen.set(false)">Start focus</a>
        </nav>
      }

      <main
        id="main"
        class="relative mx-auto min-h-[calc(100vh-64px)] w-full max-w-7xl px-3 py-5 sm:px-4 md:px-8 md:py-10"
      >
        <div class="ambient-orb ambient-orb-indigo" aria-hidden="true"></div>
        <div class="ambient-orb ambient-orb-amber" aria-hidden="true"></div>
        <router-outlet />
      </main>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  store = inject(AuthStore);
  mobileOpen = signal(false);
  toggleMobileNav() {
    this.mobileOpen.update((open) => !open);
  }

  navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/challenge/today', label: 'Today' },
    { href: '/learning-packs', label: 'Packs' },
    { href: '/scenarios', label: 'Scenarios' },
    { href: '/team', label: 'Team' },
    { href: '/readiness', label: 'Readiness' },
    { href: '/notifications', label: 'Updates' },
    { href: '/profile', label: 'Profile' },
    { href: '/admin', label: 'Admin' },
  ];
}
