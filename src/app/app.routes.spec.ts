import { describe, expect, it } from 'vitest';
import { roleMatchGuard } from './core/guards/role-match.guard';
import { ShellComponent } from './core/layout/shell.component';
import { routes } from './app.routes';

describe('app route coverage', () => {
  it('uses NotFoundPage for wildcard routes instead of FeaturePageComponent', () => {
    const wildcard = routes.find((route) => route.path === '**');
    expect(String(wildcard?.loadComponent)).toContain('not-found.page');
    expect(String(wildcard?.loadComponent)).not.toContain('feature-page.component');
  });

  it('protects every lazy role workspace at its match boundary', () => {
    const shell = routes.find((route) => route.component === ShellComponent);
    const restrictedWorkspaces = ['mentor', 'review', 'admin'];

    for (const path of restrictedWorkspaces) {
      const route = shell?.children?.find((child) => child.path === path);
      expect(route?.canMatch).toContain(roleMatchGuard);
    }
  });

  it('declares public certificate verification route', () => {
    const route = routes.find((candidate) => candidate.path === 'certificate/verify/:verificationCode');
    expect(route?.data?.['apiPath']).toBe('/public/certificates/verify/:verificationCode');
  });
});
