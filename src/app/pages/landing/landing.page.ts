import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';

import { SiteHeaderComponent } from '../../layout/site-header/site-header.component';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';
import { HeroComponent } from '../../sections/hero/hero.component';
import { AboutComponent } from '../../sections/about/about.component';
import { FeaturesComponent } from '../../sections/features/features.component';
import { HowItWorksComponent } from '../../sections/how-it-works/how-it-works.component';
import { TestimonialComponent } from '../../sections/testimonial/testimonial.component';
import { FaqComponent } from '../../sections/faq/faq.component';
import { CtaBandComponent } from '../../sections/cta-band/cta-band.component';
import { SeoService } from '../../core/seo.service';
import { SITE } from '../../content';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    SiteHeaderComponent,
    SiteFooterComponent,
    HeroComponent,
    AboutComponent,
    FeaturesComponent,
    HowItWorksComponent,
    TestimonialComponent,
    FaqComponent,
    CtaBandComponent,
  ],
  templateUrl: './landing.page.html',
})
export class LandingPage implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    const meta = SITE.seo.routes['/'];
    this.seo.apply({ title: meta.title, description: meta.description, path: '/' });

    this.seo.applyJsonLd('website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.brand.name,
      url: SITE.urls.canonical,
      description: SITE.seo.defaultDescription,
    });
    this.seo.applyJsonLd('organization', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.brand.name,
      url: SITE.urls.canonical,
      logo: `${SITE.urls.canonical}${SITE.seo.ogImage}`,
      sameAs: [SITE.urls.product, SITE.urls.github, SITE.urls.linkedin],
    });
    this.seo.applyJsonLd('person', {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Ahmed Hashim',
      url: SITE.urls.canonical,
      jobTitle: 'Software engineer & founder of My Stream',
      sameAs: [SITE.urls.github, SITE.urls.linkedin, SITE.urls.product],
    });
    this.seo.applyJsonLd('software', {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'My Stream',
      url: SITE.urls.product,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      description:
        'AI publishing platform that scrapes, scores, and drafts articles using Claude, GPT, Gemini, Grok, DeepSeek, Mistral, or Groq.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    });
  }
}
