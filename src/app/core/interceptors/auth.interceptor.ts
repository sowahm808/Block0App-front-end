import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../auth/auth.store';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) {
  const store = inject(AuthStore);
  const auth = inject(AuthService);
  const router = inject(Router);

  const apiOrigin = new URL(
    environment.apiBaseUrl,
    window.location.origin,
  ).origin;

  const requestOrigin = new URL(
    req.url,
    window.location.origin,
  ).origin;

  const isBackendRequest = requestOrigin === apiOrigin;

  // Do not modify Firebase, Google, or other third-party requests.
  if (!isBackendRequest) {
    return next(req);
  }

  const accessToken = store.accessToken();

  let backendRequest = req.clone({
    setHeaders: {
      'X-Correlation-ID': crypto.randomUUID(),
      ...(accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
    },
    withCredentials: environment.apiWithCredentials,
  });

  return next(backendRequest).pipe(
    catchError((error: unknown) => {
      const shouldRefresh =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.headers.has('x-refresh-attempt');

      if (!shouldRefresh) {
        return throwError(() => error);
      }

      return auth.refreshToken().pipe(
        switchMap(() => {
          const refreshedToken = store.accessToken();

          if (!refreshedToken) {
            return throwError(
              () => new Error('Token refresh succeeded without a token.'),
            );
          }

          backendRequest = backendRequest.clone({
            headers: backendRequest.headers
              .set('x-refresh-attempt', '1')
              .set(
                'Authorization',
                `Bearer ${refreshedToken}`,
              ),
          });

          return next(backendRequest);
        }),
        catchError((refreshError: unknown) => {
          store.clear();

          void router.navigate(['/login'], {
            queryParams: {
              returnUrl: router.url,
            },
          });

          return throwError(() => refreshError);
        }),
      );
    }),
  );
}