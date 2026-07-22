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
    const userPermissions = u?.permissions ?? [];
    return (
      !!u &&
      roles.some(
        (r) =>
          userRoles.includes(r) ||
          userRoles.includes('SuperAdministrator') ||
          userPermissions.includes(this.#roleAccessPermission(r)),
      )
    );
  }

  #roleAccessPermission(role: UserRole): Permission {
    return `${role.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}:access`;
  }

  hasPermission(perms: Permission[]) {
    const u = this.user();
    if (!u) return false;

    const userRoles = u.roles ?? [];
    const grantedPermissions = new Set(u.permissions);
    for (const role of userRoles) {
      for (const permission of this.#permissionsForRole(role)) {
        grantedPermissions.add(permission);
      }
    }

    return perms.every((p) => grantedPermissions.has('*') || grantedPermissions.has(p));
  }

  #permissionsForRole(role: UserRole): Permission[] {
    switch (role) {
      case 'SuperAdministrator':
      case 'Administrator':
        return ['*'];
      case 'ContentReviewer':
        return ['content.read', 'content.review', 'content-review:access'];
      case 'Mentor':
        return ['mentor.teams.read', 'mentor.support.read', 'mentor.progress.read', 'mentor:access'];
      case 'Scholar':
        return ['scholar:access'];
    }
  }
}

