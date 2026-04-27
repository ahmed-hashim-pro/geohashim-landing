import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SITE } from '../../content';

@Component({
  selector: 'app-testimonial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonial.component.html',
})
export class TestimonialComponent {
  protected readonly t = SITE.testimonial;
}
