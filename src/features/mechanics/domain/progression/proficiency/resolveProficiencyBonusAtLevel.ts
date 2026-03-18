import type { Ruleset } from '@/shared/types/ruleset'
import { getProficiencyAttackBonus } from './getProficiencyAttackBonus'

/**
 * Resolves the proficiency bonus for a character at the given level,
 * using the ruleset's proficiency bonus table when available.
 */
export function resolveProficiencyBonusAtLevel(params: {
  level: number
  ruleset: Ruleset
}): number {
  const table = params.ruleset.mechanics.progression.proficiencyBonusTable
  if (params.level <= 0) return 0
  if (table) {
    const tier = table.find(
      (t) => params.level >= t.levelRange[0] && params.level <= t.levelRange[1]
    )
    if (tier) return tier.bonus
  }
  return getProficiencyAttackBonus(params.level)
}
