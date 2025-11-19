import { Component, Input, Signal, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { SelectionService } from '../../services/selection.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-expanded-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expanded-card.component.html',
  styleUrls: ['./expanded-card.component.scss']
})
export class ExpandedCardComponent {
  private dataService = inject(DataService);
  private selectionService = inject(SelectionService);

  cards: any[] = [];
  selectedNav:any;
  selected ="2";

  @Input() itemId!: string; // Külső ID alapján kérdezzük le az adatokat
  data: Signal<any> = signal(null);

  constructor() {
    this.dataService.getCards().subscribe(data => this.cards = data);
    this.selected=this.selectionService.selectedCardSource
  }

  get filteredCards() {
    return this.cards.filter(navItem => navItem.id[0]===this.selected[0] || navItem.id[0]===this.selected[0] || navItem.id[0]===this.selected[0]);
  }
  
  selectnav(selectedNav:Title){
    this.selectedNav=selectedNav;
  }
}

