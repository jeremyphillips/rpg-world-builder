import type { EvaluationContext } from '../../conditions/evaluation-context.types'
import type { Effect, ModifierEffect } from '../../effects/effects.types'
import { evaluateCondition } from '../engines/condition.engine'
import { resolveFormulaProficiency, resolveFormulaValue } from '../engines/formula.engine'
import type { FormulaEffect, FormulaDefinition } from '../engines/formula.engine'
import { resolveModifierValue, buildModifierToken, sourceToLabel } from '../engines/modifier.engine'
import { getBaseStat } from './base-stat-resolver'
import { getAbilityModifier } from '../../abilities/getAbilityModifier'
import type { StatTarget, BreakdownToken, StatResult } from '../types'

// Re-export types for consumers
export type { StatTarget, AbilityScoreTarget } from '../types'
export type { BreakdownToken, StatResult }

// ---------------------------------------------------------------------------
// Breakdown formatting
// ---------------------------------------------------------------------------

export function formatBreakdown(tokens: BreakdownToken[]): string {
  return tokens.map((t) => `${t.value} ${t.label}`).join('  ')
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sign(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

function isFormulaEffectForTarget(e: Effect, target: StatTarget): boolean {
  return (
    e != null &&
    typeof e === 'object' &&
    'kind' in e &&
    e.kind === 'formula' &&
    'target' in e &&
    e.target === target &&
    'formula' in e
  )
}

function isModifierEffectForTarget(e: Effect, target: StatTarget): boolean {
  return (
    e != null &&
    typeof e === 'object' &&
    'kind' in e &&
    e.kind === 'modifier' &&
    'target' in e &&
    e.target === target
  )
}

// ---------------------------------------------------------------------------
// Breakdown builders
// ---------------------------------------------------------------------------

function buildBaseTokens(
  target: StatTarget,
  context: EvaluationContext
): BreakdownToken[] {
  switch (target) {
    case 'armor_class': {
      const dexMod = getAbilityModifier(context.self, 'dexterity')
      const tokens: BreakdownToken[] = [
        { label: 'Base', value: '10', type: 'formula' },
      ]
      if (dexMod !== 0) {
        tokens.push({ label: 'DEX', value: sign(dexMod), type: 'ability' })
      }
      return tokens
    }
    case 'initiative': {
      const dexMod = getAbilityModifier(context.self, 'dexterity')
      return [{ label: 'DEX', value: sign(dexMod), type: 'ability' }]
    }
    case 'hit_points_max':
      return [{ label: 'Base HP', value: String(getBaseStat(target, context)), type: 'formula' }]
    default:
      return [{ label: 'Base', value: String(getBaseStat(target, context)), type: 'formula' }]
  }
}

function buildFormulaTokens(
  effect: FormulaEffect,
  context: EvaluationContext
): BreakdownToken[] {
  const formula: FormulaDefinition = effect.formula as FormulaDefinition
  const source = effect.source
  const tokens: BreakdownToken[] = []

  if (formula.base !== undefined) {
    tokens.push({ label: sourceToLabel(source), value: String(formula.base), type: 'formula' })
  }

  if (formula.ability) {
    let mod = getAbilityModifier(context.self, formula.ability)
    const abilityLabel = formula.ability.slice(0, 3).toUpperCase()
    if (formula.maxAbilityContribution !== undefined) {
      mod = Math.min(mod, formula.maxAbilityContribution)
      tokens.push({ label: `${abilityLabel} (max ${formula.maxAbilityContribution})`, value: sign(mod), type: 'ability' })
    } else if (mod !== 0) {
      tokens.push({ label: abilityLabel, value: sign(mod), type: 'ability' })
    }
  }

  if (formula.abilities) {
    for (const ability of formula.abilities) {
      const mod = getAbilityModifier(context.self, ability)
      if (mod !== 0) {
        tokens.push({ label: ability.slice(0, 3).toUpperCase(), value: sign(mod), type: 'ability' })
      }
    }
  }

  if (formula.proficiency) {
    const proficiency = resolveFormulaProficiency(formula.proficiency, context)
    tokens.push({
      label: proficiency.label,
      value: sign(proficiency.value),
      type: 'proficiency',
    })
  }

  if (formula.perLevel) {
    const bonus = context.self.level * formula.perLevel
    tokens.push({ label: `${formula.perLevel}/lvl`, value: sign(bonus), type: 'modifier' })
  }

  return tokens
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a stat from context and effects.
 *
 * Generic flow:
 * 1. base = getBaseStat(target, context)
 * 2. If formula effects exist, use max(formulas) instead of base
 * 3. Apply additive modifier effects
 * 4. Return result
 */
export function resolveStat(
  target: StatTarget,
  context: EvaluationContext,
  effects: Effect[]
): number {
  return resolveStatDetailed(target, context, effects).value
}

/**
 * Resolve a stat and return both the value and a structured breakdown
 * explaining how the value was computed.
 */
export function resolveStatDetailed(
  target: StatTarget,
  context: EvaluationContext,
  effects: Effect[]
): StatResult {
  const base = getBaseStat(target, context)

  const applicable = effects.filter(e => {
    const cond = 'condition' in e ? (e as { condition?: unknown }).condition : undefined
    if (!cond) return true
    return evaluateCondition(cond as import('../../conditions/condition.types').Condition, context)
  })

  const formulaEffects = applicable.filter((e) =>
    isFormulaEffectForTarget(e, target)
  ) as FormulaEffect[]

  const modifierEffects = applicable.filter((e) =>
    isModifierEffectForTarget(e, target)
  ) as ModifierEffect[]

  const breakdown: BreakdownToken[] = []

  let value: number
  if (formulaEffects.length > 0) {
    const resolved = formulaEffects.map((e) => ({
      effect: e,
      value: resolveFormulaValue(e, context),
    }))
    const winner = resolved.reduce((best, curr) =>
      curr.value > best.value ? curr : best
    )
    value = winner.value
    breakdown.push(...buildFormulaTokens(winner.effect, context))
  } else {
    value = base
    breakdown.push(...buildBaseTokens(target, context))
  }

  for (const mod of modifierEffects) {
    if (mod.mode === 'add') {
      const modValue = resolveModifierValue(mod, context)
      value += modValue
      if (modValue !== 0) {
        breakdown.push(buildModifierToken(mod, context))
      }
    }
  }

  const setMods = modifierEffects.filter(m => m.mode === 'set')
  if (setMods.length > 0) {
    const lastSet = setMods[setMods.length - 1]
    value = resolveModifierValue(lastSet, context)
    breakdown.length = 0
    breakdown.push({
      label: sourceToLabel(lastSet.source),
      value: String(value),
      type: 'modifier',
    })
  }

  for (const mod of modifierEffects) {
    if (mod.mode === 'multiply') {
      const mult = resolveModifierValue(mod, context)
      value = Math.floor(value * mult)
      breakdown.push({
        label: sourceToLabel(mod.source),
        value: `×${mult}`,
        type: 'modifier',
      })
    }
  }

  return { value, breakdown }
}
