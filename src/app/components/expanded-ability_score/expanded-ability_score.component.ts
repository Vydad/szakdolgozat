import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateService } from '../../services/charactercreate.service';

interface Ability {
  name: string;
  value: number;
  modifier: number;
  total:number;
  bonus:number;
  override:number|null;
}

@Component({
  selector: 'app-expanded-ability_score',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expanded-ability_score.component.html',
  styleUrls: ['./expanded-ability_score.component.scss']
})
export class ExpandedAbilityScoreComponent {
  constructor(private createService: CreateService) {}
  mode = signal<'point' | 'custom'>('point');

  totalPoints = 27;
  abilities = signal<Ability[]>([]);

  ngOnInit() {
    this.createService.raceBonusTrigger$.subscribe(() => {
      this.raceBonus();
    });
    this.raceBonus();
  }

  pointCosts: Record<number, number> = {
    8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
  };

  getAvailableValues(current: number): number[] {
    if (this.mode() === 'point') {
      return Object.keys(this.pointCosts)
        .map(Number)
        .filter(val => this.remainingPoints() + this.pointCosts[current] - this.pointCosts[val] >= 0);
    } else {
      return Array.from({ length: 13 }, (_, i) => i + 6);
    }
  }
  raceBonus() {
  this.resetAbilities()
  const bonusList = this.createService.getRaceAbilities(); 
  // pl. ["c2", "s1"]

  // abilities jelenlegi értéke
  const abilities = this.abilities();

  // végigmegyünk a bonusokon
  const updated = abilities.map(ability => {
    for (const bonusCode of bonusList) {
      const key = bonusCode[0];             
      const value = Number(bonusCode[1]);   

      // mapping: betű -> ability.name
      const map: Record<string, string> = {
        c: "Állóképesség",
        s: "Erő",
        d: "Ügyesség",
        i: "Intelligencia",
        w: "Bölcsesség",
        h: "Karizma"
      };

      if (ability.name === map[key]) {
        return {
          ...ability,
          bonus: value
        };
      }
    }
    return ability;
  });

  // új abilities beállítása
  this.abilities.set(updated);
  this.recalculate(updated);
}
  remainingPoints(): number {
    return this.totalPoints - this.abilities().reduce((sum, a) => sum + (this.pointCosts[a.value] || 0), 0);
  }

  getModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  updateValue(index: number, event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    const list = [...this.abilities()];
    list[index].value = value;
    this.recalculate(list);
  }

  updateOverride(index: number, event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    const list = [...this.abilities()];
    list[index].override = isNaN(value) ? null : value;
    this.recalculate(list);
  }

  recalculate(list: Ability[]) {
    list.forEach(a => {
      const base = a.value;
      const bonus = a.override ?? 0;
      a.total = base + bonus+a.bonus;
      a.modifier = this.getModifier(a.total);
    });
    this.abilities.set(list);
    this.createService.setAbilities(list);
  }

  switchMode(newMode: 'point' | 'custom') {
    this.mode.set(newMode);
    this.raceBonus();
  }

  resetAbilities() {
    const defaults: Ability[] = [
      'Erő', 'Ügyesség', 'Állóképesség', 'Bölcsesség', 'Intelligencia', 'Karizma'
    ].map(name => ({ name, value: 8, override: null, total: 8, modifier: -1, bonus: 0}));
    this.abilities.set(defaults);
    this.createService.setAbilities(defaults);
  }

  getPointDifference(current: number, target: number): number {
    const currentCost = this.pointCosts[current] ?? 0;
    const targetCost = this.pointCosts[target] ?? 0;
    return targetCost - currentCost;
  }

  formatPointCost(cost: number): string {
    return cost == 0 ? '' : cost >= 0 ? `(-${cost})` : `(+${Math.abs(cost)})`;
  }

  expanded: boolean = false; 

  toggleExpand() {
    this.expanded = !this.expanded;
  }
}
