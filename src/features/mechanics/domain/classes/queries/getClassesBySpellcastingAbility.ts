import type { SpellcastingAbility } from '@/features/content/classes/domain/types';
import type { ClassId } from '@/shared/types/ruleset';
import type { CharacterClass } from '@/features/content/classes/domain/types';

export function getClassesBySpellcastingAbility(
  ability: SpellcastingAbility,
  classCatalog: CharacterClass[]
): ClassId[] {
  return classCatalog
    .filter(c => c.progression.spellcasting === ability)
    .map(c => c.id);
}