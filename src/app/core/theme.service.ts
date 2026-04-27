import { DOCUMENT, Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'geohashim:theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser: boolean;
  readonly mode = signal<ThemeMode>('system');
  readonly resolved = signal<'light' | 'dark'>('light');

  constructor(
    @Inject(DOCUMENT) private readonly doc: Document,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (!this.isBrowser) return;

    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system';
    this.mode.set(stored);
    this.applyMode(stored);

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', () => {
      if (this.mode() === 'system') this.applyMode('system');
    });
  }

  toggle(): void {
    const current = this.resolved();
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    this.set(next);
  }

  set(mode: ThemeMode): void {
    this.mode.set(mode);
    if (this.isBrowser) localStorage.setItem(STORAGE_KEY, mode);
    this.applyMode(mode);
  }

  private applyMode(mode: ThemeMode): void {
    const html = this.doc.documentElement;
    const prefersDark = this.isBrowser
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
    const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
    html.classList.toggle('dark', isDark);
    html.classList.toggle('ion-palette-dark', isDark);
    this.resolved.set(isDark ? 'dark' : 'light');
  }
}
