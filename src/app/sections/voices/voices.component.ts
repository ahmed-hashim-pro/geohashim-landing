import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sparklesOutline, documentTextOutline } from 'ionicons/icons';

import { SITE } from '../../content';

@Component({
  selector: 'app-voices',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './voices.component.html',
})
export class VoicesComponent {
  protected readonly content = SITE.voices;
  // Bound [icon] data: a static name="" resolves during hydration, before addIcons() runs, and stays blank.
  protected readonly icons = { document: documentTextOutline, sparkles: sparklesOutline };
  protected readonly activeId = signal<string>(this.content.samples[0].id);

  protected readonly active = computed(
    () => this.content.samples.find((s) => s.id === this.activeId()) ?? this.content.samples[0],
  );

  constructor() {
    addIcons({ sparklesOutline, documentTextOutline });
  }

  setVoice(id: string): void {
    this.activeId.set(id);
  }
}
