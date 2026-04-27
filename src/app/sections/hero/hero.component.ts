import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SITE } from '../../content';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
})
export class HeroComponent {
  protected readonly hero = SITE.hero;
}
