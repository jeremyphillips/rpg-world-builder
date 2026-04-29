import type { CharacterPatchFields } from '@/features/character/domain/types/character.types'

const OWNER_ALWAYS_KEYS = [
  'name',
  'imageKey',
  'narrative',
  'combat',
  'spells',
  'alignment',
  'proficiencies',
  'equipment',
  'wealth',
  'xp',
  'levelUpPending',
  'pendingLevel',
  'race',
  'raceChoices',
  'abilityScores',
  'feats',
  'armorClass',
] as const satisfies readonly (keyof CharacterPatchFields)[]

const LEVEL_UP_KEYS = [
  'totalLevel',
  'classes',
  'hitPoints',
  'subclassId',
] as const satisfies readonly (keyof CharacterPatchFields)[]

/**
 * When the caller is the character owner (not campaign/platform admin), only a subset of
 * PATCH fields are applied so players cannot arbitrarily overwrite DM-only data.
 */
export function narrowCharacterPatchForOwner(
  body: Partial<CharacterPatchFields>,
  characterLevelUpPending: boolean,
): Partial<CharacterPatchFields> {
  const out: Partial<CharacterPatchFields> = {}
  for (const key of OWNER_ALWAYS_KEYS) {
    const v = body[key]
    if (v !== undefined) {
      Object.assign(out, { [key]: v })
    }
  }
  if (characterLevelUpPending) {
    for (const key of LEVEL_UP_KEYS) {
      const v = body[key]
      if (v !== undefined) {
        Object.assign(out, { [key]: v })
      }
    }
  }
  return out
}
