import { BreakpointObserver } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, map, shareReplay } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../auth/auth.store';
import { DashboardService } from '../../features/dashboard/data-access/dashboard.service';
import { ThemeToggleComponent } from '../../shared/ui/theme-toggle/theme-toggle.component';
import {
  APP_NAVIGATION,
  APP_NAVIGATION_GROUPS,
  AppNavigationGroup,
  AppNavigationItem,
  canShowNavigationItem,
} from './navigation';

@Component({
  selector: 'b0-shell',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatTooltipModule,
    ThemeToggleComponent,
  ],
  template: `<a class="skip-link" href="#main">Skip to content</a>
    <mat-sidenav-container class="min-h-screen bg-transparent">
      <mat-sidenav
        #drawer
        class="app-sidenav"
        [class.collapsed]="collapsed() && !(isHandset$ | async)"
        [mode]="(isHandset$ | async) ? 'over' : 'side'"
        [opened]="(isHandset$ | async) ? false : true"
        fixedInViewport
      >
        <div class="flex h-full flex-col gap-4 p-3">
          <a class="brand-lockup px-2 py-1" [routerLink]="homeRoute()" aria-label="Mind Unlocking Academy dashboard">
            <span class="brand-mark" aria-hidden="true">M</span>
            @if (!collapsed() || (isHandset$ | async)) {
              <span class="grid leading-tight"
                ><span class="text-sm font-black uppercase tracking-[0.2em]">Mind Unlocking</span
                ><span class="text-xs font-semibold text-[var(--b0-primary)]">Academy</span></span
              >
            }
          </a>
          <nav class="grid gap-1" aria-label="Primary navigation">
            @for (group of visibleGroups(); track group.label) {
              <section class="nav-group" [attr.aria-label]="group.label">
                @if (!collapsed() || (isHandset$ | async)) {
                  <p class="nav-group-label">{{ group.label }}</p>
                }
                @for (item of group.items; track item.route) {
                  <a
                    mat-button
                    class="nav-link"
                    [routerLink]="item.route"
                    routerLinkActive="active-nav"
                    [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                    [matTooltip]="collapsed() && !(isHandset$ | async) ? item.label : ''"
                    (click)="closeHandset(drawer)"
                  >
                    <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon>
                    @if (!collapsed() || (isHandset$ | async)) {
                      <span>{{ item.label }}</span>
                    }
                  </a>
                }
              </section>
            }
          </nav>
          <span class="flex-1"></span>
          <button
            mat-button
            class="nav-link hidden lg:inline-flex"
            type="button"
            (click)="toggleCollapsed()"
            [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          >
            <mat-icon aria-hidden="true">{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
            @if (!collapsed()) {
              <span>Collapse</span>
            }
          </button>
        </div>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar class="app-topbar px-3 sm:px-5">
          <button
            mat-icon-button
            type="button"
            class="lg:hidden"
            (click)="drawer.toggle()"
            aria-label="Open navigation"
          >
            <mat-icon>menu</mat-icon>
          </button>
          <div class="min-w-0 px-2">
            <p class="m-0 truncate text-xs font-bold uppercase tracking-[0.18em] text-[var(--b0-text-muted)]">
              {{ currentChallengeName() }}
            </p>
            <p class="m-0 truncate text-sm font-black">{{ currentSection() }} · {{ currentDay() }}</p>
          </div>
          <span class="flex-1"></span>
          @if (store.hasPermission(['scholar:access'])) {
            <a mat-button routerLink="/challenge/today" class="hidden sm:inline-flex"
              ><mat-icon aria-hidden="true">play_arrow</mat-icon>Start focus</a
            >
          }
          <a mat-icon-button routerLink="/notifications" aria-label="Open notifications"
            ><mat-icon>notifications</mat-icon></a
          >
          <b0-theme-toggle />
          <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="Open user menu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <a mat-menu-item routerLink="/profile"><mat-icon>person</mat-icon><span>My Profile</span></a>
            <a mat-menu-item routerLink="/notification-preferences"
              ><mat-icon>tune</mat-icon><span>Notification Preferences</span></a
            >
            <a mat-menu-item routerLink="/settings"
              ><mat-icon>accessibility_new</mat-icon><span>Accessibility Settings</span></a
            >
            <a mat-menu-item routerLink="/dashboard"><mat-icon>sync_alt</mat-icon><span>Switch Workspace</span></a>
            <button mat-menu-item type="button" (click)="logout()">
              <mat-icon>logout</mat-icon><span>Sign out</span>
            </button>
          </mat-menu>
        </mat-toolbar>
        <main id="main" class="shell-main mx-auto w-full max-w-[var(--b0-container)] pb-20 lg:pb-0">
          <router-outlet />
        </main>
        <nav
          class="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-[var(--b0-border)] bg-[var(--b0-surface)] px-1 py-2 shadow-2xl lg:hidden"
          aria-label="Mobile navigation"
        >
          @for (item of mobileNavigation(); track item.route) {
            <a
              class="grid place-items-center gap-1 rounded-xl px-1 py-1 text-[0.68rem] font-bold text-[var(--b0-text-muted)]"
              [routerLink]="item.route"
              routerLinkActive="text-[var(--b0-primary)]"
            >
              <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </mat-sidenav-content>
    </mat-sidenav-container>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  readonly store = inject(AuthStore);
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);
  readonly #dashboard = inject(DashboardService);
  readonly #destroyRef = inject(DestroyRef);
  readonly isHandset$ = inject(BreakpointObserver)
    .observe('(max-width: 1023px)')
    .pipe(
      map((r) => r.matches),
      shareReplay(1),
    );
  readonly collapsed = signal(false);
  readonly visibleGroups = computed(() =>
    APP_NAVIGATION_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => this.canShow(item)),
    })).filter((group) => group.items.length > 0 && this.canShow(group)),
  );
  readonly homeRoute = computed(() => this.visibleGroups()[0]?.items[0]?.route ?? '/profile');
  readonly currentSection = signal('Dashboard');
  readonly currentChallengeName = signal('Current challenge');
  readonly currentDay = signal('Day');
  readonly mobileNavigation = computed(() =>
    [
      { route: '/dashboard', label: 'Home', icon: 'home' },
      { route: '/challenge/today', label: 'Study', icon: 'school' },
      { route: '/team', label: 'Team', icon: 'groups' },
      { route: '/readiness', label: 'Readiness', icon: 'monitoring' },
      { route: '/profile', label: 'Profile', icon: 'person' },
    ].filter((item) => this.canShow({ ...item, permissions: ['scholar:access'] })),
  );
  constructor() {
    if (this.store.hasPermission(['scholar:access'])) {
      this.#dashboard
        .getDashboard()
        .pipe(takeUntilDestroyed(this.#destroyRef))
        .subscribe({
          next: (dashboard) => {
            this.currentChallengeName.set(dashboard.currentChallenge || 'Current challenge');
            this.currentDay.set(dashboard.currentDay ? `Day ${dashboard.currentDay}` : 'Day');
          },
          error: () => {
            this.currentChallengeName.set('Current challenge');
            this.currentDay.set('Day');
          },
        });
    }

    this.#router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((e) => {
        const item = APP_NAVIGATION.find((n) => e.urlAfterRedirects.startsWith(n.route));
        this.currentSection.set(item?.label ?? 'Workspace');
      });
  }
  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }
  canShow(item: AppNavigationItem | AppNavigationGroup): boolean {
    return canShowNavigationItem(this.store, item);
  }
  closeHandset(drawer: { close: () => unknown }): void {
    this.isHandset$
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((is) => {
        if (is) drawer.close();
      })
      .unsubscribe();
  }
  logout(): void {
    this.#auth.logout().subscribe({
      complete: () => void this.#router.navigateByUrl('/login'),
      error: () => void this.#router.navigateByUrl('/login'),
    });
  }
}
