import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from './firestore.service';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Items List</h2>
    <ul>
      <li *ngFor="let item of items">
        {{ item.name }} - {{ item.description }}
        <button (click)="deleteItem(item.id)">Delete</button>
      </li>
    </ul>
    <button (click)="addItem()">Add Item</button>
  `
})
export class ItemListComponent {
  firestoreService = inject(FirestoreService);
  items: any[] = [];

  constructor() {
    this.firestoreService.getItems().subscribe(data => this.items = data);
  }

  addItem() {
    this.firestoreService.addItem({ name: 'New Item', description: 'Test description' });
  }

  deleteItem(id: string) {
    this.firestoreService.deleteItem(id);
  }
}
