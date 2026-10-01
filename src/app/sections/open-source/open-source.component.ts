import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { logoGithub, checkmarkCircle, arrowForwardOutline } from 'ionicons/icons';

import { SITE } from '../../content';

@Component({
  selector: 'app-open-source',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './open-source.component.html',
})
export class OpenSourceComponent {
  protected readonly content = SITE.openSource;
  // Bound [icon] data, not a static name="": static names resolve during hydration,
  // before addIcons() runs, and stay blank (see the checkmarks in #projects).
  protected readonly icons = { github: logoGithub, check: checkmarkCircle, arrow: arrowForwardOutline };
}
