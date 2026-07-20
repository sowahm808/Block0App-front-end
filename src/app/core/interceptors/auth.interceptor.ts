import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../auth/auth.store';
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const store = inject(AuthStore),
    auth = inject(AuthService),
    router = inject(Router);
  const apiOrigin = new URL(environment.apiBaseUrl, location.origin).origin;
  const same = new URL(req.url, location.origin).origin === apiOrigin;
  let cloned = req.clone({ setHeaders: { 'X-Correlation-ID': crypto.randomUUID() } });
  if (same && store.accessToken())
    cloned = cloned.clone({
      setHeaders: { Authorization: `Bearer ${store.accessToken()}` },
      withCredentials: environment.apiWithCredentials,
    });
  return next(cloned).pipe(
    catchError((e: unknown) => {
      if (e instanceof HttpErrorResponse && e.status === 401 && same && !req.headers.has('x-refresh-attempt')) {
        return auth.refreshToken().pipe(
          switchMap(() =>
            next(
              cloned.clone({
                headers: cloned.headers
                  .set('x-refresh-attempt', '1')
                  .set('Authorization', `Bearer ${store.accessToken()}`),
              }),
            ),
          ),
          catchError((err) => {
            store.clear();
            void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
            return throwError(() => err);
          }),
        );
      }
      return throwError(() => e);
    }),
  );
}
