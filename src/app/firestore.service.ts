import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(private firestore: Firestore) {}

  // Get all documents from "items" collection
  getItems(): Observable<any[]> {
    const itemsCollection = collection(this.firestore, 'items');
    return collectionData(itemsCollection, { idField: 'id' });
  }

  // Add a new item
  addItem(item: any) {
    const itemsCollection = collection(this.firestore, 'items');
    return addDoc(itemsCollection, item);
  }

  // Update an item
  updateItem(id: string, data: any) {
    const itemDoc = doc(this.firestore, `items/${id}`);
    return updateDoc(itemDoc, data);
  }

  // Delete an item
  deleteItem(id: string) {
    const itemDoc = doc(this.firestore, `items/${id}`);
    return deleteDoc(itemDoc);
  }
}