import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Firestore, collection, query, getDocs, doc, docData, getDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, switchMap, of } from 'rxjs';
import { runTransaction, Transaction } from 'firebase/firestore';
import { ItemSearchPipe } from '../../pipes/item-search.pipe';
import { HasSpellLevelPipe } from '../../pipes/hasSpellLevel.pipe';
import { SpellFilterPipe } from '../../pipes/spell-filter.pipe';
import { v4 as uuidv4 } from 'uuid';


interface Skill {
  name: string;
  type: string;
  value: number;
}
interface Trait {
  uses: string;
  name: string;
  title: string;
  description: string;
  lvl?: number;
  [key: string]: any;
}

@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, RouterModule, ItemSearchPipe, HasSpellLevelPipe, SpellFilterPipe],
  templateUrl: './character-sheet.component.html',
  styleUrls: ['./character-sheet.component.scss']
})
export class CharacterSheetComponent implements OnInit {
  constructor(
      private router: Router
    ) {}
  tabs = ['Akciók', 'Felszerelés', 'Előélet', 'Jellemzők'];
  selectedTab = 'Akciók';
  character$!: Observable<any>;
  className: string = '';
  raceName: string = '';
  backgroundName:string='';
  temp: number = 0;
  hpDelta: number = 0;
  maxHp: number = 0;
  baseHp:number=0;
  characterId: string = '';
  characterData: any;
  raceData:any ;
  ac:number=0;
  traits: Trait[] = [];
  raceTraits: any[] = [];
  classTraits: any[] = [];
  backgroundTraits: any[] = [];
  backgroundDescription: string='';
  isCheckedInspiration: boolean = false;
  rollnumber :number = 0;
  proficiency:number=0;
  skills: Skill[] = [
    { name: 'Akrobatika', type: 'Ügyesség', value: 0 },
    { name: 'Állatok kezelése', type: 'Bölcsesség', value: 0 },
    { name: 'Atlétika', type: 'Erő', value: 0 },
    { name: 'Előadás', type: 'Karizma', value: 0 },
    { name: 'Emberismeret', type: 'Bölcsesség', value: 0 },
    { name: 'Észlelés', type: 'Bölcsesség', value: 0 },
    { name: 'Kézügyesség', type: 'Ügyesség', value: 0 },
    { name: 'Kutatás', type: 'Intelligencia', value: 0 },
    { name: 'Lopakodás', type: 'Ügyesség', value: 0 },
    { name: 'Mágiaismeret', type: 'Intelligencia', value: 0 },
    { name: 'Megfélemlítés', type: 'Karizma', value: 0 },
    { name: 'Megtévesztés', type: 'Karizma', value: 0 },
    { name: 'Meggyőzés', type: 'Karizma', value: 0 },
    { name: 'Orvoslás', type: 'Bölcsesség', value: 0 },
    { name: 'Természetismeret', type: 'Intelligencia', value: 0 },
    { name: 'Történelem', type: 'Intelligencia', value: 0 },
    { name: 'Túlélés', type: 'Bölcsesség', value: 0 },
    { name: 'Vallás', type: 'Intelligencia', value: 0 }
];
  private isSyncing = false;
  private traitsSynced = false;
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  equippedContainers: any[] = [];
  equippedArmors: any[] = [];
  equippedWeapons: any[] = [];
  itemAdd = false;
  searchTerm: string = '';
  allItems: any[] = [];
  weight=0;
  filteredItems: any = { fegyver: [], pancel: [], tarolo: [], egyeb: [] };
  selectedQuantity: { [key: string]: number } = {};
  selectedItemToAdd: any = null;
  tooltipVisible = false;
  tooltipItem: any = null;
  tooltipX = 0;
  tooltipY = 0;
  private tooltipTimer: any;
  lvl=1;
  spellPopupVisible = false;
  spellSearch = "";
  filteredSpells: any[] = [];
  allSpells: any[] = [];
  openedSpellId: { [level: number]: string | null } = {};
  levelUpVisible = false;
  targetLevel: number = 1;
  filteredTraits: any[] = [];

  

ngOnInit(): void {
  this.character$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const id = params.get('id');
      if (!id) throw new Error('Karakter ID hiányzik.');

      this.characterId = id;
      return docData(doc(this.firestore, `character/${id}`));
    }),
    switchMap(async (character: any) => {
      this.characterData = character;

      this.temp = character.tempHp ?? 0;
      this.isCheckedInspiration = character.inspiration ?? false;

      await this.loadClassAndRaceAndBackgroundNames(character.class, character.race, character.backstory);
      await this.getMaxHp();
      await this.setSkill(character.skill);

      this.raceData = await this.loadRaceData(character.race);

      await this.loadTraits();      


      if (!this.isSyncing) {
        await this.loadEquipment();
      }
      if(!this.traitsSynced){
        await this.syncTraitsToDatabase(); 
        await this.cleanCharacterTraits();
        this.traitsSynced=true;
      }
      this.getequippedContainers();
      this.getequippedWeapons();
      this.getequippedArmors();
      this.updateAllContainerWeights();
      return character;
    }),
      switchMap(character => of(character)) // Promise → Observable
    );
  }

  get characterDetailedTraits() {
    if (!this.characterData?.traits || !this.traits) return [];
    return this.characterData.traits
      .map((ct: any) => 
        this.traits.find((t: any) => 
          t.uses === ct.uses && t.name === ct.name
        )
      )
      .filter((t: any) => !!t);
  }
  async setSkill(skill:string[]){
    if (!this.characterData || !skill) return;
    this.skills.forEach(s => s.value = 0);
    for (let i = 0; i < skill.length; i++) {
      const a = this.skills.find(s=>s.name===skill[i])
      if (a) {
        a.value+=this.proficiencyBonus();
      }
    }
  }
  rollNot20(mod:number, db:number, max:number){
    var temp=0;
    for (let i = 0; i < db; i++) {
      temp+=Math.floor((Math.random()*max)+1)
    }
    this.rollnumber=temp+mod;
    this.rollShow()
  }
  selectTab(tab: string) {
    this.selectedTab = tab;
  }
  roll(number:number){
    this.rollnumber=Math.floor((Math.random()*20)+1)+number
    this.rollShow()
  }
  rollShow(){
    return this.rollnumber;
  }
  strengthTotal(){
    const strength = this.characterData.abilities?.find((a: any) => a.name === 'Erő');
    const total = strength?.total ?? 0;
    return total;
  }
  async saveCheckbox() {
    if (!this.characterId) return;
    const characterRef = doc(this.firestore, `character/${this.characterId}`);
    await updateDoc(characterRef, {
      inspiration: this.isCheckedInspiration
    });
  }
  getInitiative(): number {
  const dexterity = this.characterData.abilities?.find((a: any) => a.name === 'Ügyesség');
  const modifier = dexterity?.modifier ?? 0;
  return modifier
  }

  async loadRaceData(raceId: string): Promise<any | null> {
  try {
    const raceRef = doc(this.firestore, `race/${raceId}`);
    const raceSnap = await getDoc(raceRef);

    if (raceSnap.exists()) {
      return raceSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
  }


  async loadClassAndRaceAndBackgroundNames(classId: string, raceId: string, backgroundid:string) {
    try {
      const classSnap = await getDoc(doc(this.firestore, `class/${classId}`));
      if (classSnap.exists()) {
        const classData = classSnap.data();
        this.className = classData['name'];
      }
      const backgroundSnap = await getDoc(doc(this.firestore, `background/${backgroundid}`));
      if (backgroundSnap.exists()) {
        const backgroundData = backgroundSnap.data();
        this.backgroundName = backgroundData['name'];
        this.backgroundDescription=backgroundData['description']
      }
      const raceSnap = await getDoc(doc(this.firestore, `race/${raceId}`));
      if (raceSnap.exists()) {
        const raceData = raceSnap.data();
        this.raceName = raceData['name'];
      }
    } catch (error) {

    }
  }
  async loadTraits() {
  try {
    if (!this.characterData?.traits || !Array.isArray(this.characterData.traits)) {
      this.traits = [];
      return;
    }

    // Lekérjük az összes trait-et a Firestore "traits" kollekcióból
    const traitsSnapshot = await getDocs(collection(this.firestore, 'traits'));
    const allTraits = traitsSnapshot.docs.map(doc => doc.data() as Trait);

    // A karakter trait-ek nevei
    const characterTraitNames = this.characterData.traits.map((t: any) => t.name);

    // Szűrés: title === name, uses tartalmazza a race/class/background nevet
    this.traits = allTraits.filter(trait => {
      if (!trait.title || !trait.uses) return false;

      const matchesRace = this.raceName && trait.uses.includes(this.raceName);
      const matchesClass = this.className && trait.uses.includes(this.className);
      const matchesBackground = this.backgroundName && trait.uses.includes(this.backgroundName);

      return characterTraitNames.includes(trait.title) && (matchesRace || matchesClass || matchesBackground);
    });

    // Csoportosítás race/class/background szerint
    this.groupTraitsByCategory();

  } catch (error) {
  }
  }

  async syncTraitsToDatabase(): Promise<void> {
    if (!this.characterData || !Array.isArray(this.characterData.traits)) return;

    try {
      const traitsRef = collection(this.firestore, 'traits');
      const snapshot = await getDocs(traitsRef);

      const dbTraits: Trait[] = snapshot.docs.map(doc => doc.data() as Trait);

      const updatedTraits: Trait[] = [];

      for (const charTrait of this.characterData.traits as Trait[]) {
        const matches = dbTraits.filter(t =>
          t.title === charTrait.name && t.uses === charTrait.uses
        );

        if (matches.length === 0) {
          updatedTraits.push(charTrait);
          continue;
        }

        const valid = matches.filter(t =>
          (t.lvl ?? 0) <= this.characterData.lvl // biztos nem undefined
        );

        const best = valid.length > 0
          ? valid.reduce((a, b) => ((b.lvl ?? 0) > (a.lvl ?? 0) ? b : a))
          : matches[0];

        const merged: Trait = {
          ...charTrait, // karakter trait az alap
          ...best,      // DB trait info
          name: best.title, // explicit felülírás
          uses: best.uses,
          lvl: best.lvl ?? 0
        };
        delete merged['id'];

        if (best['charge'] !== undefined) {
          if (merged['charge'] === undefined) {
            merged['charge'] = best['charge'];
          }
          if (merged['temp_charge'] === undefined) {
            merged['temp_charge'] = best['charge'];
          }
        }

        updatedTraits.push(merged);
      }

      this.characterData.traits = updatedTraits;
      if (this.characterId) {
        const charDoc = doc(this.firestore, 'character', this.characterId);
        await updateDoc(charDoc, { traits: this.characterData.traits });
      }
    } catch (err) {
    }
  }

  cleanCharacterTraits(): void {
    if (!this.characterData?.traits) return;

    this.characterData.traits = this.characterData.traits.map((trait: any) => {
      const cleanedTrait = { ...trait };

      if ('title' in cleanedTrait) delete cleanedTrait.title;
      if ('description' in cleanedTrait) delete cleanedTrait.description;

      return cleanedTrait;
    });

    if (this.characterId) {
      const charDoc = doc(this.firestore, 'character', this.characterId);
      updateDoc(charDoc, { traits: this.characterData.traits });
    }
  }
  async loadEquipment(): Promise<void> {
    try {
      const itemSnapshot = await getDocs(collection(this.firestore, 'items'));
      const allItems = itemSnapshot.docs.map(doc => ({
        ...(doc.data() as any)
      }));

      if (!this.characterData?.equipment) return;

      const updatedEquipment = this.characterData.equipment.map((charItem: any) => {
        const dbItem = allItems.find(i => i.name === charItem.name);

        const felszerelt = charItem.hasOwnProperty('felszerelt') ? charItem.felszerelt : false;

        // Ha már van ID, megtartjuk, különben generálunk újat
        const id = charItem.id ? charItem.id : uuidv4();

        if (!dbItem) return { ...charItem, id, felszerelt };

        return { ...dbItem, ...charItem, id, felszerelt };
      });

      // Ellenőrzés: van-e változás
      const origJson = JSON.stringify(this.characterData.equipment);
      const updatedJson = JSON.stringify(updatedEquipment);
      if (origJson === updatedJson) {
        this.characterData.equipment = updatedEquipment;
        return;
      }

      // Szinkronizálás
      this.isSyncing = true;
      this.characterData.equipment = updatedEquipment;
      const charRef = doc(this.firestore, `character/${this.characterId}`);
      await updateDoc(charRef, { equipment: updatedEquipment });

      setTimeout(() => {
        this.isSyncing = false;
      }, 500);

    } catch (error) {
      this.isSyncing = false;
    }
  }
  groupTraitsByCategory() {
    // Ürítjük a korábbi csoportokat
    this.raceTraits = [];
    this.classTraits = [];
    this.backgroundTraits = [];

    if (!this.traits || this.traits.length === 0) return;

    this.traits.forEach(trait => {
      // Feltételezve, hogy trait.uses tartalmazza a kategóriát: "Törp", "Barbár", "Kalóz" stb.
      const usesArray = trait.uses.split(',').map(u => u.trim());
      if (usesArray.includes(this.raceName)) this.raceTraits.push(trait);
      else if (usesArray.includes(this.className)) this.classTraits.push(trait);
      else if (usesArray.includes(this.backgroundName)) this.backgroundTraits.push(trait);
    });
  }
  async getMaxHp(): Promise<void> {
    const id = this.characterId;
    if (!id) return;

    const characterSnap = await getDoc(doc(this.firestore, `character/${id}`));
    if (!characterSnap.exists()) return;

    const character = characterSnap.data();
    const classSnap = await getDoc(doc(this.firestore, `class/${character['class']}`));
    if (!classSnap.exists()) return;

    const classData = classSnap.data();
    this.baseHp = classData['hp'] || 0;
    const level = character['lvl'] || 1;
    this.lvl=level;
    const kitartas = character['abilities']?.find((a: any) => a.name === 'Állóképesség');
    const kitartasMod = kitartas?.modifier || 0;
    const extraHp = character['maxhp'] || 0;

    this.maxHp = (this.baseHp + kitartasMod) * level + extraHp;
    this.armoreClass();
  }
  armoreClass() {
    // Keressük meg az ügyesség módosítót
    const dex = this.characterData.abilities.find((a: any) => a.name === "Ügyesség");
    const dexMod = dex ? dex.modifier : 0;

    // Megkeressük a legmagasabb AC-értékű páncélt
    const armorItems = this.equippedArmors.filter((a: any) => a.type?.includes('páncél'));
    const bestArmor = armorItems.length > 0 
      ? Math.max(...armorItems.map((a: any) => Number(a.armor) || 0)) 
      : 10; // nincs páncél → alap 10

    // Megkeressük a legjobb pajzsot
    const shieldItems = this.equippedArmors.filter((a: any) => a.type?.includes('pajzs'));
    const bestShield = shieldItems.length > 0 
      ? Math.max(...shieldItems.map((a: any) => Number(a.armor) || 0)) 
      : 0;

    // AC kiszámítása
    this.ac = bestArmor + dexMod + bestShield;
  }

  proficiencyBonus(){
    this.proficiency=Math.ceil(this.characterData.lvl/4)+1;
    return Math.ceil(this.characterData.lvl/4)+1;
    
  }
  save(ablility:string){
    const saveabi = this.characterData['abilities']?.find((a: any) => a.name === ablility);
    let savemod = saveabi?.modifier
    for (let i = 0; i < this.characterData.save.length; i++) {
      if(this.characterData.save[i]==ablility){
        savemod+=this.proficiency;
      }
    }
    return savemod;
  }
  passziv(ablility:string, skill:string){
    const passzivabi = this.characterData['abilities']?.find((a: any) => a.name === ablility);
    let passzivmod = passzivabi?.modifier
    for (let i = 0; i < this.characterData.skill.length; i++) {
      if(this.characterData.skill[i]==skill){
        passzivmod+=this.proficiency;
      }
    }
    return passzivmod;
  }

  async applyDamageOrHeal(character: any, delta: number) {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const characterRef = doc(this.firestore, `character/${id}`);
    let { hp = 0 } = character;
    let currentTemp = this.temp;

    if (delta > 0 && hp < this.maxHp) {
      // Gyógyítás, de csak maxHP-ig
      const newHp = Math.min(hp + delta, this.maxHp);
      await this.updateCharacterHp(characterRef, newHp);
    } else if (delta < 0) {
      // Sebzés
      const damage = Math.abs(delta);
      if (currentTemp >= damage) {
        // Csak a tempből vonódik
        this.temp = currentTemp - damage;
      } else {
        // A temp lemegy nullára, maradék megy a hp-ból
        const remainingDamage = damage - currentTemp;
        this.temp = 0;
        const newHp = Math.max(hp - remainingDamage, 0);
        await this.updateCharacterHp(characterRef, newHp);
      }
    }
    updateDoc(doc(this.firestore, `character/${this.characterId}`), {
        tempHp:this.temp
      });
      this.hpDelta=0;
  }

  private async updateCharacterHp(characterRef: any, newHp: number) {
    await runTransaction(this.firestore, async (transaction: Transaction) => {
      transaction.update(characterRef, { hp: newHp });
    });
  }
  updateTempHp() {
    if (this.characterId == null) return;

    const characterRef = doc(this.firestore, `character/${this.characterId}`);

    updateDoc(characterRef, { tempHp: this.temp })
  }
  startTooltipTimer(event: MouseEvent, item: any) {
    clearTimeout(this.tooltipTimer);
    this.tooltipTimer = setTimeout(() => {
      this.tooltipItem = item;
      this.tooltipVisible = true;
      this.tooltipX = event.clientX + 15;
      this.tooltipY = event.clientY + 15;
    }, 500); // 0.5 másodperc késleltetés
  }

  moveTooltip(event: MouseEvent) {
    if (this.tooltipVisible) {
      this.tooltipX = event.clientX + 15; 
      this.tooltipY = event.clientY + 15; 
    }
  }

  hideTooltip() {
    this.clearTooltipTimer();
    this.tooltipVisible = false;
  }

  private clearTooltipTimer() {
    if (this.tooltipTimer) {
      clearTimeout(this.tooltipTimer);
      this.tooltipTimer = null;
    }
  }
  // 🔹 Az alapfelszerelés, ami nincs tárolóban
    get mainInventory() {
    return this.characterData?.equipment?.filter(
      (i: any) => !i.tárolt || i.tárolt === ''
    ) || [];
  }
  get equipmentWeapon() {
    return this.characterData?.equipment?.filter(
      (i: any) => i.type?.includes('fegyver') && i.felszerelt==true
    ) || [];
  }


  // 🔹 Az éppen felszerelt tárolók
  get containers() {
    return this.characterData?.equipment?.filter(
      (i: any) => i.type?.includes('tároló') && i.felszerelt
    );
  }
  getequippedContainers(){
    if (!this.characterData?.equipment) {
    this.equippedContainers = [];
    return;
  }
  

  this.equippedContainers = this.characterData.equipment.filter(
    (item: any) => item.type?.includes('tároló') && item.felszerelt === true
  );
  }
  getequippedWeapons(){
    if (!this.characterData?.equipment) {
    this.equippedWeapons = [];
    return;
  }
  this.equippedWeapons = this.characterData.equipment.filter(
    (item: any) => item.type?.includes('fegyver') && item.felszerelt === true
  );
  }
  getequippedArmors(){
    if (!this.characterData?.equipment) {
    this.equippedArmors = [];
    return;
  }
  this.equippedArmors = this.characterData.equipment.filter(
    (item: any) => item.type?.includes('páncél') && item.felszerelt === true
  );
  }
  attackRoll(mod:string,type:string):number{
    let number=0;
    for (let i = 0; i <this.characterData.weapon.length; i++) {
      if(type.includes(this.characterData.weapon[i])){
        number+=this.proficiency;
        break;
      }
    }
    if(mod==='Erő'){
      number+=this.characterData['abilities']?.find((a: any) => a.name === 'Erő').modifier;
    }else if(mod==='Ügyesség'){
      number+=this.characterData['abilities']?.find((a: any) => a.name === 'Ügyesség').modifier;
    }
    return number;
  }
  dmgMod(mod:string){
    let modi="";
    if(mod==='Erő'){
      modi=this.characterData['abilities']?.find((a: any) => a.name === 'Erő').modifier>0? '+'+this.characterData['abilities']?.find((a: any) => a.name === 'Erő').modifier : this.characterData['abilities']?.find((a: any) => a.name === 'Erő').modifier;
    }else if(mod==='Ügyesség'){
      modi=this.characterData['abilities']?.find((a: any) => a.name === 'Ügyesség').modifier>0? '+'+this.characterData['abilities']?.find((a: any) => a.name === 'Ügyesség').modifier : this.characterData['abilities']?.find((a: any) => a.name === 'Ügyesség').modifier;
    }
    return modi
  }
  rollDamage(mod:string,dmg: string) {
    let number=0;
    if(mod==='Erő'){
      number=this.characterData['abilities']?.find((a: any) => a.name === 'Erő').modifier;
    }else if(mod==='Ügyesség'){
      number=this.characterData['abilities']?.find((a: any) => a.name === 'Ügyesség').modifier;
    }
    let db=Number(dmg.split('d')[0])
    let dmg2=Number(dmg.split('d')[1])
    this.rollNot20(number,db,dmg2);
  }
  // Charge mennyiséghez tömbet generál
  getChargeArray(trait: any) {
    const max = trait.charge ?? 0;
    return Array(max).fill(0);
  }

  // Checkbox logika
  toggleCharge(trait: any, index: number) {
    if (trait.temp_charge == null) trait.temp_charge = trait.charge;

    const usedSlots = trait.charge - trait.temp_charge;

    // ha rákattintunk egy olyan slotra, ami még üres → növeljük a usedSlots-ot
    if (index >= usedSlots) {
      trait.temp_charge = trait.charge - (usedSlots + 1);
    }
    // ha olyanra amelyik tele volt → csökkentjük a usedSlots-ot
    else {
      trait.temp_charge = trait.charge - (usedSlots - 1);
    }

    // minimum 0, maximum charge
    trait.temp_charge = Math.max(0, Math.min(trait.temp_charge, trait.charge));

    this.saveTraits();
  }

  saveTraits() {
    const charRef = doc(this.firestore, `character/${this.characterId}`);
    updateDoc(charRef, { traits: this.characterData.traits });
  }

  async toggleMenu() {
    this.itemAdd = !this.itemAdd;
    if (this.itemAdd && this.allItems.length === 0) {
      await this.loadItemsFromDB();
    }
  }

  hideMenu() {
    this.itemAdd = false;
  }

  async loadItemsFromDB() {
    const itemsCollection = collection(this.firestore, 'items');
    const snapshot = await getDocs(itemsCollection);
    this.allItems = snapshot.docs.map(doc => doc.data());
    this.categorizeItems();
  }

  categorizeItems() {
    this.filteredItems = {
      fegyver: this.allItems.filter(i => i.type?.toLowerCase().includes('fegyver')),
      pancel: this.allItems.filter(i => i.type?.toLowerCase().includes('páncél')),
      tarolo: this.allItems.filter(i => i.type?.toLowerCase().includes('tároló')),
      egyeb: this.allItems.filter(i =>
        !i.type?.toLowerCase().includes('fegyver') &&
        !i.type?.toLowerCase().includes('páncél') &&
        !i.type?.toLowerCase().includes('tároló')
      ),
    };
  }

  setQuantity(itemName: string, quantity: number) {
    this.selectedQuantity[itemName] = quantity;
  }
  get itemGroups() {
    return [
      { label: 'Fegyverek', items: this.allItems.filter((i: any) => i.type?.includes('fegyver')), allowQuantity: false },
      { label: 'Páncélok', items: this.allItems.filter((i: any) => i.type?.includes('páncél')), allowQuantity: false },
      { label: 'Tárolók', items: this.allItems.filter((i: any) => i.type?.includes('tároló')), allowQuantity: false },
      { label: 'Egyéb', items: this.allItems.filter((i: any) => !['fegyver','páncél','tároló'].some(t => i.type?.includes(t))), allowQuantity: true }
    ];
  }
  addItem(item: { name: string; type: string; weight?: number }, quantity: number = 1): void {
    if (item.type.includes('fegyver') || item.type.includes('páncél') || item.type.includes('tároló')) {
      // Mindig új item
      const newItem = { ...item, db: 1, felszerelt: false, tárolt: '' };
      this.characterData.equipment.push(newItem);
    } else {
      // Egyéb kategória: meglévőhöz adás
      const existing = this.characterData.equipment.find((existingItem: { name: string; db: number }) => existingItem.name === item.name);
      if (existing && existing.tárolt=='') {
        existing.db += quantity;
      } else {
        const newItem = { ...item, db: quantity, felszerelt: false, tárolt: '' };
        this.characterData.equipment.push(newItem);
      }
    }

    this.saveEquipment(); // mentés
  }
  // 🔹 Checkbox kezelése és mentése Firestore-ba
  async toggleEquip(item: any, checked: boolean) {

    item.felszerelt = checked;
    if (item.type?.includes('tároló')) {
      if (checked) {
        if (!this.equippedContainers.find((c: any) => c.name === item.name)) {
          this.equippedContainers.push(item);
        }
      } else {
        this.equippedContainers = this.equippedContainers.filter(
          (c: any) => c.name !== item.name
        );
      }
    }
     if (item.type?.includes('páncél')) {
      if (checked) {
        if (!this.equippedArmors.find((c: any) => c.name === item.name)) {
          this.equippedArmors.push(item);
        }
      } else {
        this.equippedArmors = this.equippedArmors.filter(
          (c: any) => c.name !== item.name
        );
      }
    }
    if (item.type?.includes('fegyver')) {
      if (checked) {
        if (!this.equippedWeapons.find((c: any) => c.name === item.name)) {
          this.equippedWeapons.push(item);
        }
      } else {
        this.equippedWeapons = this.equippedWeapons.filter(
          (c: any) => c.name !== item.name
        );
      }
    }

    // 🔹 Mentés az adatbázisba
    try {
      const charRef = doc(this.firestore, `character/${this.characterId}`);
      await updateDoc(charRef, { equipment: this.characterData.equipment });
    } catch (err) {
    }
  }

  // 🔹 Mentés közös hívással (más funkciókhoz is)
  async saveEquipment() {
    try {
      const charRef = doc(this.firestore, `character/${this.characterId}`);
      await updateDoc(charRef, { equipment: this.characterData.equipment });
      this.updateAllContainerWeights()
    } catch (err) {
    }
  }
  updateItemQuantity(item: any, event: Event) {
    const input = event.target as HTMLInputElement;
    let newQuantity = Number(input.value);

    if (isNaN(newQuantity)) return;

    // Fegyverek, páncélok, tárolók: max 1
    if (item.type?.includes('fegyver') || item.type?.includes('páncél') || item.type?.includes('tároló')) {
      if (newQuantity > 1) newQuantity = 1;
    }

    if (newQuantity < 0) {
      // Törlés, ha 0-nál kevesebb
      this.characterData.equipment = this.characterData.equipment.filter(
        (i: any) => i !== item
      );
    } else {
      item.db = newQuantity;
    }

    this.saveEquipment();
  }


  // 🔹 Tárolóba helyezés
  moveItemToContainer(item: any, containerId: string) {
    if (!containerId) return;

    // Keresés az ID alapján
    const container = this.characterData.equipment.find(
      (c: any) => c.id === containerId && c.type?.includes('tároló')
    );
    if (!container) {
      alert('Nem található a kiválasztott tároló.');
      item.showContainerSelect = false;
      return;
    }

    if (item.type?.includes('tároló')) {
      alert('Tárolót nem tehetsz tárolóba!');
      item.showContainerSelect = false;
      return;
    }

    // Számoljuk a tároló jelenlegi súlyát
    const contents = this.characterData.equipment.filter(
      (i: any) => i.tárolt === container.id
    );
    const totalWeight = contents.reduce(
      (sum: number, i: any) => sum + (i.weight || 0) * (i.db || 1),
      0
    );

    const itemWeight = (item.weight || 0);
    const itemCount = item.db || 1;
    const availableCapacity = container.capacity - totalWeight;

    // Hány darab fér bele?
    const maxFit = Math.floor(availableCapacity / itemWeight);

    if (maxFit <= 0) {
      alert(`${container.name} megtelt!`);
      item.showContainerSelect = false;
      return;
    }

    if (maxFit < itemCount) {
      // Csak részben fér bele → szétválasztjuk az itemet
      const itemCopy = { ...item, id: crypto.randomUUID(), db: maxFit, tárolt: container.id, felszerelt: false };
      this.characterData.equipment.push(itemCopy);

      item.db -= maxFit;

    } else {
      // Minden belefér
      item.tárolt = container.id;
      item.felszerelt = false;
    }

    this.saveEquipment();
    item.showContainerSelect = false;
  }

  // 🔹 Tárolóból kivétel
  removeFromContainer(item: any) {
    // Keresünk ugyanilyen nevű itemet, ami nincs tárolóban
  const existing = this.characterData.equipment.find(
    (i: any) => i.name === item.name && (!i.tárolt || i.tárolt === '')
  );

  if (existing) {
    // Összevonás
    existing.db = (existing.db || 1) + (item.db || 1);

    // Töröljük a konténeres példányt
    this.characterData.equipment = this.characterData.equipment.filter(
      (i: any) => i !== item
    );
  } else {
    // Ha nincs ilyen elem, csak kivesszük a tárolóból
    item.tárolt = '';
  }
  this.saveEquipment();
  }
  getContainerContents(containerId: string) {
    return this.characterData?.equipment?.filter(
      (item: any) => item.tárolt === containerId
    ) || [];
    }
  updateCurrency(type: 'gold' | 'silver' | 'copper') {
    if (this.characterData[type] < 0) this.characterData[type] = 0; // ne lehessen negatív
    const charRef = doc(this.firestore, `character/${this.characterId}`);
    updateDoc(charRef, { [type]: this.characterData[type] })
    this.getWeight()
  }
  getWeight(): void {
    this.weight = 0;

    for (const item of this.characterData.equipment || []) {
      const itemDb = Number(item.db) || 1;
      const itemWeight = Number(item.weight) || 0;
      // Ha nincs tárolóban
      if (item.tárolt === '' || !item.tárolt) {
        this.weight += itemDb * itemWeight;
      }

      // Ha tároló típusú
      if (item.type?.includes('tároló')) {
        const invWeight = Number(item.inv_weight);
        this.weight += invWeight;
        
      }
    }

    // Pénz súlya
    this.weight += (Number(this.characterData.gold) ) * 0.02;
    this.weight += (Number(this.characterData.silver)|| 0 ) * 0.01;
    this.weight += (Number(this.characterData.copper)|| 0 ) * 0.005;
    this.weight = parseFloat(this.weight.toFixed(2));
    
  }

  getContainerInvWeight(id: number) {
    let intweight = 0;
    for (let i = 0; i < this.characterData.equipment.length; i++) {
      const item = this.characterData.equipment[i];
      if (item.tárolt === id) {
        intweight += Number(item.db) * Number(item.weight);
      }
    }

    // Keresés a tároló között, típusmegadással
    const container = this.characterData.equipment.find((c: any) =>
      c.id === id && c.type?.includes('tároló')
    );

    if (container) {
      container.inv_weight = intweight * Number(container.light || 1);
    }
  }
  updateAllContainerWeights() {
    for (const container of this.characterData.equipment) {
      if (container.type?.includes('tároló')) {
        this.getContainerInvWeight(container.id);
      }
    }
    this.getWeight()
  }
  reset() {
    // HP reset
    this.characterData.hp = this.maxHp;
    this.characterData.tempHp = 0;

    // Traits reset
    if (this.characterData.traits) {
      this.characterData.traits = this.characterData.traits.map((trait: any) => {
        if (trait.charge !== undefined) {
          return {
            ...trait,
            temp_charge: trait.charge
          };
        }
        return trait;
      });
    }

    // Firestore mentés
    const characterRef = doc(this.firestore, `character/${this.characterId}`);
    updateDoc(characterRef, {
      hp: this.maxHp,
      tempHp: 0,
      traits: this.characterData.traits
    })
    
  }
  spellModifier(){
    const ability = this.characterData.abilities.find(
      (a: any) => a.name === this.characterData.spell_mod
    );

    if (!ability) return 0;
    return ability.modifier;
  }
  openSpellPopup() {
    this.spellPopupVisible = true;
    this.loadSpells();
  }

  // popup zárás
  closeSpellPopup() {
    this.spellPopupVisible = false;
  }

  // Firestoreból spell lista
  async loadSpells() {
    const spellsRef = collection(this.firestore, "spells");
    const q = query(spellsRef);
    const snap = await getDocs(q);

    this.allSpells = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    this.filterSpells();
  }

  // Szűrés class (character.class) + keresés
  filterSpells() {
    if (!this.allSpells || !this.characterData.class) return;

    this.filteredSpells = this.allSpells.filter((spell: any) => {
      const uses = Array.isArray(spell.uses)
        ? spell.uses
        : spell.uses?.split(',').map((s: string) => s.trim()) || [];

      return uses.includes(this.className);
    });
  }


  // Bekészítés
  prepareSpell(spell: any) {
    if (!this.characterData.prepared_spells) this.characterData.prepared_spells = [];
    if (!this.characterData.cantrips) this.characterData.cantrips = [];

    const spellData = { ...spell }; // 🔥 Spell másolat
    const isCantrip = spell.lvl === 0;

    if (isCantrip) {
      // Ha benne van → törlés
      const existingIndex = this.characterData.cantrips.findIndex((s: any) => s.id === spell.id);
      if (existingIndex !== -1) {
        this.characterData.cantrips.splice(existingIndex, 1);

        updateDoc(doc(this.firestore, `character/${this.characterId}`), {
          cantrips: this.characterData.cantrips
        });
        return;
      }

      // Ha nincs benne → hozzáadás
      this.characterData.cantrips.push(spellData);

      updateDoc(doc(this.firestore, `character/${this.characterId}`), {
        cantrips: this.characterData.cantrips
      });

    } else {
      const existingIndex = this.characterData.prepared_spells.findIndex((s: any) => s.id === spell.id);
      if (existingIndex !== -1) {
        this.characterData.prepared_spells.splice(existingIndex, 1);

        updateDoc(doc(this.firestore, `character/${this.characterId}`), {
          prepared_spells: this.characterData.prepared_spells
        });
        return;
      }

      this.characterData.prepared_spells.push(spellData);

      updateDoc(doc(this.firestore, `character/${this.characterId}`), {
        prepared_spells: this.characterData.prepared_spells
      });
    }
  }
  
  // Spell részletek megnyitás (később kidolgozzuk)
  toggleSpellDetails(spell: any, level: number) {
    this.openedSpellId[level] =
    this.openedSpellId[level] === spell.name ? null : spell.name;
  }

  getSpellsByLevel(level: number) {
    return this.filteredSpells.filter(spell => spell.lvl === level);
  }
  isSpellPrepared(spell: any): boolean {
    return (
      this.characterData.prepared_spells?.some((s: any) => s.id === spell.id) ||
      this.characterData.cantrips?.some((s: any) => s.id === spell.id)
    );
  }
  hasReachedLimit(level: number): boolean {
    if (!this.characterData) return false;

    if (level === 0) {
      // Varázsfortály limit
      const current = this.characterData?.cantrips?.length || 0;
      const max = this.varazstoltesMax || 0;
      return current >= max;
    } else {
      // Készített varázslatok limit
      const current = this.characterData?.prepared_spells?.length || 0;
      const max = this.spellModifier() + this.lvl;
      return current >= max;
    }
  }
  get varazstoltesMax(): number {
    const trait = this.characterData?.traits?.find((t: any) => t.name === 'Varázstöltetek');
    return trait?.temp_charge?.[0] ?? 0;
  }
  getPreparedSpellsByLevel(level: number) {
    return this.characterData?.prepared_spells?.filter((s: any) => s.lvl === level) || [];
  }
  getVarazstoltesTrait() {
    return this.characterData?.traits?.find(
      (t: any) => t.name === 'Varázstöltetek' && t.charge && t.temp_charge
    );
  }
 toggleSpellCharge(trait: any, levelIndex: number, index: number) {
  if (!trait.temp_charge || trait.temp_charge[levelIndex] === undefined) return;

  const chargeCount = trait.charge?.[levelIndex] ?? 0;
  let used = chargeCount - (trait.temp_charge[levelIndex] ?? 0); // hány doboz van eddig "bekapcsolva"

  // ha rákattintunk egy bekapcsolatlan dobozra — bekapcsoljuk (növeljük a used-et)
  if (index >= used) {
    used = used + 1;
  } else {
    // ha egy már bekapcsoltra kattintunk — kikapcsoljuk (csökkentjük)
    used = used - 1;
  }

  // temp_charge = chargeCount - used
  trait.temp_charge[levelIndex] = Math.max(0, Math.min(chargeCount, chargeCount - used));

  // ha menteni akarod azonnal:
  this.saveTraits?.(); // használd a saját mentőfüggvényedet
}

  getChargeArraySpell(max: number) {
    const n = Math.max(0, Math.floor(Number(max) || 0));
    return Array(n);
  }
  openLevelUpPopup() {
    this.levelUpVisible = true;
    this.targetLevel = this.characterData?.lvl ?? 1;
    this.updateAvailableTraits();
  }

  closeLevelUpPopup() {
    this.levelUpVisible = false;
  }

  updateAvailableTraits() {
    if (!this.characterData?.traits) return;
    const currentLevel = this.characterData.lvl || 1;
    this.filteredTraits = this.classTraits.filter((trait: any) =>
      trait.lvl > currentLevel && trait.lvl <= this.targetLevel
    );
  }

  saveLevelUp() {
    if (!this.characterId) {
      return;
    }
    const kitartas = this.characterData['abilities']?.find((a: any) => a.name === 'Állóképesség');
    const kitartasMod = kitartas?.modifier || 0;
    const newLevel = this.targetLevel;
    if (newLevel>this.lvl) {
      if(newLevel+this.lvl>=20){
        updateDoc(doc(this.firestore, `character/${this.characterId}`), {
          lvl: 20,
          hp: this.maxHp+ ((this.baseHp+kitartasMod)*(20-this.lvl))
        });
      }else{
        updateDoc(doc(this.firestore, `character/${this.characterId}`), {
          lvl: newLevel,
          hp: this.maxHp+ ((this.baseHp+kitartasMod)*(newLevel-this.lvl))
        });
      }
    }
    else{
      if(newLevel+this.lvl<1){
        updateDoc(doc(this.firestore, `character/${this.characterId}`), {
          lvl: 1,
          hp: this.maxHp- ((this.baseHp+kitartasMod)*(this.lvl-1))
        });
      }else{
        updateDoc(doc(this.firestore, `character/${this.characterId}`), {
          lvl: newLevel,
          hp: this.maxHp- ((this.baseHp+kitartasMod)*(this.lvl-newLevel))
        });
      }
    }
    
    
    this.closeLevelUpPopup()
    this.router.navigate(['/character-sheet', this.characterId]);
  }
}