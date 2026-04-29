import type { StatTarget } from '../types'
import type { EffectBase } from '../../effects/effects.types'
import type { EvaluationContext } from '../../conditions/evaluation-context.types'
import { getAbilityModifier } from '../../abilities/getAbilityModifier'
import {
  resolveProficiencyContribution,
  type ResolvedProficiencyMode,
} from '@/features/mechanics/domain/progression'
import type { AbilityKey, AbilityId } from '../../character'
import { abilityIdToKey } from '../../character/abilities/abilities.utils'

export type FormulaDefinition = {
  base?: number
  ability?: 
    | AbilityKey // @deprecated('Use AbilityId instead')
    | AbilityId
  abilities?: 
    | AbilityKey[] // @deprecated('Use AbilityId[] instead')
    | AbilityId[]
  /** Cap ability contribution (e.g. medium armor: min(dex, 2)) */
  maxAbilityContribution?: number
  proficiency?: true | { mode?: ResolvedProficiencyMode; bonus?: number }
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

  const baseBonus = context.self.proficiencyBonus ?? 0

  if (proficiency === true) {
    return {
      value: resolveProficiencyContribution(baseBonus, 'proficient'),
      label: 'Prof',
    }
  }

  const mode: ResolvedProficiencyMode = proficiency.mode ?? 'proficient'
  const bonus = proficiency.bonus ?? baseBonus

  return {
    value: resolveProficiencyContribution(bonus, mode),
    label: mode === 'proficient' && bonus === baseBonus ? 'Prof' : `Prof (${mode}, ${bonus})`,
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
    let mod = getAbilityModifier(context.self, abilityIdToKey(formula.ability))
    if (formula.maxAbilityContribution !== undefined) {
      mod = Math.min(mod, formula.maxAbilityContribution)
    }
    value += mod
  }

  if (formula.abilities) {
    value += formula.abilities.reduce(
      (sum, ability) =>
        sum + getAbilityModifier(context.self, abilityIdToKey(ability)),
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
