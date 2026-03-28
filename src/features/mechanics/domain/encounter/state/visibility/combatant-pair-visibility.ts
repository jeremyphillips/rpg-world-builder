import { getCellForCombatant } from '@/features/encounter/space'
import { resolveViewerPerceptionForCellFromState } from '@/features/mechanics/domain/perception/perception.resolve'
import type { EncounterViewerPerceptionCapabilities } from '@/features/mechanics/domain/perception/perception.types'

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
 * Introspection-only snapshot of {@link canPerceiveTargetOccupantForCombat} (same gates, same order).
 * For combat-log diagnostics; does not change perception rules.
 */
export type PerceiveTargetOccupantBreakdown = {
  observerCellId: string | null
  subjectCellId: string | null
  missingCombatant: boolean
  intrinsicCanSeeObserver: boolean
  targetInvisible: boolean
  observerHasSeeInvisibility: boolean
  invisibleGateBlocks: boolean
  noGridPermissive: boolean
  lineOfSightClear: boolean | null
  lineOfEffectClear: boolean | null
  targetCellId: string | null
  viewerPerceptionResolved: boolean
  canPerceiveCell: boolean | null
  canPerceiveOccupants: boolean | null
  maskedByMagicalDarkness: boolean | null
  maskedByDarkness: boolean | null
  final: boolean
}

export type PerceiveTargetOccupantEvaluation = {
  canPerceive: boolean
  breakdown: PerceiveTargetOccupantBreakdown
}

/**
 * Same result as {@link canPerceiveTargetOccupantForCombat}, plus a step-by-step breakdown for logging.
 */
export function evaluatePerceiveTargetOccupantForCombat(
  state: EncounterState,
  observerId: string,
  targetCombatantId: string,
  options?: { capabilities?: EncounterViewerPerceptionCapabilities },
): PerceiveTargetOccupantEvaluation {
  const observer = state.combatantsById[observerId]
  const target = state.combatantsById[targetCombatantId]
  const hasGrid = Boolean(state.space && state.placements)
  const observerCellId =
    hasGrid && state.placements ? getCellForCombatant(state.placements, observerId) : null
  const subjectCellId =
    hasGrid && state.placements ? getCellForCombatant(state.placements, targetCombatantId) : null

  const base = (partial: Partial<PerceiveTargetOccupantBreakdown>): PerceiveTargetOccupantBreakdown => ({
    observerCellId,
    subjectCellId,
    missingCombatant: partial.missingCombatant ?? false,
    intrinsicCanSeeObserver: partial.intrinsicCanSeeObserver ?? false,
    targetInvisible: partial.targetInvisible ?? false,
    observerHasSeeInvisibility: partial.observerHasSeeInvisibility ?? false,
    invisibleGateBlocks: partial.invisibleGateBlocks ?? false,
    noGridPermissive: partial.noGridPermissive ?? false,
    lineOfSightClear: partial.lineOfSightClear ?? null,
    lineOfEffectClear: partial.lineOfEffectClear ?? null,
    targetCellId: partial.targetCellId ?? null,
    viewerPerceptionResolved: partial.viewerPerceptionResolved ?? false,
    canPerceiveCell: partial.canPerceiveCell ?? null,
    canPerceiveOccupants: partial.canPerceiveOccupants ?? null,
    maskedByMagicalDarkness: partial.maskedByMagicalDarkness ?? null,
    maskedByDarkness: partial.maskedByDarkness ?? null,
    final: partial.final ?? false,
  })

  if (!observer || !target) {
    return {
      canPerceive: false,
      breakdown: base({ missingCombatant: true, final: false }),
    }
  }

  const intrinsicCanSeeObserver = canSee(observer)
  const targetInvisible = hasInvisibleCondition(target)
  const observerHasSeeInvisibility = hasSeeInvisibilityState(observer)
  const invisibleGateBlocks = targetInvisible && !observerHasSeeInvisibility

  if (!intrinsicCanSeeObserver) {
    return {
      canPerceive: false,
      breakdown: base({
        intrinsicCanSeeObserver: false,
        targetInvisible,
        observerHasSeeInvisibility,
        invisibleGateBlocks: false,
        final: false,
      }),
    }
  }

  if (invisibleGateBlocks) {
    return {
      canPerceive: false,
      breakdown: base({
        intrinsicCanSeeObserver: true,
        targetInvisible,
        observerHasSeeInvisibility,
        invisibleGateBlocks: true,
        final: false,
      }),
    }
  }

  if (!state.space || !state.placements) {
    return {
      canPerceive: true,
      breakdown: base({
        intrinsicCanSeeObserver: true,
        targetInvisible,
        observerHasSeeInvisibility,
        invisibleGateBlocks: false,
        noGridPermissive: true,
        final: true,
      }),
    }
  }

  const los = lineOfSightClear(observerId, targetCombatantId, state)
  if (!los) {
    return {
      canPerceive: false,
      breakdown: base({
        intrinsicCanSeeObserver: true,
        targetInvisible,
        observerHasSeeInvisibility,
        invisibleGateBlocks: false,
        lineOfSightClear: false,
        final: false,
      }),
    }
  }

  const loe = lineOfEffectClear(observerId, targetCombatantId, state)
  if (!loe) {
    return {
      canPerceive: false,
      breakdown: base({
        intrinsicCanSeeObserver: true,
        targetInvisible,
        observerHasSeeInvisibility,
        invisibleGateBlocks: false,
        lineOfSightClear: true,
        lineOfEffectClear: false,
        final: false,
      }),
    }
  }

  const targetCellId = getCellForCombatant(state.placements, targetCombatantId)
  if (!targetCellId) {
    return {
      canPerceive: true,
      breakdown: base({
        intrinsicCanSeeObserver: true,
        targetInvisible,
        observerHasSeeInvisibility,
        invisibleGateBlocks: false,
        lineOfSightClear: true,
        lineOfEffectClear: true,
        targetCellId: null,
        viewerPerceptionResolved: false,
        final: true,
      }),
    }
  }

  const perception = resolveViewerPerceptionForCellFromState(state, observerId, targetCellId, {
    viewerRole: 'pc',
    capabilities: options?.capabilities,
  })
  if (!perception) {
    return {
      canPerceive: true,
      breakdown: base({
        intrinsicCanSeeObserver: true,
        targetInvisible,
        observerHasSeeInvisibility,
        invisibleGateBlocks: false,
        lineOfSightClear: true,
        lineOfEffectClear: true,
        targetCellId,
        viewerPerceptionResolved: false,
        final: true,
      }),
    }
  }

  const final = perception.canPerceiveOccupants
  return {
    canPerceive: final,
    breakdown: base({
      intrinsicCanSeeObserver: true,
      targetInvisible,
      observerHasSeeInvisibility,
      invisibleGateBlocks: false,
      lineOfSightClear: true,
      lineOfEffectClear: true,
      targetCellId,
      viewerPerceptionResolved: true,
      canPerceiveCell: perception.canPerceiveCell,
      canPerceiveOccupants: perception.canPerceiveOccupants,
      maskedByMagicalDarkness: perception.maskedByMagicalDarkness,
      maskedByDarkness: perception.maskedByDarkness,
      final,
    }),
  }
}

