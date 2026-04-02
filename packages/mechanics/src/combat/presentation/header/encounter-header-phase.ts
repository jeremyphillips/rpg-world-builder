import { actionRequiresCreatureTargetForResolve } from '@/features/mechanics/domain/combat'

import {
  isAreaGridAction,
  isSelfCenteredAreaAction,
} from '@/features/mechanics/domain/combat/resolution/action/area-grid-action'
import { deriveCombatantTurnExhaustion } from '@/features/mechanics/domain/combat/selectors/turn/combatant-turn-exhaustion'
import type { EncounterHeaderInteractionArgs, EncounterHeaderTurnArgs } from './encounter-header-types'

export type EncounterHeaderPhase =
  | { kind: 'move'; movementRemainingFt: number }
  | { kind: 'singleCellPlace' }
  | { kind: 'objectAnchorSelect' }
  | { kind: 'areaPlacing'; label: string }
  | { kind: 'areaConfirm'; label: string; canResolveAction: boolean }
  | { kind: 'turnExhausted' }
  | { kind: 'selectionIdle' }
  | { kind: 'targetOnly'; targetLabel: string }
  | { kind: 'actionFinishInPanel'; actionLabel: string }
  | { kind: 'actionNeedsTarget'; actionLabel: string }
  | { kind: 'readyToResolve'; actionLabel: string; targetLabel: string }
  | { kind: 'postActionHint' }
  | {
      kind: 'fallback'
      hasActionPick: boolean
      hasTargetPick: boolean
      actionLabel: string | null
      targetLabel: string | null
    }

export type ResolveEncounterHeaderPhaseArgs = {
  turn: EncounterHeaderTurnArgs
  interaction: EncounterHeaderInteractionArgs
  display: { selectedActionLabel: string | null; selectedTargetLabel: string | null }
}

/**
 * Turn + interaction phase only (no viewer policy). Priority matches
 * {@link deriveEncounterHeaderModel} historical ordering.
 */
export function resolveEncounterHeaderPhase(args: ResolveEncounterHeaderPhaseArgs): EncounterHeaderPhase {
  const { turn, interaction, display } = args
  const {
    interactionMode,
    selectedActionId,
    selectedAction,
    selectedCasterOptions,
    aoeStep,
    canResolveAction,
    selectedActionRequiresCreatureTarget,
  } = interaction
  const { selectedActionLabel, selectedTargetLabel } = display

  const exhaustion = deriveCombatantTurnExhaustion(turn)
  const movementRemaining = turn.turnResources?.movementRemaining ?? 0
  const actionSpent = turn.turnResources ? !turn.turnResources.actionAvailable : false

  if (interactionMode === 'move') {
    return { kind: 'move', movementRemainingFt: movementRemaining }
  }

  if (interactionMode === 'single-cell-place') {
    return { kind: 'singleCellPlace' }
  }

  if (interactionMode === 'object-anchor-select') {
    return { kind: 'objectAnchorSelect' }
  }

  const areaAction =
    selectedAction && isAreaGridAction(selectedAction, selectedCasterOptions) ? selectedAction : null
  const inAoeFlow = Boolean(areaAction && aoeStep !== 'none')
  const selfCentered = Boolean(
    areaAction && isSelfCenteredAreaAction(areaAction, selectedCasterOptions),
  )

  if (inAoeFlow && areaAction) {
    const label = selectedActionLabel ?? 'this area effect'
    if (aoeStep === 'placing' && !selfCentered) {
      return { kind: 'areaPlacing', label }
    }
    if (aoeStep === 'confirm') {
      return { kind: 'areaConfirm', label, canResolveAction }
    }
  }

  if (exhaustion.isFullySpent && !canResolveAction) {
    return { kind: 'turnExhausted' }
  }

  const hasActionPick = Boolean(selectedActionId)
  const hasTargetPick = Boolean(selectedTargetLabel)

  if (!hasActionPick && !hasTargetPick) {
    return { kind: 'selectionIdle' }
  }

  if (hasTargetPick && !hasActionPick) {
    return { kind: 'targetOnly', targetLabel: selectedTargetLabel! }
  }

  if (
    hasActionPick &&
    !hasTargetPick &&
    selectedAction &&
    !isAreaGridAction(selectedAction, selectedCasterOptions)
  ) {
    const requiresCreatureTarget =
      selectedActionRequiresCreatureTarget !== undefined
        ? selectedActionRequiresCreatureTarget
        : actionRequiresCreatureTargetForResolve(selectedAction)
    if (!requiresCreatureTarget) {
      return { kind: 'actionFinishInPanel', actionLabel: selectedActionLabel ?? 'this action' }
    }
    return { kind: 'actionNeedsTarget', actionLabel: selectedActionLabel ?? 'this action' }
  }

  if (
    hasActionPick &&
    hasTargetPick &&
    canResolveAction &&
    !isAreaGridAction(selectedAction!, selectedCasterOptions)
  ) {
    return {
      kind: 'readyToResolve',
      actionLabel: selectedActionLabel ?? 'Action',
      targetLabel: selectedTargetLabel!,
    }
  }

  if (actionSpent && !canResolveAction && exhaustion.hasAnyPrimaryOptionRemaining) {
    return { kind: 'postActionHint' }
  }

  return {
    kind: 'fallback',
    hasActionPick,
    hasTargetPick,
    actionLabel: selectedActionLabel,
    targetLabel: selectedTargetLabel,
  }
}
