import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Storage } from '@angular/fire/storage';
import { CreateService } from '../../services/charactercreate.service';


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

@Component({
  selector: 'app-expanded-description',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expanded-description.component.html',
  styleUrls: ['./expanded-description.component.scss']
})
export class ExpandedDescriptionComponent {
  expanded = signal<boolean>(false);
  constructor(private storage: Storage, private createService: CreateService) {}
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

  toggleExpand() {
    this.expanded.update(v => !v);
  }

  saveAppearance(): void {
    const appearanceData = this.appearance();
  
    // Küldjük el a service-nek, itt például egy setAppearance metódussal
    this.createService.setAppearance(appearanceData);
  }

  updateField(field: keyof Appearance, event: Event): void {
    const target = event.target as HTMLInputElement | null;
  
    if (!target) return; // ha nincs target, kilép
  
    const value = field === 'height' || field === 'weight' || field==='age'
      ? target.valueAsNumber
      : target.value;
  
    // Ha szám, de nem értelmezhető szám, ne frissítsen
    if ((field === 'height' || field === 'weight' || field==='age') && isNaN(value as number)) {
      return;
    }
  
    this.appearance.update(prev => ({
      ...prev,
      [field]: value
    }));
    this.saveAppearance(); 
  }
}