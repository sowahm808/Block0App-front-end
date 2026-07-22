import { inject, Injectable } from '@angular/core';
import { finalize, map, Observable, shareReplay, switchMap, tap, throwError } from 'rxjs';
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
    const email = req.email.trim();

    return this.#firebase.signInWithPassword(email, req.password).pipe(
      switchMap((firebaseIdToken) => {
        const loginRequest: LoginRequest = {
          email,
          password: req.password,
          ...(req.mfaCode ? { mfaCode: req.mfaCode } : {}),
          firebaseIdToken,
        };

        return this.#api.post<TokenResponse>('/auth/login', loginRequest);
      }),
      switchMap((r) => this.#setBackendTokens(r)),
    );
  }

  loginWithGoogle() {
    return this.#firebase.signInWithGoogle().pipe(
      switchMap(({ email, idToken }) => {
        const loginRequest: LoginRequest = {
          email: email.trim().toLowerCase(),
          firebaseIdToken: idToken,
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

  verifyEmail(email: string, token: string) {
    return this.#api.post<void>('/auth/verify-email', { email, token });
  }

  loadProfile() {
    return this.#api.get<CurrentUserResponse>('/auth/me').pipe(tap((user) => this.#store.setUser(user)));
  }

  refreshToken() {
    if (!this.#refresh$) {
      const refreshToken = this.#store.refreshToken();

      if (!refreshToken) {
        return throwError(() => new Error('No backend refresh token is available.'));
      }

      this.#refresh$ = this.#api.post<TokenResponse>('/auth/refresh', { refreshToken }).pipe(
        switchMap((r) => this.#setBackendTokens(r)),
        shareReplay(1),
        finalize(() => (this.#refresh$ = undefined)),
      );
    }
    return this.#refresh$;
  }

  #setBackendTokens(response: TokenResponse) {
    this.#store.setAccessToken(response.accessToken);
    this.#store.setRefreshToken(response.refreshToken);

    return this.loadProfile().pipe(map(() => response));
  }
}