/**
 * Plain-language line for combat log when hidden-from is pruned (same cases as successful
 * {@link canPerceiveTargetOccupantForCombat}; wording only).
 */
export function formatStealthRevealHumanReadable(
  observerLabel: string,
  subjectLabel: string,
  b: PerceiveTargetOccupantBreakdown,
): string {
  if (b.missingCombatant) {
    return `${observerLabel} can now perceive ${subjectLabel} (hidden-from no longer applies).`
  }
  if (b.noGridPermissive) {
    return `${observerLabel} can now perceive ${subjectLabel} as an occupant and no longer treats them as hidden.`
  }
  if (b.lineOfSightClear === false || b.lineOfEffectClear === false) {
    return `${observerLabel} can now perceive ${subjectLabel}'s occupant (hidden-from removed).`
  }
  if (!b.viewerPerceptionResolved) {
    return `${observerLabel} can now perceive ${subjectLabel} as an occupant and no longer treats them as hidden.`
  }
  return `${observerLabel} now has clear line of sight to ${subjectLabel} and can perceive the occupant.`
}

/** Compact pipe-separated fragment for stealth prune diagnostics (stable token shape for log search). */
export function formatPerceiveTargetOccupantBreakdownCompact(b: PerceiveTargetOccupantBreakdown): string {
  if (b.missingCombatant) return 'missingCombatant=true'
  const parts: string[] = []
  parts.push(`intrinsicSee=${b.intrinsicCanSeeObserver}`)
  parts.push(`invGate=${b.invisibleGateBlocks ? 'blocked' : 'pass'}`)
  if (b.noGridPermissive) {
    parts.push('noGridPermissive=true')
    parts.push(`final=${b.final}`)
    return parts.join('|')
  }
  if (b.lineOfSightClear === false) {
    parts.push('LOS=false')
    parts.push(`final=${b.final}`)
    return parts.join('|')
  }
  if (b.lineOfEffectClear === false) {
    parts.push('LOS=true')
    parts.push('LOE=false')
    parts.push(`final=${b.final}`)
    return parts.join('|')
  }
  parts.push('LOS=true')
  parts.push('LOE=true')
  parts.push(`subjectCell=${b.targetCellId ?? 'none'}`)
  if (!b.viewerPerceptionResolved) {
    parts.push('battlefieldPerception=null')
    parts.push(`final=${b.final}`)
    return parts.join('|')
  }
  parts.push(`worldCell=${b.canPerceiveCell}`)
  parts.push(`worldOccupants=${b.canPerceiveOccupants}`)
  parts.push(`magDark=${b.maskedByMagicalDarkness}`)
  parts.push(`heavyOrDark=${b.maskedByDarkness}`)
  parts.push(`final=${b.final}`)
  return parts.join('|')
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
  return evaluatePerceiveTargetOccupantForCombat(state, observerId, targetCombatantId, options).canPerceive
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
