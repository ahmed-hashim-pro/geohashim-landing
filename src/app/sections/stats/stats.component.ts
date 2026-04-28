import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SITE } from '../../content';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
})
export class StatsComponent {
  protected readonly stats = SITE.stats;
}
