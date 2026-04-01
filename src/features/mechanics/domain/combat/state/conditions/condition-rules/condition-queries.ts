import type { AbilityRef } from '@/features/mechanics/domain/character'
import type { EffectConditionId } from '@/features/mechanics/domain/effects/effects.types'
import type { CombatantInstance } from '../../types'
import type {
  ConditionConsequence,
  AttackModConsequence,
  SaveModConsequence,
  DamageInteractionConsequence,
  SourceRelativeConsequence,
  BattlefieldAbsenceConsequence,
} from './condition-consequences.types'
import { CONDITION_RULES } from './condition-definitions'
import { ENGINE_STATE_RULES } from './engine-state-definitions'

function getActiveCoreConditionIds(combatant: CombatantInstance): EffectConditionId[] {
  const knownIds = new Set<string>(Object.keys(CONDITION_RULES))
  return combatant.conditions
    .filter((m) => knownIds.has(m.label))
    .map((m) => m.label as EffectConditionId)
}

/** Active engine-state rule ids from `combatant.states` (labels matching {@link ENGINE_STATE_RULES}). */
export function getActiveEngineStateRuleIds(combatant: CombatantInstance): string[] {
  const knownIds = new Set<string>(Object.keys(ENGINE_STATE_RULES))
  return combatant.states.filter((m) => knownIds.has(m.label)).map((m) => m.label)
}

export function getActiveConsequences(combatant: CombatantInstance): ConditionConsequence[] {
  const fromConditions = getActiveCoreConditionIds(combatant).flatMap(
    (id) => CONDITION_RULES[id].consequences,
  )
  const fromEngineStates = getActiveEngineStateRuleIds(combatant).flatMap(
    (id) => ENGINE_STATE_RULES[id].consequences,
  )
  return [...fromConditions, ...fromEngineStates]
}

export type ConsequenceWithOrigin = {
  /** Rule id: core SRD condition id or engine-state id (e.g. `banished`). */
  ruleId: string
  source: 'condition' | 'engine_state'
  consequence: ConditionConsequence
}

export function getActiveConsequencesWithOrigin(
  combatant: CombatantInstance,
): ConsequenceWithOrigin[] {
  const fromConditions = getActiveCoreConditionIds(combatant).flatMap((id) =>
    CONDITION_RULES[id].consequences.map((consequence) => ({
      ruleId: id,
      source: 'condition' as const,
      consequence,
    })),
  )
  const fromEngineStates = getActiveEngineStateRuleIds(combatant).flatMap((id) =>
    ENGINE_STATE_RULES[id].consequences.map((consequence) => ({
      ruleId: id,
      source: 'engine_state' as const,
      consequence,
    })),
  )
  return [...fromConditions, ...fromEngineStates]
}

export function hasBattlefieldAbsenceConsequence(
  combatant: CombatantInstance,
  presenceReason?: BattlefieldAbsenceConsequence['presenceReason'],
): boolean {
  return getActiveConsequences(combatant).some(
    (c): c is BattlefieldAbsenceConsequence =>
      c.kind === 'battlefield_absence' &&
      c.absentFromBattlefield &&
      (presenceReason == null || c.presenceReason === presenceReason),
  )
}

