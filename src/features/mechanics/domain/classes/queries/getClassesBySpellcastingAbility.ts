import type { SpellcastingAbility } from '@/data/classes.types';
import type { ClassId } from '@/shared/types/ruleset';
import type { CharacterClass } from '@/data/classes.types';

export function getClassesBySpellcastingAbility(
  ability: SpellcastingAbility,
  classCatalog: CharacterClass[]
): ClassId[] {
  return classCatalog
    .filter(c => c.progression.spellcasting === ability)
    .map(c => c.id);
}