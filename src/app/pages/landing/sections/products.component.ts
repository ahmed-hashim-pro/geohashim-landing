import { Component } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'section[app-products]',
  standalone: true,
  templateUrl: './products.component.html',
  preserveWhitespaces: true,
})
export class ProductsComponent {}
