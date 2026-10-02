import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // No in-memory scrolling: a hash link fires popstate, and Angular's anchor scrolling would
    // override the browser's native jump, which honours scroll-padding-top under the sticky header.
    // Links between pages are plain hrefs, so each page load starts at the top on its own.
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideClientHydration(),
  ],
};
