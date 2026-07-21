import { describe, expect, it } from 'vitest';
import { APP_NAVIGATION } from './navigation';

describe('APP_NAVIGATION', () => {
  it('uses typed metadata for protected administration links', () => {
    const admin = APP_NAVIGATION.find((item) => item.href === '/admin');
    expect(admin?.roles).toContain('Administrator');
    expect(admin?.icon).toBeTruthy();
  });
});
