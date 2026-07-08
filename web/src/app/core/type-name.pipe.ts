import { Pipe, PipeTransform } from '@angular/core';

/** "LineageSupportGems" -> "Lineage Support Gems", "UniqueWeapons" -> "Unique Weapons". */
@Pipe({ name: 'typeName', standalone: true })
export class TypeNamePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  }
}
