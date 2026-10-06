import { Component, OnInit, inject } from '@angular/core';

import { SiteHeaderComponent } from '../../layout/site-header/site-header.component';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';
import { useSiteChrome } from '../../layout/site-chrome';
import { SeoService } from '../../core/seo.service';
import { SITE } from '../../content';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './pricing.page.html',
})
export class PricingPage implements OnInit {
  private readonly seo = inject(SeoService);
  protected readonly content = SITE.pricing;
  protected readonly productUrl = SITE.urls.product;

  constructor() {
    useSiteChrome();
  }

  ngOnInit(): void {
    const meta = SITE.seo.routes['/pricing'];
    this.seo.apply({ title: meta.title, description: meta.description, path: '/pricing' });
  }
}
