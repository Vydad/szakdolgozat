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
@Component({
  selector: 'app-expanded-race',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expanded-race.component.html',
  styleUrls: ['./expanded-race.component.scss']
})
export class ExpandedRaceComponent implements OnInit {
  constructor(private createService: CreateService) {}
  private dataService = inject(DataService);
  
  @Input() title!: string;
  children: any[] = []; // Kártyák adatainak tárolása
  traits:any[]=[];
  tools:string[]=[];
  abilities:string[]=[];
  selectedTools: { [bgId: string]: (string | null)[] } = {};
  defaultTools: { [bgId: string]: (string | null)[] } = {};
  selectedSkills: { [bgId: string]: (string | null)[] } = {};
  defaultSkills: { [bgId: string]: (string | null)[] } = {};
  language: (string | null)[] = [];
  expanded: boolean = false; // Az alapértelmezett állapot, hogy a kártya össze van csukva
  expandedRaceId: string | null = null; // A kiválasztott kaszt azonosítója, hogy azt bővítsük
  raceId:string='';
  ngOnInit() {
    // Adatok betöltése a Firestore-ból
    this.dataService.getRace().subscribe(data => {
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
  toggleRaceDetails(raceId: string) {
    // Ha a kiválasztott kasztot már bővítettük, akkor bezárjuk
    if (this.expandedRaceId === raceId) {
      this.expandedRaceId = null;
    } else {
      this.expandedRaceId = raceId; // Másik kaszt kinyitása
    }
    
  }
  groupedTraits(id: string): { traits: Trait[] }[] {
  const filtered = this.traits.filter(navItem => {
    // uses feldarabolása vesszőnél
    const usesList = navItem.uses.split(',').map((u: string) => u.trim());
    // ha bármelyik elem benne van az id-ben → találat
    return usesList.some((use:string) => id.includes(use));
  });

  const grouped: { [level: number]: Trait[] } = {};
  filtered.forEach(trait => {
    if (!grouped[trait.lvl]) {
      grouped[trait.lvl] = [];
    }
    grouped[trait.lvl].push(trait);
  });

  return Object.entries(grouped)
    .map(([level, traits]) => ({
      level: +level,
      traits
    }))
    .sort((a, b) => a.level - b.level);
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
  abilitiLoad(id:string){
    this.abilities=id.split(',')
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
    this.raceId=id;
    this.createService.setRaceAbilities(this.abilities)
    this.createService.setRace(id);
  }
}
