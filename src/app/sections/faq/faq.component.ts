import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';

import { SITE } from '../../content';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, IonAccordion, IonAccordionGroup, IonItem, IonLabel],
  templateUrl: './faq.component.html',
})
export class FaqComponent {
  protected readonly content = SITE.faq;
}
