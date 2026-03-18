import type { Ruleset } from '@/shared/types/ruleset'

type RulesetWithMechanics = Pick<Ruleset, 'mechanics'>

/**
 * Resolves the proficiency bonus for a creature at the given level,
 * using the ruleset's proficiency bonus table.
 *
 * Falls back to the 5e formula (ceil(level/4)+1) when no table is defined.
 */
export function resolveProficiencyBonusAtLevel(params: {
  level: number
  ruleset: RulesetWithMechanics
}): number {
  if (params.level <= 0) return 0

  const table = params.ruleset.mechanics.progression.proficiencyBonusTable
  if (table) {
    const tier = table.find(
      (t) => params.level >= t.levelRange[0] && params.level <= t.levelRange[1]
    )
    if (tier) return tier.bonus
  }

  return Math.ceil(params.level / 4) + 1
}
