import { Component, Input } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'header[app-site-header]',
  standalone: true,
  templateUrl: './site-header.component.html',
  preserveWhitespaces: true,
})
export class SiteHeaderComponent {
  /** On the landing page the nav jumps to its sections; elsewhere it links back to them. */
  @Input() onLanding = true;

  protected link(fragment: string): string {
    return this.onLanding ? fragment : `/${fragment}`;
  }
}
