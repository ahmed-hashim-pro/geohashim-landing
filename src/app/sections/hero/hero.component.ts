import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SITE } from '../../content';
import { MouseOrbDirective } from '../../core/mouse-orb.directive';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, MouseOrbDirective],
  templateUrl: './hero.component.html',
})
export class HeroComponent {
  protected readonly hero = SITE.hero;
}
