import { HttpClient } from '@angular/common/http';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { inject, Injectable } from '@angular/core';
import { from, map, Observable, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

interface FirebaseAuthResponse {
  idToken?: string;
  refreshToken?: string;
  expiresIn?: string;

  id_token?: string;
  refresh_token?: string;
  expires_in?: string;
}

interface FirebaseVerificationResponse {
  email: string;
  kind?: string;
}

export interface FirebaseGoogleSignInResult {
  email: string;
  idToken: string;
}

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  readonly #http = inject(HttpClient);

  #refreshToken: string | null = null;

  signInWithPassword(email: string, password: string): Observable<string> {
    return this.#emailPasswordRequest('accounts:signInWithPassword', email, password);
  }

  signUpWithPassword(email: string, password: string): Observable<string> {
    return this.#emailPasswordRequest('accounts:signUp', email, password).pipe(
      switchMap((idToken) => this.sendEmailVerification(idToken).pipe(map(() => idToken))),
    );
  }

  signInWithGoogle(): Observable<FirebaseGoogleSignInResult> {
    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: 'select_account',
    });

    return from(import('../firebase/firebase.config')).pipe(
      switchMap(({ firebaseAuth }) => signInWithPopup(firebaseAuth, provider)),
      switchMap((credential) =>
        from(credential.user.getIdToken()).pipe(
          map((idToken) => ({
            email: credential.user.email ?? '',
            idToken,
          })),
        ),
      ),
    );
  }

  signInWithCustomToken(token: string): Observable<string> {
    return this.#post<FirebaseAuthResponse>('accounts:signInWithCustomToken', {
      token,
      returnSecureToken: true,
    }).pipe(map((response) => this.#setFirebaseSession(response)));
  }

  sendEmailVerification(idToken: string): Observable<void> {
    if (!idToken) {
      return throwError(() => new Error('A Firebase ID token is required to send the verification email.'));
    }

    return this.#post<FirebaseVerificationResponse>('accounts:sendOobCode', {
      requestType: 'VERIFY_EMAIL',
      idToken,
    }).pipe(map(() => void 0));
  }

  resendEmailVerification(email: string, password: string): Observable<void> {
    return this.signInWithPassword(email.trim().toLowerCase(), password).pipe(
      switchMap((idToken) => this.sendEmailVerification(idToken)),
    );
  }

  refreshIdToken(): Observable<string> {
    if (!this.#refreshToken) {
      return throwError(() => new Error('No Firebase refresh token is available.'));
    }

    return this.#http
      .post<FirebaseAuthResponse>(`${environment.firebase.secureTokenUrl}/token?key=${environment.firebase.apiKey}`, {
        grant_type: 'refresh_token',
        refresh_token: this.#refreshToken,
      })
      .pipe(map((response) => this.#setFirebaseSession(response)));
  }

  normalizeBackendToken(token: string): Observable<string> {
    return this.signInWithCustomToken(token);
  }

  clear(): void {
    this.#refreshToken = null;
  }

  #post<T>(method: string, body: unknown): Observable<T> {
    return this.#http.post<T>(
      `${environment.firebase.identityToolkitUrl}/${method}?key=${environment.firebase.apiKey}`,
      body,
    );
  }

  #emailPasswordRequest(method: string, email: string, password: string): Observable<string> {
    return this.#post<FirebaseAuthResponse>(method, {
      email: email.trim().toLowerCase(),
      password,
      returnSecureToken: true,
    }).pipe(map((response) => this.#setFirebaseSession(response)));
  }

  #setFirebaseSession(response: FirebaseAuthResponse): string {
    const idToken = response.idToken ?? response.id_token;

    const refreshToken = response.refreshToken ?? response.refresh_token;

    if (!idToken) {
      throw new Error('Firebase did not return an ID token.');
    }

    this.#refreshToken = refreshToken ?? this.#refreshToken;

    return idToken;
  }
}
