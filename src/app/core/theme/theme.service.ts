import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
type AppliedTheme = 'light' | 'dark';

const STORAGE_KEY = 'b0-theme-preference';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly #document = inject(DOCUMENT);
  readonly #mode = signal<ThemeMode>(this.#readInitialMode());
  readonly mode = this.#mode.asReadonly();
  readonly appliedTheme = computed<AppliedTheme>(() => this.#resolveTheme(this.#mode()));
  readonly isDark = computed(() => this.appliedTheme() === 'dark');

  constructor() {
    effect(() => {
      const theme = this.appliedTheme();
      const root = this.#document.documentElement;
      root.classList.toggle('theme-dark', theme === 'dark');
      root.classList.toggle('theme-light', theme === 'light');
      root.style.colorScheme = theme;
      this.#persistMode(this.#mode());
    });
  }

  setMode(mode: ThemeMode): void {
    this.#mode.set(mode);
    this.#persistMode(mode);
  }

  toggleTheme(): void {
    this.setMode(this.appliedTheme() === 'dark' ? 'light' : 'dark');
  }

  #persistMode(mode: ThemeMode): void {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage may be unavailable in privacy-restricted contexts.
    }
  }

  #readInitialMode(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch {
      return 'system';
    }
    return 'system';
  }

  #resolveTheme(mode: ThemeMode): AppliedTheme {
    if (mode !== 'system') return mode;
    return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
