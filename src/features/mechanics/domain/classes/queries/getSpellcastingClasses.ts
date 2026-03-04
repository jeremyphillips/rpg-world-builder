import type { CharacterClass } from '@/features/classes/domain/types'; 

export function getSpellcastingClasses(classCatalog: CharacterClass[]): CharacterClass[] {
  return classCatalog.filter(
    c => c.progression.spellcasting !== 'none'
  );
}
