import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

interface FirebaseAuthResponse {
  idToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: string;
}

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  #http = inject(HttpClient);
  #refreshToken: string | null = null;

  signInWithPassword(email: string, password: string): Observable<string> {
    return this.#post<FirebaseAuthResponse>('accounts:signInWithPassword', {
      email,
      password,
      returnSecureToken: true,
    }).pipe(map((response) => this.#setFirebaseSession(response)));
  }

  signInWithCustomToken(token: string): Observable<string> {
    return this.#post<FirebaseAuthResponse>('accounts:signInWithCustomToken', {
      token,
      returnSecureToken: true,
    }).pipe(map((response) => this.#setFirebaseSession(response)));
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

  clear() {
    this.#refreshToken = null;
  }

  #post<T>(method: string, body: unknown) {
    return this.#http.post<T>(`${environment.firebase.identityToolkitUrl}/${method}?key=${environment.firebase.apiKey}`, body);
  }

  #setFirebaseSession(response: FirebaseAuthResponse) {
    const idToken = response.idToken ?? response.id_token;
    const refreshToken = response.refreshToken ?? response.refresh_token;

    if (!idToken) {
      throw new Error('Firebase did not return an ID token.');
    }

    this.#refreshToken = refreshToken ?? this.#refreshToken;
    return idToken;
  }
}
