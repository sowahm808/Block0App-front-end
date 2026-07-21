import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    document.documentElement.className = '';
  });

  it('stores and applies dark mode', () => {
    const service = TestBed.inject(ThemeService);
    service.setMode('dark');
    expect(service.isDark()).toBe(true);
    expect(localStorage.getItem('b0-theme-preference')).toBe('dark');
  });
});
