import type { StatTarget } from "./stat-resolver"
import type { EffectBase } from "../effects/effects.types"
import type { AbilityScores } from "@/shared/types/character.core"
import type { EvaluationContext } from "../conditions/evaluation-context.types"
import { getAbilityModifier } from "../core"
import { getProficiencyAttackBonus } from "@/features/mechanics/domain/character/progression"

// Responsible for:
//   - Evaluating formula definitions
//   - Returning candidate values
//   - Choosing which formula wins

// It does not know about:
//   - Modifiers
//   - Stacking
//   - Combat
//   - Features

export type FormulaDefinition = {
  base?: number
  ability?: keyof AbilityScores
  abilities?: (keyof AbilityScores)[]
  /** Cap ability contribution (e.g. medium armor: min(dex, 2)) */
  maxAbilityContribution?: number
  proficiency?: boolean
  perLevel?: number
}

export type FormulaEffect = EffectBase<'formula'> & {
  target: StatTarget;
  formula: FormulaDefinition;
};

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
    value += getProficiencyAttackBonus(context.self.level)
  }

  if (formula.perLevel) {
    value += context.self.level * formula.perLevel
  }

  return value
}
