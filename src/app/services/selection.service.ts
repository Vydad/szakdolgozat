import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
    public selectedCardSource = "";

    setSelectedCard(cardName: string) {
        this.selectedCardSource=cardName;
    }
}