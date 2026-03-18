import type { Ruleset } from '@/shared/types/ruleset'
import { resolveCharacterLevel } from '../character/resolveCharacterLevel'
import { resolveProficiencyBonusAtLevel } from './resolveProficiencyBonusAtLevel'

type RulesetWithMechanics = Pick<Ruleset, 'mechanics'>

/**
 * Resolves the proficiency bonus for a (possibly multiclass) character
 * by summing class levels and looking up the ruleset table.
 */
export function resolveCharacterProficiencyBonus(params: {
  classEntries: Array<{ level: number }>
  ruleset: RulesetWithMechanics
}): number {
  const level = resolveCharacterLevel(params.classEntries)
  return resolveProficiencyBonusAtLevel({ level, ruleset: params.ruleset })
}
