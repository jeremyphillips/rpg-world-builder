import type { CharacterDetailDto } from '@/features/character/read-model'
import type { MechanicsRules } from '@/shared/types/ruleset'
import { findCharacterSpellcastingClassEntry, getSpellcastingAbility, getSpellSaveDc, getSpellAttackBonus } from '@/features/mechanics/domain/spellcasting'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import { resolveProficiencyBonusAtLevel } from '@/features/mechanics/domain/progression'

export function getCharacterSpellcastingStats(
  character: CharacterDetailDto,
  ruleset: { mechanics: MechanicsRules },
): {
  spellSaveDc: number
  spellAttackBonus: number
  spellcastingAbilityModifier: number
} {
  const spellcastingClass = findCharacterSpellcastingClassEntry(character)
  const abilityKey = getSpellcastingAbility(character)
  const abilityScore = abilityKey ? character.abilityScores?.[abilityKey] ?? 10 : 10
  const abilityMod = getAbilityModifier(abilityScore)
  const profBonus = resolveProficiencyBonusAtLevel({
    level: spellcastingClass?.level ?? 1,
    ruleset,
  })

  return {
    spellSaveDc: getSpellSaveDc(profBonus, abilityMod),
    spellAttackBonus: getSpellAttackBonus(profBonus, abilityMod),
    spellcastingAbilityModifier: abilityMod,
  }
}
