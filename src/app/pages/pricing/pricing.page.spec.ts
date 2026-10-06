import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PricingPage } from './pricing.page';
import { SITE } from '../../content';

describe('PricingPage', () => {
  it('lists every plan with its price and links to the product', async () => {
    await TestBed.configureTestingModule({
      imports: [PricingPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(PricingPage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    const rows = Array.from(el.querySelectorAll('.plan-list > div')).map((row) => [
      row.querySelector('dt')?.textContent?.trim(),
      row.querySelector('dd')?.textContent?.trim(),
    ]);
    expect(rows).toEqual(SITE.pricing.plans.map((p) => [p.name, p.price]));
    expect(el.querySelector('h1')?.textContent).toContain('My Stream pricing');
    expect(el.querySelector(`a[href="${SITE.urls.product}"]`)).not.toBeNull();
  });
});
