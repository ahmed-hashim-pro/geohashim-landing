import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, createOutline, peopleOutline } from 'ionicons/icons';

import { SITE } from '../../content';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './how-it-works.component.html',
})
export class HowItWorksComponent {
  protected readonly content = SITE.howItWorks;

  constructor() {
    addIcons({ personCircleOutline, createOutline, peopleOutline });
  }
}
