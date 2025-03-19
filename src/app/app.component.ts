import { Component } from '@angular/core';
import { ItemListComponent } from './item-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ItemListComponent],
  template: `<app-item-list></app-item-list>`
})
export class AppComponent {}
