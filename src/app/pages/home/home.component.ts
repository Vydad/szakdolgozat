import { Component, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ExpandedCardComponent } from '../../components/expanded-card/expanded-card.component';
import { SelectionService } from '../../services/selection.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule,NavbarComponent,ExpandedCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  expandedCard: string | null = null;
  cardStyles: { top: string; left: string; width: string; height: string } | null = null;

  constructor(private renderer: Renderer2, private elRef: ElementRef, private selectionService: SelectionService) {}

  expandCard(cardName: string, event: MouseEvent) {
    if (this.expandedCard === cardName) {
      this.expandedCard = null;
      this.cardStyles = null;
      return;
    }
    
    this.selectionService.setSelectedCard(cardName);
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect(); // Az aktuális pozíció lekérése

    this.cardStyles = {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    };

    setTimeout(() => {
      this.expandedCard = cardName;
      this.cardStyles = null; // Átváltunk az új méretre
    }, 10);
  }
  closeCard(event: MouseEvent) {
    event.stopPropagation(); // Ne aktiválja újra a kattintást
    this.expandedCard = null;
    this.selectionService.setSelectedCard("");
  }
  
}