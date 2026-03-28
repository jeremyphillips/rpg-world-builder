import { getCellForCombatant } from '@/features/encounter/space'
import { resolveViewerPerceptionForCellFromState } from '@/features/mechanics/domain/encounter/environment/perception.resolve'
import type { EncounterViewerPerceptionCapabilities } from '@/features/mechanics/domain/encounter/environment/perception.types'

import type { CombatantInstance } from '../types'
import type { EncounterState } from '../types'
import { canSee } from '../conditions/condition-rules/condition-queries'
import { lineOfEffectClear, lineOfSightClear } from './visibility-los'

/** State marker from the See Invisibility spell (`stateId: 'see-invisibility'`). */
const SEE_INVISIBILITY_STATE_LABEL = 'see-invisibility'

function hasInvisibleCondition(c: CombatantInstance): boolean {
  return c.conditions.some((m) => m.label === 'invisible')
}

function hasSeeInvisibilityState(c: CombatantInstance): boolean {
  return c.states.some((s) => s.label === SEE_INVISIBILITY_STATE_LABEL)
}

/**
 * Shared pair-level seam: whether `observer` can **perceive the target combatant as an occupant**
 * for combat (attack rolls, spell/ability targeting that requires sight, opportunity attacks, sight-based
 * checks, and Hide eligibility — see `sight-hide-rules.ts`).
 *
 * This is **not** the same as perceiving only that a cell exists: in heavy obscurement or magical
 * darkness, `canPerceiveCell` may stay true while `canPerceiveOccupants` is false — attacks and
 * unseen-target / unseen-attacker logic must use **occupant** visibility.
 *
 * **Missing tactical data (permissive fallback):** after `canSee`, invisible vs See Invisibility,
 * and LOS/LoE pass, if `space` or `placements` is absent, or the target has no resolved cell, or
 * battlefield perception cannot be resolved, we treat **occupant** visibility as **true** so
 * encounters without a grid do not over-block relative to legacy behavior. Condition-based blindness
 * and invisibility still apply first.
 */
export function canPerceiveTargetOccupantForCombat(
  state: EncounterState,
  observerId: string,
  targetCombatantId: string,
  options?: { capabilities?: EncounterViewerPerceptionCapabilities },
): boolean {
  const observer = state.combatantsById[observerId]
  const target = state.combatantsById[targetCombatantId]
  if (!observer || !target) return false

  if (!canSee(observer)) return false
  if (hasInvisibleCondition(target) && !hasSeeInvisibilityState(observer)) {
    return false
  }

  if (!state.space || !state.placements) {
    return true
  }

  if (!lineOfSightClear(observerId, targetCombatantId, state)) return false
  if (!lineOfEffectClear(observerId, targetCombatantId, state)) return false

  const targetCellId = getCellForCombatant(state.placements, targetCombatantId)
  if (!targetCellId) {
    return true
  }

  const perception = resolveViewerPerceptionForCellFromState(state, observerId, targetCellId, {
    viewerRole: 'pc',
    capabilities: options?.capabilities,
  })
  if (!perception) {
    return true
  }

  return perception.canPerceiveOccupants
}

/**
 * Attack-roll pair visibility: whether each side can perceive the **other’s occupant** for
 * unseen-target (attacker → defender) and unseen-attacker (defender → attacker) modifiers.
 *
 * Uses the same permissive tactical fallback as {@link canPerceiveTargetOccupantForCombat}.
 *
 * **Stealth / hidden state:** this function does **not** read `CombatantInstance.stealth` or
 * `hiddenFromObserverIds`. Unseen attacker/target modifiers come **only** from occupant perception
 * (world + conditions + LoS/LoE). That avoids double-counting: when hide resolution marks someone
 * hidden, `reconcileStealthHiddenForPerceivedObservers` keeps hidden state aligned with this same
 * seam before actions, and heavy obscurement / darkness already yields unseen-attacker advantage when
 * the defender cannot perceive the attacker’s occupant.
 */
export function resolveCombatantPairVisibilityForAttackRoll(
  state: EncounterState,
  attackerId: string,
  defenderId: string,
  options?: { capabilities?: EncounterViewerPerceptionCapabilities },
): {
  attackerCanSeeDefenderOccupant: boolean
  defenderCanSeeAttackerOccupant: boolean
} {
  return {
    attackerCanSeeDefenderOccupant: canPerceiveTargetOccupantForCombat(state, attackerId, defenderId, options),
    defenderCanSeeAttackerOccupant: canPerceiveTargetOccupantForCombat(state, defenderId, attackerId, options),
  }
}

/**
 * Roll modifiers from pair visibility (single array merged into {@link resolveD20RollMode}).
 * Does **not** consult stealth hidden state — see {@link resolveCombatantPairVisibilityForAttackRoll}.
 */
export function getAttackVisibilityRollModifiersFromPair(vis: {
  attackerCanSeeDefenderOccupant: boolean
  defenderCanSeeAttackerOccupant: boolean
}): ('advantage' | 'disadvantage')[] {
  const out: ('advantage' | 'disadvantage')[] = []
  if (!vis.attackerCanSeeDefenderOccupant) out.push('disadvantage')
  if (!vis.defenderCanSeeAttackerOccupant) out.push('advantage')
  return out
}

/**
 * Whether `observer` may select `target` for effects that require sight (e.g. “a creature you can see”).
 * Delegates to {@link canPerceiveTargetOccupantForCombat} so targeting and attack rolls share one definition
 * of “can see” the **occupant**, including world/perception (heavy obscurement, magical darkness).
 */
export function canSeeForTargeting(
  state: EncounterState,
  observerId: string,
  targetId: string,
  options?: { capabilities?: EncounterViewerPerceptionCapabilities },
): boolean {
  return canPerceiveTargetOccupantForCombat(state, observerId, targetId, options)
}
