import type { CharacterBuilderState } from '@/features/characterBuilder/types'
import type { InvalidationRule, InvalidationResult } from './types'

/**
 * Walk through every triggered invalidation and call the corresponding
 * rule's `resolve()` to strip invalid data from the state.
 *
 * Rules are applied in order; each resolver receives the output of the
 * previous one, so resolutions compose cleanly.
 */
export function resolveInvalidations(
  rules: InvalidationRule[],
  state: CharacterBuilderState,
  result: InvalidationResult
): CharacterBuilderState {
  let resolved = state

  for (const inv of result.affected) {
    const rule = rules.find(r => r.id === inv.ruleId)
    if (!rule) continue
    resolved = rule.resolve(resolved, inv.items)
  }

  return resolved
}
