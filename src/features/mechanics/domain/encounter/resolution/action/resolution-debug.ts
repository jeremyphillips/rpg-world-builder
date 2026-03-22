import type { AbilityRef } from '../../../character'
import type { D20RollMode } from '../../../resolution/engines/dice.engine'
import type { EffectConditionId } from '../../../effects/effects.types'
import type { CombatantInstance, RollModifierMarker } from '../../state/types'
import type { CombatActionCost } from '../combat-action.types'
import type { ConditionConsequence, SaveModConsequence, DamageInteractionConsequence } from '../../state/condition-rules'
import {
  CONDITION_RULES,
  getActiveConsequencesWithOrigin,
  canTakeActions,
  canTakeReactions,
  getSpeedConsequences,
  shouldCountAttackModForAttackRoll,
} from '../../state/condition-rules'

export function formatAttackRollDebug(
  attacker: CombatantInstance,
  defender: CombatantInstance,
  attackerMarkers: RollModifierMarker[],
  defenderMarkers: RollModifierMarker[],
  attackRange: 'melee' | 'ranged',
  rollMod: D20RollMode,
): string[] {
  const lines: string[] = [`roll mode: ${rollMod}`]

  for (const m of attackerMarkers) {
    lines.push(`  ${m.label} -> outgoing ${m.modifier}`)
  }
  for (const m of defenderMarkers) {
    lines.push(`  ${m.label} -> incoming ${m.modifier}`)
  }

  for (const { conditionId, consequence: c } of getActiveConsequencesWithOrigin(attacker)) {
    if (c.kind !== 'attack_mod' || c.appliesTo !== 'outgoing') continue
    if (!shouldCountAttackModForAttackRoll(conditionId, c, attacker, defender, attackRange)) continue
    const rangeSuffix = c.range && c.range !== 'any' ? ` (${c.range})` : ''
    lines.push(`  ${conditionId} -> outgoing attack ${c.modifier}${rangeSuffix}`)
  }

  for (const { conditionId, consequence: c } of getActiveConsequencesWithOrigin(defender)) {
    if (c.kind !== 'attack_mod' || c.appliesTo !== 'incoming') continue
    if (!shouldCountAttackModForAttackRoll(conditionId, c, defender, attacker, attackRange)) continue
    const rangeSuffix = c.range && c.range !== 'any' ? ` (${c.range})` : ''
    lines.push(`  ${conditionId} -> incoming attack ${c.modifier}${rangeSuffix}`)
  }

  return lines
}

export function formatAutoFailDebug(
  combatant: CombatantInstance,
  ability: AbilityRef,
): string[] {
  const sources = getActiveConsequencesWithOrigin(combatant)
    .filter(
      (e): e is { conditionId: typeof e.conditionId; consequence: SaveModConsequence } =>
        e.consequence.kind === 'save_mod' &&
        e.consequence.modifier === 'auto_fail' &&
        (e.consequence as SaveModConsequence).abilities.includes(ability),
    )
    .map((e) => `${e.conditionId} -> auto-fail ${(e.consequence as SaveModConsequence).abilities.map((a) => a.toUpperCase()).join('/')} saves`)

  return sources.length > 0
    ? [`auto-fail sources:`, ...sources.map((s) => `  ${s}`)]
    : []
}

export function formatSaveDebug(
  combatant: CombatantInstance,
  ability: AbilityRef,
  saveRollMod: D20RollMode,
): string[] {
  const lines: string[] = [`save roll mode: ${saveRollMod}`]

  for (const { conditionId, consequence: c } of getActiveConsequencesWithOrigin(combatant)) {
    if (c.kind !== 'save_mod') continue
    if (c.modifier === 'auto_fail') continue
    if (!(c as SaveModConsequence).abilities.includes(ability)) continue
    lines.push(`  ${conditionId} -> ${ability.toUpperCase()} save ${c.modifier}`)
  }

  return lines
}

export function formatDamageResistanceDebug(
  combatant: CombatantInstance,
  damageType: string | undefined,
): string[] {
  const lines: string[] = []

  for (const { conditionId, consequence: c } of getActiveConsequencesWithOrigin(combatant)) {
    if (c.kind !== 'damage_interaction') continue
    const di = c as DamageInteractionConsequence
    if (di.damageType !== 'all' && damageType && di.damageType !== damageType.trim().toLowerCase()) continue
    lines.push(`${conditionId} -> ${di.modifier} to ${di.damageType} damage`)
  }

  return lines
}

export function formatTurnResourceDebug(
  combatant: CombatantInstance,
  cost: CombatActionCost,
): string[] {
  const lines: string[] = []

  for (const { conditionId, consequence: c } of getActiveConsequencesWithOrigin(combatant)) {
    if (c.kind === 'action_limit') {
      if (c.cannotTakeActions && (cost.action || cost.bonusAction)) {
        lines.push(`${conditionId} -> cannot take actions`)
      }
      if (c.cannotTakeReactions && cost.reaction) {
        lines.push(`${conditionId} -> cannot take reactions`)
      }
    }
    if (c.kind === 'movement' && c.speedBecomesZero && cost.movementFeet) {
      lines.push(`${conditionId} -> speed is zero`)
    }
  }

  return lines.length > 0
    ? [`blocked by conditions:`, ...lines.map((l) => `  ${l}`)]
    : []
}

