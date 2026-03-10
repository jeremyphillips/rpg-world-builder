import type { CharacterClass } from '@/features/content/classes/domain/types'; 

export function getSpellcastingClasses(classCatalog: CharacterClass[]): CharacterClass[] {
  return classCatalog.filter(
    c => c.progression.spellcasting !== 'none'
  );
}
