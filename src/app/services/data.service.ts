import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // Így mindenhol elérhető lesz
})
export class DataService {
  constructor(private firestore: Firestore) {}

  // Példa: Adatok lekérése a Firestore adatbázisból
  getCards(): Observable<any[]> {
    const itemsCollection = collection(this.firestore, 'cards');
    return collectionData(itemsCollection, { idField: 'id' });
  }
  getClass(): Observable<any[]> {
    const cardsCollection = collection(this.firestore, 'class');
    return collectionData(cardsCollection, { idField: 'id' }) as Observable<any[]>; // Az idField biztosítja az ID-t
  }
  getTraits(): Observable<any[]> {
    const cardsCollection = collection(this.firestore, 'traits');
    return collectionData(cardsCollection, { idField: 'id' });
  }
  getRace(): Observable<any[]> {
    const cardsCollection = collection(this.firestore, 'race');
    return collectionData(cardsCollection, { idField: 'id' }) as Observable<any[]>; // Az idField biztosítja az ID-t
  }
  getBackground(): Observable<any[]> {
    const cardsCollection = collection(this.firestore, 'background');
    return collectionData(cardsCollection, { idField: 'id' }) as Observable<any[]>; // Az idField biztosítja az ID-t
  }
}
