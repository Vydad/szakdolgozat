import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'spellFilter',
  pure: true
})
export class SpellFilterPipe implements PipeTransform {
  transform(spells: any[], searchText: string, className: string): any[] {
    if (!spells || spells.length === 0) return [];

    // csak az adott osztály által használható varázslatok
    let filtered = spells.filter(spell => {
      if (!spell.uses) return false;

      // ha a uses egy tömb
      if (Array.isArray(spell.uses)) {
        return spell.uses.some((u: string) =>
          u.toLowerCase().includes(className?.toLowerCase() || '')
        );
      }

      // ha a uses egy string
      if (typeof spell.uses === 'string') {
        return spell.uses.toLowerCase().includes(className?.toLowerCase() || '');
      }

      return false;
    });

    // ha van keresési szöveg, további szűrés név alapján
    if (searchText && searchText.trim() !== '') {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(spell =>
        spell.name?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }
}
