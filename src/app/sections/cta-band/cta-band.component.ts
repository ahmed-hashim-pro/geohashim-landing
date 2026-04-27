import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SITE } from '../../content';

@Component({
  selector: 'app-cta-band',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cta-band.component.html',
})
export class CtaBandComponent {
  protected readonly content = SITE.ctaBand;
}
