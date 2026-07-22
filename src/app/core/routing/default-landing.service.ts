import { Injectable, inject } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { AppNavigationItem, APP_NAVIGATION_GROUPS, canShowNavigationItem } from '../layout/navigation';

@Injectable({ providedIn: 'root' })
export class DefaultLandingService {
  readonly #store = inject(AuthStore);

  defaultRoute(): string {
    const preferred: AppNavigationItem[] = [
      { route: '/admin', label: 'Admin dashboard', icon: 'admin_panel_settings', roles: ['SuperAdministrator'] },
      { route: '/admin', label: 'Admin dashboard', icon: 'admin_panel_settings', roles: ['Administrator'] },
      { route: '/review', label: 'Review dashboard', icon: 'rate_review', roles: ['ContentReviewer'], permissions: ['content.read'] },
      { route: '/mentor', label: 'Mentor dashboard', icon: 'school', roles: ['Mentor'], permissions: ['mentor.teams.read'] },
      { route: '/dashboard', label: 'Dashboard', icon: 'space_dashboard', roles: ['Scholar'], permissions: ['scholar:access'] },
    ];

    return (
      preferred.find((item) => canShowNavigationItem(this.#store, item))?.route ??
      APP_NAVIGATION_GROUPS.flatMap((group) => group.items).find((item) => canShowNavigationItem(this.#store, item))?.route ??
      '/profile'
    );
  }
}
