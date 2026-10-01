import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sparklesOutline,
  bookOutline,
  phonePortraitOutline,
  checkmarkCircle,
  arrowForwardOutline,
  logoGoogle,
} from 'ionicons/icons';

import { SITE } from '../../content';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './projects.component.html',
})
export class ProjectsComponent {
  protected readonly content = SITE.projects;
  // Bound [icon] data: a static name="" resolves during hydration, before addIcons() runs, and stays blank.
  protected readonly icons = { check: checkmarkCircle, arrow: arrowForwardOutline, google: logoGoogle };

  constructor() {
    addIcons({
      sparklesOutline,
      bookOutline,
      phonePortraitOutline,
      checkmarkCircle,
      arrowForwardOutline,
      logoGoogle,
    });
  }
}
