import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { keyOutline, checkmarkCircle, flashOutline, cashOutline, ribbonOutline } from 'ionicons/icons';

import { SITE } from '../../content';

@Component({
  selector: 'app-providers',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './providers.component.html',
})
export class ProvidersComponent {
  protected readonly content = SITE.providers;
  protected readonly metricRows = [
    { key: 'cost' as const, label: 'Cost', icon: 'cash-outline', invert: true },
    { key: 'speed' as const, label: 'Speed', icon: 'flash-outline', invert: false },
    { key: 'quality' as const, label: 'Quality', icon: 'ribbon-outline', invert: false },
  ];

  constructor() {
    addIcons({ keyOutline, checkmarkCircle, flashOutline, cashOutline, ribbonOutline });
  }

  bars(value: number): boolean[] {
    return [1, 2, 3, 4, 5].map((i) => i <= value);
  }
}
