import type { CharacterBuilderState } from '@/features/characterBuilder/types'
import type { InvalidationRule, InvalidationResult, StepInvalidation, Trigger } from './types'

/**
 * Evaluate whether a single trigger has fired.
 *
 * - String triggers use shallow `!==` (fast path for primitives).
 * - Function triggers receive both states and return a boolean,
 *   enabling semantic comparison for arrays / objects.
 */
function triggerFired(
  trigger: Trigger,
  prev: CharacterBuilderState,
  next: CharacterBuilderState,
): boolean {
  if (typeof trigger === 'function') return trigger(prev, next)
  return prev[trigger] !== next[trigger]
}

/**
 * Run every applicable rule against a prev → next state transition.
 *
 * Returns machine-readable `InvalidationItem[]` per affected step.
 * UI is responsible for turning items into display strings.
 */
export function detectInvalidations(
  rules: InvalidationRule[],
  prev: CharacterBuilderState,
  next: CharacterBuilderState
): InvalidationResult {
  const affected: StepInvalidation[] = []

  for (const rule of rules) {
    const triggered = rule.triggers.some(t => triggerFired(t, prev, next))
    if (!triggered) continue

    const items = rule.detect(prev, next)
    if (items.length > 0) {
      affected.push({
        ruleId: rule.id,
        stepId: rule.affectedStep,
        label: rule.label,
        items,
      })
    }
  }

  return { hasInvalidations: affected.length > 0, affected }
}
