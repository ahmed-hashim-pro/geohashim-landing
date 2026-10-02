import { Component } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'section[app-build]',
  standalone: true,
  templateUrl: './build.component.html',
  preserveWhitespaces: true,
})
export class BuildComponent {}
