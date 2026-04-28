import {
  AfterViewInit,
  Directive,
  ElementRef,
  Inject,
  PLATFORM_ID,
  Renderer2,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appMouseOrb]',
  standalone: true,
})
export class MouseOrbDirective implements AfterViewInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private rafId = 0;
  private targetX = 50;
  private targetY = 30;
  private currentX = 50;
  private currentY = 30;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = this.host.nativeElement;
    const handler = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      this.targetX = ((e.clientX - rect.left) / rect.width) * 100;
      this.targetY = ((e.clientY - rect.top) / rect.height) * 100;
    };
    el.addEventListener('pointermove', handler, { passive: true });

    const animate = () => {
      this.currentX += (this.targetX - this.currentX) * 0.08;
      this.currentY += (this.targetY - this.currentY) * 0.08;
      this.renderer.setStyle(el, '--orb-x', `${this.currentX}%`);
      this.renderer.setStyle(el, '--orb-y', `${this.currentY}%`);
      this.rafId = requestAnimationFrame(animate);
    };
    this.rafId = requestAnimationFrame(animate);
  }
}
