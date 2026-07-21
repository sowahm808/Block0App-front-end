import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../api/api.service';
import { CurrentUserResponse, RegisterRequest, TokenResponse } from '../../api/api.types';
import { AuthService } from '../auth.service';
import { AuthStore } from '../auth.store';
import { FirebaseAuthService } from '../firebase-auth.service';

class ApiServiceStub {
  posts: Array<{ path: string; body: unknown }> = [];
  gets: string[] = [];

  tokenResponse: TokenResponse = {
    accessToken: 'backend-access-token',
    expiresUtc: '2026-07-21T12:00:00Z',
    refreshToken: 'backend-refresh-token',
    refreshExpiresUtc: '2026-08-20T12:00:00Z',
    tokenType: 'Bearer',
  };

  currentUser: CurrentUserResponse = {
    userId: 'firebase-uid-123',
    email: 'doctor@example.com',
    displayName: 'Dr Example',
    permissions: ['dashboard:view', 'admin:manage'],
    emailVerified: true,
    mfaEnabled: false,
  };

  post<T>(path: string, body: unknown) {
    this.posts.push({ path, body });

    if (path === '/auth/register') {
      return of({
        userId: 'firebase-uid-123',
        email: 'doctor@example.com',
        emailVerificationLink: 'https://example.test/verify',
      } as T);
    }

    return of(this.tokenResponse as T);
  }

  get<T>(path: string) {
    this.gets.push(path);
    return of(this.currentUser as T);
  }
}

class FirebaseAuthServiceStub {
  signInWithPasswordCalls: Array<{ email: string; password: string }> = [];

  signInWithPassword(email: string, password: string) {
    this.signInWithPasswordCalls.push({ email, password });
    return of('firebase-id-token');
  }

  refreshIdToken() {
    return of('refreshed-firebase-id-token');
  }

  normalizeBackendToken(token: string) {
    return of(`normalized-${token}`);
  }

  clear() {}
}

describe('AuthService backend auth integration', () => {
  let auth: AuthService;
  let api: ApiServiceStub;
  let firebase: FirebaseAuthServiceStub;
  let store: AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthStore,
        { provide: ApiService, useClass: ApiServiceStub },
        { provide: FirebaseAuthService, useClass: FirebaseAuthServiceStub },
      ],
    });

    auth = TestBed.inject(AuthService);
    api = TestBed.inject(ApiService) as unknown as ApiServiceStub;
    firebase = TestBed.inject(FirebaseAuthService) as unknown as FirebaseAuthServiceStub;
    store = TestBed.inject(AuthStore);
  });

  it('successful registration uses RegisterResponse.userId', () => {
    const request: RegisterRequest = {
      displayName: 'Dr Example',
      email: 'doctor@example.com',
      password: 'a very safe password',
    };

    let userId = '';
    auth.register(request).subscribe((response) => (userId = response.userId));

    expect(api.posts).toEqual([{ path: '/auth/register', body: request }]);
    expect(userId).toBe('firebase-uid-123');
  });

  it('login stores backend tokens and hydrates the app user from /auth/me', () => {
    auth.login({ email: ' doctor@example.com ', password: 'secret-password', mfaCode: '123456' }).subscribe();

    expect(firebase.signInWithPasswordCalls).toEqual([{ email: 'doctor@example.com', password: 'secret-password' }]);
    expect(api.posts[0]).toEqual({
      path: '/auth/login',
      body: {
        email: 'doctor@example.com',
        password: 'secret-password',
        mfaCode: '123456',
        firebaseIdToken: 'firebase-id-token',
      },
    });
    expect(store.accessToken()).toBe('backend-access-token');
    expect(store.refreshToken()).toBe('backend-refresh-token');
    expect(api.gets).toEqual(['/auth/me']);
    expect(store.user()).toEqual(api.currentUser);
  });

  it('refreshes with the backend refresh token and stores rotated tokens', () => {
    store.setRefreshToken('existing-backend-refresh-token');
    api.tokenResponse = {
      accessToken: 'rotated-access-token',
      expiresUtc: '2026-07-21T12:15:00Z',
      refreshToken: 'rotated-refresh-token',
      refreshExpiresUtc: '2026-08-20T12:15:00Z',
      tokenType: 'Bearer',
    };

    auth.refreshToken().subscribe();

    expect(api.posts).toEqual([
      {
        path: '/auth/refresh',
        body: { refreshToken: 'existing-backend-refresh-token' },
      },
    ]);
    expect(store.accessToken()).toBe('rotated-access-token');
    expect(store.refreshToken()).toBe('rotated-refresh-token');
    expect(api.gets).toEqual(['/auth/me']);
  });

  it('authenticated app boot can hydrate the profile from /auth/me when an access token exists', () => {
    store.setAccessToken('existing-access-token');

    auth.loadProfile().subscribe();

    expect(api.gets).toEqual(['/auth/me']);
    expect(store.user()?.userId).toBe('firebase-uid-123');
  });

  it('reads permissions from CurrentUserResponse.permissions', () => {
    store.setUser(api.currentUser);

    expect(store.hasPermission(['dashboard:view'])).toBe(true);
    expect(store.hasPermission(['support:unknown'])).toBe(false);
  });

  it('allows role-gated routes when the backend only returns role access permissions', () => {
    store.setUser({ ...api.currentUser, permissions: ['scholar:access'] });

    expect(store.hasRole(['Scholar'])).toBe(true);
    expect(store.hasRole(['Mentor'])).toBe(false);
  });

  it('does not write to Firestore /users/{uid}', () => {
    auth
      .register({ displayName: 'Dr Example', email: 'doctor@example.com', password: 'a very safe password' })
      .subscribe();
    auth.login({ email: 'doctor@example.com', password: 'secret-password' }).subscribe();

    expect(api.posts.map((call) => call.path)).toEqual(['/auth/register', '/auth/login']);
    expect(api.posts.some((call) => call.path.includes('/users/'))).toBe(false);
  });
});
