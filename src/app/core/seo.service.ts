import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { SITE } from '../content';

export interface SeoInput {
  title: string;
  /** Title for social cards when it should differ from the page title. */
  ogTitle?: string;
  description: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  apply(input: SeoInput): void {
    const path = input.path === '/' ? '' : input.path.replace(/\/?$/, '/');
    const url = `${SITE.urls.canonical}${path}`;
    const ogImage = `${SITE.urls.canonical}${SITE.seo.ogImage}`;

    this.title.setTitle(input.title);
    const socialTitle = input.ogTitle ?? input.title;

    const tags: { name?: string; property?: string; content: string }[] = [
      { name: 'description', content: input.description },
      { property: 'og:title', content: socialTitle },
      { property: 'og:description', content: input.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url },
      { property: 'og:site_name', content: SITE.brand.name },
      { property: 'og:image', content: ogImage },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: socialTitle },
      { name: 'twitter:description', content: input.description },
      { name: 'twitter:image', content: ogImage },
    ];

    for (const tag of tags) {
      const selector = tag.name ? `name="${tag.name}"` : `property="${tag.property}"`;
      this.meta.updateTag(tag, selector);
    }

    this.upsertCanonical(url);
  }

  private upsertCanonical(url: string): void {
    const head = this.doc.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  applyJsonLd(id: string, data: Record<string, unknown>): void {
    const head = this.doc.head;
    let script = head.querySelector<HTMLScriptElement>(`script[data-jsonld="${id}"]`);
    if (!script) {
      script = this.doc.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-jsonld', id);
      head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }
}
