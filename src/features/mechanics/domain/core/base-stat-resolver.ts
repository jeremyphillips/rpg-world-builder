import type { StatTarget } from '../resolution/stat-resolver'
import type { EvaluationContext } from '../conditions/evaluation-context.types'
import { getAbilityModifier } from './ability.utils'
import { calculateBaseHitPoints } from './progression/hit-points'

/**
 * Compute the unmodified base value for a stat.
 * No effects, no formulas — just the starting value before anything is applied.
 *
 * Extend this switch to add new stats.
 */
export function getBaseStat(
  target: StatTarget,
  context: EvaluationContext
): number {
  switch (target) {
    case 'armor_class':
      return 10 + getAbilityModifier(context.self, 'dexterity')

    case 'hp_max':
      return calculateBaseHitPoints(
        context.self.level,
        context.self.hitDie ?? 8,
        context.self.abilities.constitution
      )

    case 'initiative':
      return getAbilityModifier(context.self, 'dexterity')

    case 'strength':
    case 'dexterity':
    case 'constitution':
    case 'intelligence':
    case 'wisdom':
    case 'charisma':
      return context.self.abilities[target] ?? 10

    default:
      return 0
  }
}
