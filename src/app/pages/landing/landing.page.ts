import { Component, DestroyRef, NgZone, OnInit, afterNextRender, inject } from '@angular/core';

import { SiteHeaderComponent } from '../../layout/site-header/site-header.component';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';
import { HeroComponent } from './sections/hero.component';
import { WorkComponent } from './sections/work.component';
import { BuildComponent } from './sections/build.component';
import { OpenSourceComponent } from './sections/open-source.component';
import { ProductsComponent } from './sections/products.component';
import { initLanding } from './runtime/landing.js';
import { SeoService } from '../../core/seo.service';
import { SITE } from '../../content';

// The markup, styles and runtime are ported from docs/mockups/mockup-7-full-flight.html.
// Sections use attribute selectors on the mockup's own elements so the DOM matches it exactly.
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    SiteHeaderComponent,
    SiteFooterComponent,
    HeroComponent,
    WorkComponent,
    BuildComponent,
    OpenSourceComponent,
    ProductsComponent,
  ],
  templateUrl: './landing.page.html',
  preserveWhitespaces: true,
})
export class LandingPage implements OnInit {
  private readonly seo = inject(SeoService);

  constructor() {
    const zone = inject(NgZone);
    let dispose: (() => void) | undefined;
    // After hydration, so the runtime never edits DOM that Angular is still claiming; outside
    // the zone, so its scroll and animation-frame work doesn't trigger change detection.
    afterNextRender(() => {
      dispose = zone.runOutsideAngular(() => initLanding());
    });
    inject(DestroyRef).onDestroy(() => dispose?.());
  }

  ngOnInit(): void {
    const meta = SITE.seo.routes['/'];
    this.seo.apply({ title: meta.title, ogTitle: meta.ogTitle, description: meta.description, path: '/' });

    this.seo.applyJsonLd('website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.brand.name,
      url: SITE.urls.canonical,
      description: SITE.seo.defaultDescription,
    });

    this.seo.applyJsonLd('person', {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Ahmed Hashim',
      url: SITE.urls.canonical,
      jobTitle: 'Software architect',
      sameAs: [
        SITE.urls.github,
        SITE.urls.linkedin,
        SITE.urls.product,
        SITE.urls.mushaf,
        SITE.urls.quranAndroid,
      ],
    });

    this.seo.applyJsonLd('mystream', {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'My Stream',
      url: SITE.urls.product,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'AI publishing platform that scrapes, scores and drafts articles with models from 10 AI providers, including Claude, GPT and Gemini.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Person', name: 'Ahmed Hashim' },
    });

    this.seo.applyJsonLd('mushaf', {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Mushaf',
      url: SITE.urls.mushaf,
      applicationCategory: 'ReferenceApplication',
      operatingSystem: 'Web',
      description: 'A focused, ad-free digital Quran reader on the web.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Person', name: 'Ahmed Hashim' },
    });

    this.seo.applyJsonLd('quran-android', {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: 'My Stream - القرآن الكريم',
      url: SITE.urls.quranAndroid,
      applicationCategory: 'ReferenceApplication',
      operatingSystem: 'Android',
      description: 'Quran reader for Android with recitation audio, bookmarks, and offline reading.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Person', name: 'Ahmed Hashim' },
    });
  }
}
