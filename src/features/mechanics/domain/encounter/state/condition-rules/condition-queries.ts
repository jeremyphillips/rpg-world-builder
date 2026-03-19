import type { AbilityRef } from '@/features/mechanics/domain/character'
import type { EffectConditionId } from '@/features/mechanics/domain/effects/effects.types'
import type { CombatantInstance } from '../types'
import type { ConditionConsequence, AttackModConsequence, SaveModConsequence } from './condition-consequences.types'
import { CONDITION_RULES } from './condition-definitions'

function getActiveConditionIds(combatant: CombatantInstance): EffectConditionId[] {
  const knownIds = new Set<string>(Object.keys(CONDITION_RULES))
  return combatant.conditions
    .filter((m) => knownIds.has(m.label))
    .map((m) => m.label as EffectConditionId)
}

export function getActiveConsequences(combatant: CombatantInstance): ConditionConsequence[] {
  return getActiveConditionIds(combatant).flatMap(
    (id) => CONDITION_RULES[id].consequences,
  )
}

export function canTakeActions(combatant: CombatantInstance): boolean {
  return !getActiveConsequences(combatant).some(
    (c) => c.kind === 'action_limit' && c.cannotTakeActions,
  )
}

export function canTakeReactions(combatant: CombatantInstance): boolean {
  return !getActiveConsequences(combatant).some(
    (c) => c.kind === 'action_limit' && c.cannotTakeReactions,
  )
}

export function getSpeedConsequences(combatant: CombatantInstance): {
  speedBecomesZero: boolean
  standUpCostsHalfMovement: boolean
} {
  const consequences = getActiveConsequences(combatant)
  return {
    speedBecomesZero: consequences.some(
      (c) => c.kind === 'movement' && c.speedBecomesZero,
    ),
    standUpCostsHalfMovement: consequences.some(
      (c) => c.kind === 'movement' && c.standUpCostsHalfMovement,
    ),
  }
}

function collectAttackMods(
  consequences: ConditionConsequence[],
  appliesTo: 'incoming' | 'outgoing',
  range: 'melee' | 'ranged',
): ('advantage' | 'disadvantage')[] {
  return consequences
    .filter(
      (c): c is AttackModConsequence =>
        c.kind === 'attack_mod' &&
        c.appliesTo === appliesTo &&
        (!c.range || c.range === 'any' || c.range === range),
    )
    .map((c) => c.modifier)
}

export function getIncomingAttackModifiers(
  combatant: CombatantInstance,
  range: 'melee' | 'ranged',
): ('advantage' | 'disadvantage')[] {
  return collectAttackMods(getActiveConsequences(combatant), 'incoming', range)
}

export function getOutgoingAttackModifiers(
  combatant: CombatantInstance,
  range: 'melee' | 'ranged',
): ('advantage' | 'disadvantage')[] {
  return collectAttackMods(getActiveConsequences(combatant), 'outgoing', range)
}

function collectSaveMods(
  consequences: ConditionConsequence[],
  ability: AbilityRef,
): SaveModConsequence[] {
  return consequences.filter(
    (c): c is SaveModConsequence =>
      c.kind === 'save_mod' && c.abilities.includes(ability),
  )
}

export function autoFailsSave(combatant: CombatantInstance, ability: AbilityRef): boolean {
  return collectSaveMods(getActiveConsequences(combatant), ability).some(
    (c) => c.modifier === 'auto_fail',
  )
}

export function getSaveModifiersFromConditions(
  combatant: CombatantInstance,
  ability: AbilityRef,
): ('advantage' | 'disadvantage')[] {
  return collectSaveMods(getActiveConsequences(combatant), ability)
    .filter((c): c is SaveModConsequence & { modifier: 'advantage' | 'disadvantage' } =>
      c.modifier === 'advantage' || c.modifier === 'disadvantage',
    )
    .map((c) => c.modifier)
}
