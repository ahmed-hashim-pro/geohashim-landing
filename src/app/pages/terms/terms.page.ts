import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';

import { SiteHeaderComponent } from '../../layout/site-header/site-header.component';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';
import { SeoService } from '../../core/seo.service';
import { SITE } from '../../content';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, IonContent, SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './terms.page.html',
})
export class TermsPage implements OnInit {
  private readonly seo = inject(SeoService);
  protected readonly content = SITE.legal.terms;

  ngOnInit(): void {
    const meta = SITE.seo.routes['/terms'];
    this.seo.apply({ title: meta.title, description: meta.description, path: '/terms' });
  }
}
