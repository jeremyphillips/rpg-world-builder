import type { EvaluationContext } from '../../conditions/evaluation-context.types'
import type { ModifierEffect } from '../../effects/effects.types'
import type { BreakdownToken } from '../types'

function sign(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

export function sourceToLabel(source: string | undefined): string {
  if (!source) return 'Bonus'
  const parts = source.split(':')
  const id = parts[parts.length - 1]
  return id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

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
