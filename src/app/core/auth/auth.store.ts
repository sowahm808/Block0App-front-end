import { computed, Injectable, signal } from '@angular/core';
import { CurrentUser, Permission, UserRole } from '../models/roles';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly accessToken = signal<string | null>(null);
  readonly refreshToken = signal<string | null>(null);
  readonly user = signal<CurrentUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.accessToken() && !!this.user());

  setSession(token: string, user: CurrentUser, refreshToken?: string) {
    this.setAccessToken(token);
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
    this.setUser(user);
  }

  setAccessToken(token: string) {
    this.accessToken.set(token);
  }

  setRefreshToken(token: string) {
    this.refreshToken.set(token);
  }

  setUser(user: CurrentUser) {
    this.user.set(user);
  }

  clear() {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.user.set(null);
  }

  hasRole(roles: UserRole[]) {
    const u = this.user();
    const userRoles = u?.roles ?? [];
    return !!u && roles.some((r) => userRoles.includes(r) || userRoles.includes('SuperAdministrator'));
  }

  hasPermission(perms: Permission[]) {
    const u = this.user();
    const userRoles = u?.roles ?? [];
    return !!u && perms.every((p) => u.permissions.includes(p) || userRoles.includes('SuperAdministrator'));
  }
}
