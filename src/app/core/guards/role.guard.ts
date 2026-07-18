import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { UserRole } from '../models/roles';
export const roleGuard: CanActivateFn = (route) =>
  inject(AuthStore).hasRole((route.data['roles'] ?? []) as UserRole[])
    ? true
    : inject(Router).createUrlTree(['/unauthorized']);
