import { inject, Injectable } from '@angular/core';
import { catchError, finalize, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AuthResponse, BackendRegisterRequest, LoginCredentials, LoginRequest, RegisterRequest } from '../api/api.types';
import { AuthStore } from './auth.store';
import { FirebaseAuthService } from './firebase-auth.service';
@Injectable({ providedIn: 'root' })
export class AuthService {
  #api = inject(ApiService);
  #firebase = inject(FirebaseAuthService);
  #store = inject(AuthStore);
  #refresh$?: Observable<AuthResponse>;
  login(req: LoginCredentials) {
    return this.#firebase.signInWithPassword(req.email, req.password).pipe(
      switchMap((firebaseIdToken) => {
        const loginRequest: LoginRequest = {
          email: req.email,
          firebaseIdToken,
        };

        return this.#api.post<AuthResponse>('/auth/login', loginRequest);
      }),
      switchMap((r) => this.#setBackendSession(r)),
    );
  }
  register(req: RegisterRequest) {
    return this.#firebase.signUpWithPassword(req.email, req.password).pipe(
      switchMap((firebaseIdToken) => {
        const backendRequest: BackendRegisterRequest = {
          displayName: req.displayName,
          email: req.email,
          firebaseIdToken,
        };

        return this.#api.post<AuthResponse>('/auth/register', backendRequest);
      }),
      switchMap((r) => this.#setBackendSession(r)),
    );
  }
  logout() {
    this.#store.clear();
    this.#firebase.clear();
    return this.#api.post<void>('/auth/logout', {});
  }
  forgotPassword(email: string) {
    return this.#api.post<void>('/auth/forgot-password', { email });
  }
  resetPassword(token: string, password: string) {
    return this.#api.post<void>('/auth/reset-password', { token, password });
  }
  verifyEmail(token: string) {
    return this.#api.post<void>('/auth/verify-email', { token });
  }
  loadProfile() {
    return this.#api.get<AuthResponse>('/auth/me').pipe(switchMap((r) => this.#setBackendSession(r)));
  }
  refreshToken() {
    if (!this.#refresh$) {
      this.#refresh$ = this.#firebase.refreshIdToken().pipe(
        switchMap((firebaseIdToken) => this.#api.post<AuthResponse>('/auth/refresh', { firebaseIdToken })),
        switchMap((r) => this.#setBackendSession(r)),
        shareReplay(1),
        finalize(() => (this.#refresh$ = undefined)),
      );
    }
    return this.#refresh$;
  }

  #setBackendSession(response: AuthResponse) {
    return this.#firebase.normalizeBackendToken(response.accessToken).pipe(
      catchError(() => of(response.accessToken)),
      tap((idToken) => this.#store.setSession(idToken, response.user)),
      switchMap(() => of(response)),
    );
  }
}