export function formatTargetExclusionDebug(
  actor: CombatantInstance,
  targetId: string,
): string[] {
  const lines: string[] = []

  for (const marker of actor.conditions) {
    if (!marker.sourceInstanceId || marker.sourceInstanceId !== targetId) continue
    lines.push(`${marker.label} (source: target) -> cannot target with hostile action`)
  }

  return lines.length > 0
    ? [`target excluded:`, ...lines.map((l) => `  ${l}`)]
    : []
}

// ---------------------------------------------------------------------------
// Condition consequence breakdown
// ---------------------------------------------------------------------------

function formatConsequence(c: ConditionConsequence): string[] {
  switch (c.kind) {
    case 'action_limit': {
      const parts: string[] = []
      if (c.cannotTakeActions) parts.push('cannot take actions')
      if (c.cannotTakeReactions) parts.push('cannot take reactions')
      return parts
    }
    case 'movement': {
      const parts: string[] = []
      if (c.speedBecomesZero) parts.push('speed becomes zero')
      if (c.standUpCostsHalfMovement) parts.push('stand-up costs half movement')
      return parts
    }
    case 'attack_mod': {
      const rangeSuffix = c.range && c.range !== 'any' ? ` (${c.range})` : ''
      return [`${c.appliesTo} attack ${c.modifier}${rangeSuffix}`]
    }
    case 'save_mod': {
      const abilities = (c as SaveModConsequence).abilities.map((a) => a.toUpperCase()).join('/')
      return [`${abilities} save ${c.modifier}`]
    }
    case 'check_mod': {
      const abilities = c.abilities === 'all' ? 'all ability' : c.abilities.map((a) => a.toUpperCase()).join('/')
      return [`${abilities} checks at ${c.modifier}`]
    }
    case 'speech':
      return c.cannotSpeak ? ['cannot speak'] : []
    case 'awareness':
      return c.unawareOfSurroundings ? ['unaware of surroundings'] : []
    case 'visibility': {
      const parts: string[] = []
      if (c.cannotSee) parts.push('cannot see')
      if (c.unseenByDefault) parts.push('unseen by default')
      return parts
    }
    case 'crit_window':
      return [`incoming melee hits within ${c.incomingMeleeWithinFt}ft become critical`]
    case 'source_relative': {
      const parts: string[] = []
      if (c.cannotAttackSource) parts.push('cannot attack source')
      if (c.cannotMoveCloserToSource) parts.push('cannot move closer to source')
      return parts
    }
    case 'damage_interaction':
      return [`${c.modifier} to ${c.damageType} damage`]
    default:
      return []
  }
}

export function formatConditionConsequencesDebug(conditionLabel: string): string[] {
  const knownIds = new Set<string>(Object.keys(CONDITION_RULES))
  if (!knownIds.has(conditionLabel)) return []

  const rule = CONDITION_RULES[conditionLabel as EffectConditionId]
  const lines = rule.consequences.flatMap(formatConsequence)
  if (lines.length === 0) return []

  return ['consequences:', ...lines.map((l) => `  ${l}`)]
}

// ---------------------------------------------------------------------------
// Combatant status snapshot
// ---------------------------------------------------------------------------

const SECONDS_PER_TURN = 6

export function formatConcentrationTimer(combatant: CombatantInstance): string | null {
  if (!combatant.concentration) return null
  const { spellLabel, remainingTurns, totalTurns } = combatant.concentration
  if (remainingTurns != null && totalTurns != null) {
    const elapsed = (totalTurns - remainingTurns) * SECONDS_PER_TURN
    const total = totalTurns * SECONDS_PER_TURN
    return `concentrating: ${spellLabel} (${elapsed}s/${total}s)`
  }
  return `concentrating: ${spellLabel} (indefinite)`
}

export function formatCombatantStatusSnapshot(combatant: CombatantInstance): string[] {
  const lines: string[] = []

  const { currentHitPoints, maxHitPoints } = combatant.stats
  const bloodied = currentHitPoints > 0 && currentHitPoints <= maxHitPoints / 2
  lines.push(`HP: ${currentHitPoints}/${maxHitPoints}${bloodied ? ' (bloodied)' : ''}`)

  if (combatant.conditions.length > 0) {
    lines.push(`conditions: ${combatant.conditions.map((m) => m.label).join(', ')}`)
  }
  if (combatant.states.length > 0) {
    lines.push(`states: ${combatant.states.map((m) => m.label).join(', ')}`)
  }

  const concLine = formatConcentrationTimer(combatant)
  if (concLine) lines.push(concLine)

  if (!canTakeActions(combatant)) {
    const sources = getActiveConsequencesWithOrigin(combatant)
      .filter((e) => e.consequence.kind === 'action_limit' && e.consequence.cannotTakeActions)
      .map((e) => e.conditionId)
    lines.push(`actions: disabled (${[...new Set(sources)].join(', ')})`)
  }

  if (!canTakeReactions(combatant)) {
    const sources = getActiveConsequencesWithOrigin(combatant)
      .filter((e) => e.consequence.kind === 'action_limit' && e.consequence.cannotTakeReactions)
      .map((e) => e.conditionId)
    lines.push(`reactions: disabled (${[...new Set(sources)].join(', ')})`)
  }

  if (getSpeedConsequences(combatant).speedBecomesZero) {
    const sources = getActiveConsequencesWithOrigin(combatant)
      .filter((e) => e.consequence.kind === 'movement' && e.consequence.speedBecomesZero)
      .map((e) => e.conditionId)
    lines.push(`movement: 0 (${[...new Set(sources)].join(', ')})`)
  }

  if (lines.length <= 1) return []

  return ['status:', ...lines.map((l) => `  ${l}`)]
}
