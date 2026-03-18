import type {
  CharacterDetailDto,
  CharacterClassSummary,
} from '@/features/character/read-model/character-read.types';
import type { AbilityKey } from '@/features/mechanics/domain/character';

export function findCharacterSpellcastingClassEntry(
  character: CharacterDetailDto,
): CharacterClassSummary | undefined {
  return character.classes.find((c) => c.progression?.spellcasting !== 'none');
}

/**
 * Returns the spellcasting ability key (e.g. 'intelligence', 'charisma')
 * for the character's primary spellcasting class, or undefined if none.
 */
export function getSpellcastingAbility(
  character: CharacterDetailDto,
): AbilityKey | undefined {
  const entry = findCharacterSpellcastingClassEntry(character);
  return entry?.progression?.spellProgression?.ability;
}