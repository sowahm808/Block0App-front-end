import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

describe('app route coverage', () => {
  it('uses NotFoundPage for wildcard routes instead of FeaturePageComponent', () => {
    const wildcard = routes.find((route) => route.path === '**');
    expect(String(wildcard?.loadComponent)).toContain('not-found.page');
    expect(String(wildcard?.loadComponent)).not.toContain('feature-page.component');
  });

  it('declares public certificate verification route', () => {
    const route = routes.find((candidate) => candidate.path === 'certificate/verify/:verificationCode');
    expect(route?.data?.['apiPath']).toBe('/public/certificates/verify/:verificationCode');
  });
});
