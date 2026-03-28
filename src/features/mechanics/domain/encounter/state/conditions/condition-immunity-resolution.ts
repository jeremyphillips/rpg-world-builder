import { evaluateCondition } from '@/features/mechanics/domain/conditions/evaluateCondition'
import type { ConditionImmunityId } from '@/features/mechanics/domain/conditions/effect-condition-definitions'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import { combatantToCreatureSnapshot } from '../combatants/combatant-evaluation-snapshot'
import type { CombatantInstance } from '../types'

function isConditionImmunityGrantEffect(
  e: Effect,
): e is Extract<Effect, { kind: 'grant'; grantType: 'condition-immunity' }> {
  return e.kind === 'grant' && e.grantType === 'condition-immunity'
}

/**
 * Unconditional `conditionImmunities` **or** a matching active `grant` + `condition-immunity`
 * whose optional scope (`effect.condition`) evaluates true for this target + applying source.
 * Does not fold scoped grants into the flat array — reads `activeEffects` only.
 */
export function isImmuneToConditionIncludingScopedGrants(
  target: CombatantInstance,
  conditionId: string,
  applying: CombatantInstance | undefined,
): boolean {
  if (target.conditionImmunities?.includes(conditionId as ConditionImmunityId)) {
    return true
  }
  if (!applying) {
    return false
  }

  const selfSnap = combatantToCreatureSnapshot(target)
  const sourceSnap = combatantToCreatureSnapshot(applying)

  for (const effect of target.activeEffects) {
    if (!isConditionImmunityGrantEffect(effect)) continue
    if (effect.value !== conditionId) continue

    if (!effect.condition) {
      return true
    }

    if (
      evaluateCondition(effect.condition, {
        self: selfSnap,
        source: sourceSnap,
      })
    ) {
      return true
    }
  }

  return false
}
