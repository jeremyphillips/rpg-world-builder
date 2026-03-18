import type { EvaluationContext } from '../../conditions/evaluation-context.types'
import type { ModifierEffect } from '../../effects/effects.types'
import type { BreakdownToken } from '../types'
import { getSourceLabel } from '../../effects/source'

function sign(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

/** @deprecated Use `getSourceLabel` from `effects/source` directly. */
export const sourceToLabel = getSourceLabel

export function resolveModifierValue(
  mod: ModifierEffect,
  context: EvaluationContext
): number {
  const val = mod.value
  if (typeof val === 'number') return val
  if (typeof val === 'object' && val?.perLevel) return val.perLevel * context.self.level
  if (typeof val === 'object' && val?.ability) {
    return context.self.abilities[val.ability] ?? 0
  }
  return 0
}

export function buildModifierToken(
  mod: ModifierEffect,
  context: EvaluationContext
): BreakdownToken {
  const modValue = resolveModifierValue(mod, context)
  return { label: sourceToLabel(mod.source), value: sign(modValue), type: 'modifier' }
}
