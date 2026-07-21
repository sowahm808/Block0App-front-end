import { inject, Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { ApiService } from '../api/api.service';
import {
  CurrentUserResponse,
  LoginCredentials,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  TokenResponse,
} from '../api/api.types';
import { AuthStore } from './auth.store';
import { FirebaseAuthService } from './firebase-auth.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  #api = inject(ApiService);
  #firebase = inject(FirebaseAuthService);
  #store = inject(AuthStore);
  #refresh$?: Observable<TokenResponse>;

  login(req: LoginCredentials) {
    return this.#firebase.signInWithPassword(req.email, req.password).pipe(
      switchMap((firebaseIdToken) => {
        const loginRequest: LoginRequest = {
          email: req.email,
          password: req.password,
          mfaCode: req.mfaCode,
          firebaseIdToken,
        };

        return this.#api.post<TokenResponse>('/auth/login', loginRequest);
      }),
      switchMap((r) => this.#setBackendTokens(r)),
    );
  }

  register(req: RegisterRequest) {
    return this.#api.post<RegisterResponse>('/auth/register', req);
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
    return this.#api.get<CurrentUserResponse>('/auth/me').pipe(tap((user) => this.#store.setUser(user)));
  }

  refreshToken() {
    if (!this.#refresh$) {
      this.#refresh$ = this.#firebase.refreshIdToken().pipe(
        switchMap((firebaseIdToken) => this.#api.post<TokenResponse>('/auth/refresh', { firebaseIdToken })),
        switchMap((r) => this.#setBackendTokens(r)),
        shareReplay(1),
        finalize(() => (this.#refresh$ = undefined)),
      );
    }
    return this.#refresh$;
  }

  #setBackendTokens(response: TokenResponse) {
    return this.#firebase.normalizeBackendToken(response.accessToken).pipe(
      catchError(() => of(response.accessToken)),
      tap((idToken) => this.#store.setAccessToken(idToken)),
      switchMap(() => this.loadProfile()),
      map(() => response),
    );
  }
}
