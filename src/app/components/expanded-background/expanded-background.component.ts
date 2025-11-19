import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { CreateService } from '../../services/charactercreate.service';

export interface Trait {        
  title: string;        
  description: string;  
  uses: string;         
}
interface Equipment {
  db: number;
  name: string;
}

@Component({
  selector: 'app-expanded-background',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './expanded-background.component.html',
  styleUrls: ['./expanded-background.component.scss']
})
export class ExpandedBackgroundComponent implements OnInit {
  constructor(private createService: CreateService) {}
  private dataService = inject(DataService);
  
  @Input() title!: string;
  children: any[] = []; // Kártyák adatainak tárolása
  traits:any[]=[];
  tools:string[]=[];
  selectedTools: { [bgId: string]: (string | null)[] } = {};
  defaultTools: { [bgId: string]: (string | null)[] } = {};
  selectedSkills: { [bgId: string]: (string | null)[] } = {};
  defaultSkills: { [bgId: string]: (string | null)[] } = {};
  language: (string | null)[] = [];
  bgEquipment: Equipment[] = [];
  expanded: boolean = false; // Az alapértelmezett állapot, hogy a kártya össze van csukva
  expandedBgId: string | null = null; // A kiválasztott kaszt azonosítója, hogy azt bővítsük
  bgId:string='';
  default_i:number=0;

  ngOnInit() {
    // Adatok betöltése a Firestore-ból
    this.dataService.getBackground().subscribe(data => {
      this.children = data; // Mivel nincs parentId, minden kártyát hozzáadunk
    });
    this.dataService.getTraits().subscribe(data=>{
      this.traits = data;
    })
  }

  // A fő kártya kibővítésének vezérlése
  toggleExpand() {
    this.expanded = !this.expanded;
  }

  // A kasztok kibővítése
  toggleBgDetails(bgId: string) {
    // Ha a kiválasztott kasztot már bővítettük, akkor bezárjuk
    if (this.expandedBgId === bgId) {
      this.expandedBgId = null;
    } else {
      this.expandedBgId = bgId; // Másik kaszt kinyitása
    }
  }
  groupedTraits(id: string): {traits: Trait[] }[] {
    const filtered = this.traits.filter(navItem => id.includes(navItem.uses));
      
    const grouped: { [level: number]: Trait[] } = {};
    filtered.forEach(trait => {
      if (!grouped[trait.lvl]) {
        grouped[trait.lvl] = [];
      }
      grouped[trait.lvl].push(trait);
    });
    return Object.entries(grouped).map(([level, traits]) => ({
    level: +level,
    traits
  })).sort((a, b) => a.level - b.level);
  }
  // ====== Eszközjártasság ======
  initToolSelection(card: any) {
    if (!this.selectedTools[card.id]) {
      const count = card.tools[0];
      this.selectedTools[card.id] = Array(count).fill(null);
    }
    return true;
  }
  onSelectTool(bgId: string, index: number, value: string) {
    this.selectedTools[bgId][index] = value;
  }
  defaultTool(bgId: string, value: unknown) {
  if (typeof value !== 'string') return;
  if (!this.defaultTools[bgId]) {
    this.defaultTools[bgId] = [];
  }
  if (!this.defaultTools[bgId].includes(value)) {
    this.defaultTools[bgId].push(value);
    this.selectedTools=this.defaultTools;
  }
}
  getToolOptions(card: any, bgId: string, index: number): string[] {
    const allOptions = card.tools.slice(1) as string[];
    const alreadySelected = this.selectedTools[bgId].filter((v, i) => v !== null && i !== index);
    return allOptions.filter(opt => !alreadySelected.includes(opt));
  }

  // ====== Jártasság ======
  initSkillSelection(card: any) {
    if (!this.selectedSkills[card.id]) {
      const count = card.skills[0];
      this.selectedSkills[card.id] = Array(count).fill(null);
    }
    return true;
  }
  onSelectSkill(bgId: string, index: number, value: string) {
    this.selectedSkills[bgId][index] = value;
  }
  defaultSkill(bgId: string, value: unknown) {
    if (typeof value !== 'string') return;
    if (!this.defaultSkills[bgId]) {
      this.defaultSkills[bgId] = [];
    }
    if (!this.defaultSkills[bgId].includes(value)) {
      this.defaultSkills[bgId].push(value);
      this.selectedSkills=this.defaultSkills;
    }
  }
  getSkillOptions(card: any, bgId: string, index: number): string[] {
    const allOptions = card.skills.slice(1) as string[];
    const alreadySelected = this.selectedSkills[bgId].filter((v, i) => v !== null && i !== index);
    return allOptions.filter(opt => !alreadySelected.includes(opt));
  }
  setBgEquipment(ep: Equipment[]): void {
      this.bgEquipment = ep.map(e => ({ db: e.db, name: e.name }));
  }
  loadSkill(){
    return this.selectedSkills;
  }
  loadTools(){
    return this.selectedTools;
  }
  setLanguage(language:(string | null)[]){
    this.language=language;
  }
  loadLanguage(){
    return this.language;
  }
  kivalaszt(id:string){
    this.bgId=id;
    this.createService.setBackstory(id);
    this.createService.setBgEquipment(this.bgEquipment);
  }
}
