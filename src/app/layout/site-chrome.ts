import { DestroyRef, NgZone, afterNextRender, inject } from '@angular/core';

import { initSiteChrome } from '../pages/landing/runtime/header.js';

/** Starts the header menu and theme toggle for a page that doesn't run the landing runtime. Call from a constructor. */
export function useSiteChrome(): void {
  const zone = inject(NgZone);
  let dispose: (() => void) | undefined;
  afterNextRender(() => {
    dispose = zone.runOutsideAngular(() => initSiteChrome());
  });
  inject(DestroyRef).onDestroy(() => dispose?.());
}
