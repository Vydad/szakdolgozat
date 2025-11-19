import { Injectable, inject } from '@angular/core';
import { signal } from '@angular/core';
import { Firestore, collection, addDoc, doc, getDocs, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

export interface Ability {
  name: string;
  value: number;
  modifier: number;
  total: number;
  bonus: number;
  override: number | null;
}
export interface BaseEquipment {
  db: number;
  name: string;
}
interface Appearance {
  name: string;
  age: number | null;
  gender: string;
  height: number | null;
  weight: number | null;
  eyeColor: string;
  hairColor: string;
  skinTone: string;
}
interface EquipmentItem {
  id: number;
  name: string;
  options: { value: string; description: string }[];
  selected: string;
}
interface ParsedItem {
  db: number;
  name: string;
}
interface Traits {
  uses: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})

export class CreateService {
  constructor(private firestore: Firestore) {}
  raceBonusTrigger$ = new Subject<void>();
  updateEquipmentListTrigger$ = new Subject<void>();
  private router = inject(Router);
  private userId: string | null = null;
  public gold=0;
  public lvl = 1;
  public class = '';
  public traits: Traits[] = [];
  public race = '';
  public backstory = '';
  public abilities: Ability[] = [];
  public abiliti:string[]=[];
  public armor:string[]=[];
  public weapon:string[]=[];
  public save:string[]=[];
  public skill: (string|null)[] = [];
  public tools: (string|null)[] = [];
  public language: (string|null)[] = [];
  public skilli=0;
  public toolsi=0;
  public hp=0;
  public mage: boolean= false;
  public spell_mod='';
  private bgEquipment: BaseEquipment[] = [];
  equipmentSummary: ParsedItem[] = [];
  appearance = signal<Appearance>({
      name: '',
      age: null,
      gender: '',
      height: null,
      weight: null,
      eyeColor: '',
      hairColor: '',
      skinTone: ''
    });
  equipment = signal<EquipmentItem[]>([]);
  equipmentMode = signal<'point' | 'custom'>('point');

  setUserId(uid: string | null) {
    this.userId = uid;
  }

  getUserId(): string | null {
    return this.userId;
  }

  async loadTraitsAll() {
  try {
    this.traits = []; // ha akarod indulhat üresen, vagy hagyhatod meglévő értékekkel

    // 3 forrás: background, race, class
    const sources: { type: string; id: string }[] = [
      { type: 'background', id: this.backstory },
      { type: 'race', id: this.race },
      { type: 'class', id: this.class }
    ];

    for (const { type, id } of sources) {
      if (!id) continue; // ha nincs id, lépjen tovább

      const ref = doc(this.firestore, type, id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        continue;
      }

      const data = snap.data();
      const name: string = data?.['name'];

      if (!name) {
        continue;
      }

      // traits lekérése
      const traitsRef = collection(this.firestore, 'traits');
      const traitsSnap = await getDocs(traitsRef);

      const matchedTraits = traitsSnap.docs
        .map(doc => doc.data())
        .filter(traitData => {
          // uses mezőt vesszővel daraboljuk
          const usesList: string[] = (traitData['uses'] || '')
            .split(',')
            .map((u: string) => u.trim());
          // ha valamelyik uses tartalmazza a dokumentum nevét, akkor egyezés
          return usesList.some((use: string) => name.includes(use));
        })
        .map(data => {
          return {
            name: data['title'],
            uses: data['uses']
          } as Traits;
        });

      // hozzáadjuk az új találatokat, nem felülírjuk
      this.traits = [...this.traits, ...matchedTraits];
    }
  } catch (err) {
  }
}
  

  extractEquipmentSummary(): { db: number; name: string }[] {
    const equipmentData = this.equipment();
  
    return equipmentData.map(item => {
      const parts = item.selected.trim().split(' ');
      const first = parts[0];
      const rest = parts.slice(1).join(' ');
  
      const isNumber = !isNaN(Number(first));
      const db = isNumber ? Number(first) : 1;
      const name = isNumber ? rest : item.selected;
  
      return { db, name };
    });
  }
   addBgEquipmentToSummary(): void {
    for (const item of this.bgEquipment) {
      if (item.name === 'arany') {
        this.gold = item.db;
      } else {
        const existing = this.equipmentSummary.find(e => e.name === item.name);
        if (existing) {
          existing.db += item.db;
        } else {
          this.equipmentSummary.push({ db: item.db, name: item.name });
        }
      }
    }
  }
  setClass(selectedClass: string) {
    this.class = selectedClass;
  }
  setHp(hp: number){
    this.hp=hp
  }
  async calculateHp(){
    const kitartas = this.abilities?.find((a: any) => a.name === 'Állóképesség');
    const kitartasMod = kitartas?.modifier || 0;
    this.hp=(this.hp + kitartasMod) * this.lvl;
  }
  setRace(selectedRace: string) {
    this.race = selectedRace;
  }
  setBgEquipment(ep: BaseEquipment[]): void {
    this.bgEquipment = ep.map(e => ({ db: e.db, name: e.name }));
    this.updateEquipmentListTrigger$.next();
  }
  getBgEquipment(): BaseEquipment[] {
    return this.bgEquipment;
  }
  setSkill(skill: (string|null)[]){
    this.skill=skill;
  }
  setTools(tools: (string|null)[]){
    this.tools=tools;
  }
  setBackstory(selectedBackstory: string) {
    this.backstory = selectedBackstory;
  }

  setAbilities(abilities: Ability[]) {
    this.abilities = abilities;
  }
  setRaceAbilities(abiliti: string[]) {
    this.abiliti = abiliti;
    this.raceBonusTrigger$.next();  
  }
  getRaceAbilities() {
    return this.abiliti;
  }
  setAppearance(data: Appearance): void {
    this.appearance.set(data);
  }
  setEquipment(data: EquipmentItem[]) {
    this.equipment.set(data);
  }
  setLvl(lvl:number){
    this.lvl=lvl;
  }
  setArmor(armor:string[]){
    this.armor=armor;
  }
  setWeapon(weapon: string[]){
    this.weapon=weapon;
  }
  setSave(save: string[]){
    this.save=save;
  }
  setMage(mage:boolean,spell_mod:string){
    this.mage=mage;
    if (mage) {
      this.spell_mod=spell_mod
    }
  }
  setLanguage(language: (string|null)[]){
    this.language=language;
  }
  async dataUpLoad() {
    await this.loadTraitsAll();
    await this.calculateHp();
    this.equipmentSummary = this.extractEquipmentSummary();
    this.addBgEquipmentToSummary()
    const characterData = {
      userId:this.userId,
      lvl: this.lvl,
      class: this.class,
      traits: this.traits,
      race: this.race,
      backstory: this.backstory,
      abilities: this.abilities,
      appearance: this.appearance(),
      equipment: this.equipmentSummary,
      gold:this.gold,
      tools:this.tools,
      skill:this.skill,
      weapon:this.weapon,
      armor:this.armor,
      save:this.save,
      hp:this.hp,
      mage:this.mage,
      spell_mod:this.spell_mod,
      language:this.language,
    };
    const characterCollection = collection(this.firestore, 'character');
  
    addDoc(characterCollection, characterData)
      this.router.navigate(['/characters']);
  }
}
