import type { StatTarget } from '../types'
import type { EffectBase } from '../../effects/effects.types'
import type { EvaluationContext } from '../../conditions/evaluation-context.types'
import { getAbilityModifier } from '../../core'
import { getProficiencyAttackBonus } from '@/features/mechanics/domain/progression'
import type { AbilityKey } from '../../character'

export type FormulaDefinition = {
  base?: number
  ability?: AbilityKey
  abilities?: AbilityKey[]
  /** Cap ability contribution (e.g. medium armor: min(dex, 2)) */
  maxAbilityContribution?: number
  proficiency?: true | { level?: number; bonus?: number }
  perLevel?: number
}

export type FormulaEffect = EffectBase<'formula'> & {
  target: StatTarget
  formula: FormulaDefinition
}

export function resolveFormulaProficiency(
  proficiency: FormulaDefinition['proficiency'],
  context: EvaluationContext
): { value: number; label: string } {
  if (!proficiency) {
    return { value: 0, label: 'Prof' }
  }

  if (proficiency === true) {
    return {
      value: getProficiencyAttackBonus(context.self.level),
      label: 'Prof',
    }
  }

  const level = proficiency.level ?? 1
  const bonus = proficiency.bonus ?? 2

  return {
    value: level * bonus,
    label: level === 1 && bonus === 2 ? 'Prof' : `Prof (${level}x${bonus})`,
  }
}

export function resolveFormulaValue(
  effect: FormulaEffect,
  context: EvaluationContext
): number {
  const { formula } = effect
  let value = 0

  if (formula.base !== undefined) {
    value += formula.base
  }

  if (formula.ability) {
    let mod = getAbilityModifier(context.self, formula.ability)
    if (formula.maxAbilityContribution !== undefined) {
      mod = Math.min(mod, formula.maxAbilityContribution)
    }
    value += mod
  }

  if (formula.abilities) {
    value += formula.abilities.reduce(
      (sum, ability) =>
        sum + getAbilityModifier(context.self, ability),
      0
    )
  }

  if (formula.proficiency) {
    value += resolveFormulaProficiency(formula.proficiency, context).value
  }

  if (formula.perLevel) {
    value += context.self.level * formula.perLevel
  }

  return value
}
