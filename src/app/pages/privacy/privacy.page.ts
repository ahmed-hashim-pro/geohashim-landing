import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';

import { SiteHeaderComponent } from '../../layout/site-header/site-header.component';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';
import { SeoService } from '../../core/seo.service';
import { SITE } from '../../content';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, IonContent, SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './privacy.page.html',
})
export class PrivacyPage implements OnInit {
  private readonly seo = inject(SeoService);
  protected readonly content = SITE.legal.privacy;

  ngOnInit(): void {
    const meta = SITE.seo.routes['/privacy'];
    this.seo.apply({ title: meta.title, description: meta.description, path: '/privacy' });
  }
}
