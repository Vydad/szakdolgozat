import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hasSpellLevel',
  pure: true
})
export class HasSpellLevelPipe implements PipeTransform {
  transform(spells: any[] | null | undefined, level: number): boolean {
    if (!Array.isArray(spells)) return false; // ha nincs spells tömb, visszaadunk false-t
    return spells.some(s => s.lvl === level || s.level === level);
  }
}
