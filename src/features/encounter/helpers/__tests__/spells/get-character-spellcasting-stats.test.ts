import { describe, expect, it } from 'vitest'

import type { CharacterDetailDto } from '@/features/character/read-model'
import type { Ruleset } from '@/shared/types/ruleset'
import { CHARACTER_PROFICIENCY_BONUS_TABLE } from '@/features/mechanics/domain/progression'
import { getCharacterSpellcastingStats } from '../../spells'

const TEST_RULESET = {
  mechanics: {
    progression: {
      proficiencyBonusTable: CHARACTER_PROFICIENCY_BONUS_TABLE,
    },
  },
} as unknown as Ruleset

describe('getCharacterSpellcastingStats', () => {
  it('computes spell save DC and attack bonus from primary class ability', () => {
    const character = {
      level: 5,
      classes: [{
        classId: 'wizard',
        level: 5,
        className: 'Wizard',
        progression: {
          hitDie: 6,
          spellcasting: 'full',
          spellProgression: { ability: 'intelligence', type: 'prepared' },
        },
      }],
      abilityScores: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 16,
        wisdom: 10,
        charisma: 10,
      },
    } as CharacterDetailDto

    const stats = getCharacterSpellcastingStats(character, TEST_RULESET)

    expect(stats.spellAttackBonus).toBe(6)
    expect(stats.spellSaveDc).toBe(14)
  })

  it('uses charisma for sorcerer', () => {
    const character = {
      level: 3,
      classes: [{
        classId: 'sorcerer',
        level: 3,
        className: 'Sorcerer',
        progression: {
          hitDie: 6,
          spellcasting: 'full',
          spellProgression: { ability: 'charisma', type: 'known' },
        },
      }],
      abilityScores: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 10,
        wisdom: 10,
        charisma: 18,
      },
    } as CharacterDetailDto

    const stats = getCharacterSpellcastingStats(character, TEST_RULESET)

    expect(stats.spellAttackBonus).toBe(6)
    expect(stats.spellSaveDc).toBe(14)
  })
})
