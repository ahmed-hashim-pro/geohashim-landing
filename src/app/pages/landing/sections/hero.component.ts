import { Component } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'section[app-hero]',
  standalone: true,
  templateUrl: './hero.component.html',
  preserveWhitespaces: true,
})
export class HeroComponent {}
