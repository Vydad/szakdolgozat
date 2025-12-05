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
        { value: 'Hosszúkard', description: 'Egy kétkezes használatra készült kard, amely a harcosok alapvető és nagyra becsült fegyvere. Pengéje egyenes és kétélű, markolata keresztalakú. A teljes hossza általában 80 és 110 centiméter között mozog.' },
        { value: 'Csatabárd', description: 'Egy dupla fejű harcra kialakított fejsze, hosszú nyéllel. Ha az egyik fej éle csatában kicsorbul a harcos egy fogásváltással szert tehet egy új élre a túloldalon. ' },
        { value: 'Hosszúíj', description: 'Embermagas, nehéz íj amely használatához komoly képzetség szükséges. Azonban nincs az a páncél amely ellent tud állni vesszőinek.' },
        { value: 'Lándzsa', description: 'Sokoldalú, 2-2,5 méteres bot, tetején egy mindkét oldalt élezett hegyes fémpengével.' },
        { value: 'Sétabot', description: 'Egy egyszerű sétebot, egyik végén vassal megerősítve.'}
      ],
      selected: 'Hosszúkard'
    },
    {
      id: 2,
      name: ' Másodlagos Fegyver',
      options: [
        { value: 'Rövidkard', description: 'Egy kézben forgatott, mindkét oldalán élezett a hosszú kardnál jóval rövidebb szúró-vágó fegyver' },
        { value: 'Tőr', description: 'Egy olyan kétélű kés, amelynek hegye rendkívül éles. A használatában való jártasság által hozzáadhatod a vele mért támadások találati dobásához a jártasság bónuszodat.' },
        { value: 'Rövidíj', description: 'Vadászok által használt kisebb állatok rövidtávú vadászatához használt fegyver.' },
        { value: 'Kézi fejsze', description: 'Egy fanyelű fejsze, amelynek feje általában vasből vagy acélból készül. A használatában való jártasság által hozzáadhatod a vele mért támadások találati dobásához a jártasság bónuszodat.'}
      ],
      selected: 'Rövidkard'
    },
    {
      id: 3,
      name: 'Páncél',
      options: [
        { value: 'Bőrpáncél', description: 'A mell- és vállvért bőrből készültek, amelyet forrázással tettek strapabíróvá. A páncélzat többi része puhább, rugalmasabb anyagokból készűlt.' },
        { value: 'Láncing', description: 'Egymásba kapaszkodó fémgyűrűkből áll, általában az öltözet rétegei közt viselik, így a bőr képes tompítani a láncok súrlódásának zaját. Mérsékelt védelmet nyújt a felsőtest számára.' },
        { value: 'Gyűrűs páncél', description: 'Egy erősebb bőrpáncél, amelybe nehéz fémgyűrűket szőttek, hogy megerősítsék azt az erőteljesebb csapásokkal szemben. Mivel a gyűrűs páncél alulmarad a láncinggel szemben, ezért általában azok viselik, akik az utóbbit nem tudják megfizetni. Viselésével a lopakodásra hátrányt kapsz.' }
      ],
      selected: 'Bőrpáncél'
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