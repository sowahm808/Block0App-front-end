import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
export const authGuard: CanActivateFn = (_r, s) =>
  inject(AuthStore).isAuthenticated()
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: s.url } });
