import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateService } from '../../services/charactercreate.service'; 

interface EquipmentOption {
  value: string;
  description: string;
}

interface BaseEquipment {
  db: number;
  name: string;
}

interface EquipmentItem {
  id: number;
  name: string;
  options: EquipmentOption[];
  selected: string;
}

@Component({
  selector: 'app-expanded-starterpack',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expanded-starterpack.component.html',
  styleUrls: ['./expanded-starterpack.component.scss']
})

export class ExpandedStarterpackComponent {
  constructor(private createService: CreateService) {
    this.createService.updateEquipmentListTrigger$.subscribe(() => {
      this.updateEquipmentList();
    });
    this.updateEquipmentList(); 
  }
  equipment: EquipmentItem[] = [
    {
      id: 1,
      name: ' Elsődleges Fegyver',
      options: [
        { value: 'Hosszúkard', description: 'Egy éles penge a közelharcra.' },
        { value: 'Rövidkard', description: 'Egy éles penge a közelharcra.' },
        { value: 'Csatabárd', description: 'Zúzófegyver a nehézpáncélos ellenfelekhez.' },
        { value: 'Hosszúíj', description: 'Távolsági fegyver, nyilakkal.' },
        { value: 'Lándzsa', description: 'Távolsági fegyver, nyilakkal.' },
        { value: 'bot', description: 'Távolsági fegyver, nyilakkal.'}
      ],
      selected: 'Hosszúkard'
    },
    {
      id: 2,
      name: ' Másodlagos Fegyver',
      options: [
        { value: 'Rövidkard', description: 'Egy éles penge a közelharcra.' },
        { value: 'Tőr', description: 'Zúzófegyver a nehézpáncélos ellenfelekhez.' },
        { value: 'RövidÍj', description: 'Távolsági fegyver, nyilakkal.' },
        { value: 'dobó balta', description: 'Távolsági fegyver, nyilakkal.'}
      ],
      selected: 'Rövidkard'
    },
    {
      id: 3,
      name: 'Páncél',
      options: [
        { value: 'Vászon ing', description: 'Egyszerű, de kényelmes ruházat.' },
        { value: 'Bőrpáncél', description: 'Könnyű és rugalmas védelem.' },
        { value: 'Láncing', description: 'Közepes védelem, de nehezebb.' }
      ],
      selected: 'Vászon ing'
    }
  ];
  baseEquipment: BaseEquipment[] = [
    { db: 1, name: 'Hátizsák' },
    { db: 1, name: 'Hálózsák' },
    { db: 3, name: 'Napi tartós étel' }
  ];
  finalEquipment: BaseEquipment[] = [];

  expanded = signal<boolean>(false);

  updateEquipmentList(): void {
    const bgEq = this.createService.getBgEquipment();
    this.finalEquipment = [...this.baseEquipment, ...bgEq];
    this.saveSelectedEquipment();
  }

  selectOption(itemId: number, event: Event): void {
    const value = (event.target as HTMLSelectElement)?.value;
    const item = this.equipment.find(e => e.id === itemId);
    if (item && value) {
      item.selected = value;
      this.saveSelectedEquipment();
    }
  }

  getDescription(item: EquipmentItem): string {
    const selectedOption = item.options.find(opt => opt.value === item.selected);
    return selectedOption ? selectedOption.description : '';
  }

  toggleExpand() {
    this.expanded.update(v => !v);
    this.updateEquipmentList();
  }
  saveSelectedEquipment(): void {
    this.createService.setEquipment(this.equipment);
  }
}