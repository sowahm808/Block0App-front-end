import { describe, expect, it } from 'vitest';
import { APP_NAVIGATION, APP_NAVIGATION_GROUPS } from './navigation';

describe('APP_NAVIGATION', () => {
  it('uses typed metadata for protected administration links', () => {
    const admin = APP_NAVIGATION.find((item) => item.href === '/admin');
    expect(admin?.roles).toContain('Administrator');
    expect(admin?.icon).toBeTruthy();
  });

  it('matches the recommended scholar top-level navigation order', () => {
    const scholar = APP_NAVIGATION_GROUPS.find((group) => group.label === 'Scholar');

    expect(scholar?.items.map((item) => item.label)).toEqual([
      'Dashboard',
      'Today’s Challenge',
      'Learning Packs',
      'Clinical Scenarios',
      'Rehearsal',
      'Check-Ins',
      'My Team',
      'Readiness',
      'Rewards',
      'Certificates',
      'Notifications',
      'Profile',
      'Settings',
    ]);
  });

  it('keeps dynamic scholar child routes in metadata without making them generic sidebar links', () => {
    const learningPacks = APP_NAVIGATION_GROUPS.find((group) => group.label === 'Scholar')?.items.find(
      (item) => item.route === '/learning-packs',
    );
    const detail = learningPacks?.children?.find((item) => item.route === '/learning-packs/:packId');
    const capsuleAttempt = detail?.children?.find((item) => item.route === '/capsule-attempts/:attemptId');

    expect(detail?.label).toBe('Learning Pack Detail');
    expect(detail?.showInSidebar).toBe(false);
    expect(capsuleAttempt?.label).toBe('Capsule Attempt');
    expect(capsuleAttempt?.showInSidebar).toBe(false);
  });
});