/** Precedence: banished over off-grid when both are present. */
export function getBattlefieldPresenceSkipReason(
  combatant: CombatantInstance,
): 'banished' | 'off-grid' | undefined {
  let offGrid = false
  for (const c of getActiveConsequences(combatant)) {
    if (c.kind !== 'battlefield_absence' || !c.absentFromBattlefield) continue
    if (c.presenceReason === 'banished') return 'banished'
    if (c.presenceReason === 'off-grid') offGrid = true
  }
  return offGrid ? 'off-grid' : undefined
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

/** State marker label from the See Invisibility spell (`stateId: 'see-invisibility'`). */
const SEE_INVISIBILITY_STATE_LABEL = 'see-invisibility'

function combatantHasStateLabel(combatant: CombatantInstance, stateLabel: string): boolean {
  return combatant.states.some((m) => m.label === stateLabel)
}

/**
 * Whether an attack_mod from a condition counts toward this attack roll.
 * Suppresses invisible-related adv/disadv when the other combatant has See Invisibility.
 */
export function shouldCountAttackModForAttackRoll(
  ruleId: string,
  consequence: AttackModConsequence,
  _bearer: CombatantInstance,
  counterpart: CombatantInstance,
  attackRange: 'melee' | 'ranged',
): boolean {
  if (consequence.kind !== 'attack_mod') return false
  if (consequence.appliesTo !== 'incoming' && consequence.appliesTo !== 'outgoing') return false
  if (consequence.range && consequence.range !== 'any' && consequence.range !== attackRange) return false
  if (ruleId === 'invisible') {
    if (consequence.appliesTo === 'incoming' && combatantHasStateLabel(counterpart, SEE_INVISIBILITY_STATE_LABEL)) {
      return false
    }
    if (consequence.appliesTo === 'outgoing' && combatantHasStateLabel(counterpart, SEE_INVISIBILITY_STATE_LABEL)) {
      return false
    }
  }
  return true
}

function collectAttackModsWithPairContext(
  bearer: CombatantInstance,
  counterpart: CombatantInstance,
  appliesTo: 'incoming' | 'outgoing',
  range: 'melee' | 'ranged',
): ('advantage' | 'disadvantage')[] {
  const mods: ('advantage' | 'disadvantage')[] = []
  for (const { ruleId, consequence } of getActiveConsequencesWithOrigin(bearer)) {
    if (consequence.kind !== 'attack_mod' || consequence.appliesTo !== appliesTo) continue
    if (!shouldCountAttackModForAttackRoll(ruleId, consequence, bearer, counterpart, range)) continue
    mods.push(consequence.modifier)
  }
  return mods
}

/** Incoming attack modifiers on `defender` for an attack from `attacker` (pair-aware: See Invisibility vs invisible). */
export function getIncomingAttackModifiersForAttack(
  attacker: CombatantInstance,
  defender: CombatantInstance,
  range: 'melee' | 'ranged',
): ('advantage' | 'disadvantage')[] {
  return collectAttackModsWithPairContext(defender, attacker, 'incoming', range)
}

/** Outgoing attack modifiers on `attacker` against `defender` (pair-aware: See Invisibility vs invisible). */
export function getOutgoingAttackModifiersForAttack(
  attacker: CombatantInstance,
  defender: CombatantInstance,
  range: 'melee' | 'ranged',
): ('advantage' | 'disadvantage')[] {
  return collectAttackModsWithPairContext(attacker, defender, 'outgoing', range)
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

export function getDamageResistanceFromConditions(
  combatant: CombatantInstance,
  damageType?: string,
): 'resistance' | 'vulnerability' | null {
  const consequences = getActiveConsequences(combatant)
  const match = consequences.find(
    (c): c is DamageInteractionConsequence =>
      c.kind === 'damage_interaction' &&
      (c.damageType === 'all' || (!!damageType && c.damageType === damageType.trim().toLowerCase())),
  )
  return match?.modifier ?? null
}

export function incomingHitBecomesCrit(combatant: CombatantInstance, distanceFt?: number): boolean {
  if (distanceFt == null) return false
  return getActiveConsequences(combatant).some(
    (c) => c.kind === 'crit_window' && c.becomeCritical && distanceFt <= c.incomingMeleeWithinFt,
  )
}

// ---------------------------------------------------------------------------
// Source-aware condition queries
// ---------------------------------------------------------------------------

export function getConditionSourceIds(
  combatant: CombatantInstance,
  conditionLabel: string,
): string[] {
  return combatant.conditions
    .filter((m) => m.label === conditionLabel && m.sourceInstanceId)
    .map((m) => m.sourceInstanceId!)
}

export function hasConditionFromSource(
  combatant: CombatantInstance,
  conditionLabel: string,
  sourceId: string,
): boolean {
  return combatant.conditions.some(
    (m) => m.label === conditionLabel && m.sourceInstanceId === sourceId,
  )
}

export type SourceRelativeRestriction = {
  sourceId: string
  cannotAttackSource: boolean
  cannotMoveCloserToSource: boolean
}

export function getSourceRelativeRestrictions(
  actor: CombatantInstance,
): SourceRelativeRestriction[] {
  const knownIds = new Set<string>(Object.keys(CONDITION_RULES))
  const restrictions: SourceRelativeRestriction[] = []

  for (const marker of actor.conditions) {
    if (!marker.sourceInstanceId || !knownIds.has(marker.label)) continue

    const rule = CONDITION_RULES[marker.label as EffectConditionId]
    const srcConsequences = rule.consequences.filter(
      (c): c is SourceRelativeConsequence => c.kind === 'source_relative',
    )
    if (srcConsequences.length === 0) continue

    restrictions.push({
      sourceId: marker.sourceInstanceId,
      cannotAttackSource: srcConsequences.some((c) => c.cannotAttackSource === true),
      cannotMoveCloserToSource: srcConsequences.some((c) => c.cannotMoveCloserToSource === true),
    })
  }

  return restrictions
}

export function cannotTargetWithHostileAction(
  actor: CombatantInstance,
  targetId: string,
): boolean {
  return getSourceRelativeRestrictions(actor).some(
    (r) => r.cannotAttackSource && r.sourceId === targetId,
  )
}

// ---------------------------------------------------------------------------
// Visibility / speech / awareness seams
// ---------------------------------------------------------------------------

export function canSpeak(combatant: CombatantInstance): boolean {
  return !getActiveConsequences(combatant).some(
    (c) => c.kind === 'speech' && c.cannotSpeak,
  )
}

export function isAwareOfSurroundings(combatant: CombatantInstance): boolean {
  return !getActiveConsequences(combatant).some(
    (c) => c.kind === 'awareness' && c.unawareOfSurroundings,
  )
}

export function canSee(combatant: CombatantInstance): boolean {
  return !getActiveConsequences(combatant).some(
    (c) => c.kind === 'visibility' && c.cannotSee,
  )
}
