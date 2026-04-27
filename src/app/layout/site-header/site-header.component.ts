import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline, menuOutline, closeOutline } from 'ionicons/icons';

import { SITE } from '../../content';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [CommonModule, RouterLink, IonIcon],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.scss',
})
export class SiteHeaderComponent {
  protected readonly site = SITE;
  protected readonly theme = inject(ThemeService);
  protected readonly isDark = computed(() => this.theme.resolved() === 'dark');
  protected mobileOpen = false;

  constructor() {
    addIcons({ moonOutline, sunnyOutline, menuOutline, closeOutline });
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile(): void {
    this.mobileOpen = false;
  }
}
