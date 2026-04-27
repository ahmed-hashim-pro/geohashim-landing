import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sparklesOutline,
  codeSlashOutline,
  globeOutline,
  personCircleOutline,
} from 'ionicons/icons';

import { SITE } from '../../content';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './about.component.html',
})
export class AboutComponent {
  protected readonly content = SITE.about;

  constructor() {
    addIcons({ sparklesOutline, codeSlashOutline, globeOutline, personCircleOutline });
  }
}
