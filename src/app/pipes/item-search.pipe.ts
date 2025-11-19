import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'itemSearch',
  standalone: true, // így nem kell modulba felvenni, csak importálni a componentbe
})
export class ItemSearchPipe implements PipeTransform {
  transform(items: any[], searchTerm: string): any[] {
    if (!items || !searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => item.name?.toLowerCase().includes(term));
  }
}