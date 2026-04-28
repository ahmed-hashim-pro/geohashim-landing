import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  linkOutline,
  cloudDownloadOutline,
  analyticsOutline,
  createOutline,
  newspaperOutline,
} from 'ionicons/icons';

import { SITE } from '../../content';

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './pipeline.component.html',
  styleUrl: './pipeline.component.scss',
})
export class PipelineComponent {
  protected readonly content = SITE.pipeline;
  protected readonly hovered = signal<string | null>(null);

  constructor() {
    addIcons({
      linkOutline,
      cloudDownloadOutline,
      analyticsOutline,
      createOutline,
      newspaperOutline,
    });
  }
}
