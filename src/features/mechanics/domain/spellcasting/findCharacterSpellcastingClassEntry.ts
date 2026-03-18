import type {
  CharacterDetailDto,
  CharacterClassSummary,
} from '@/features/character/read-model/character-read.types';

export function findCharacterSpellcastingClassEntry(
  character: CharacterDetailDto,
): CharacterClassSummary | undefined {
  return character.classes.find((c) => c.progression?.spellcasting !== 'none');
}