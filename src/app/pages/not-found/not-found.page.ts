import { Component, OnInit, inject } from '@angular/core';

import { SiteHeaderComponent } from '../../layout/site-header/site-header.component';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';
import { useSiteChrome } from '../../layout/site-chrome';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './not-found.page.html',
})
export class NotFoundPage implements OnInit {
  private readonly seo = inject(SeoService);

  constructor() {
    useSiteChrome();
  }

  ngOnInit(): void {
    this.seo.apply({
      title: 'Page not found · Ahmed Hashim',
      description: 'That page could not be found.',
      path: '/404',
    });
  }
}
