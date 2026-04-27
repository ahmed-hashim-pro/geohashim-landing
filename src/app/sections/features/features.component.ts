import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sparklesOutline,
  layersOutline,
  shareOutline,
  rocketOutline,
  phonePortraitOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';

import { SITE } from '../../content';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonIcon],
  templateUrl: './features.component.html',
})
export class FeaturesComponent {
  protected readonly content = SITE.features;

  constructor() {
    addIcons({
      sparklesOutline,
      layersOutline,
      shareOutline,
      rocketOutline,
      phonePortraitOutline,
      shieldCheckmarkOutline,
    });
  }
}
