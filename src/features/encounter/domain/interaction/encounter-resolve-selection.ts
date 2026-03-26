import { isValidActionTarget, getActionTargetInvalidReason } from '@/features/mechanics/domain/encounter'
import type { EncounterState } from '@/features/mechanics/domain/encounter'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

import { isAreaGridAction, type AoeStep } from '../../helpers/area-grid-action'

export type ValidActionIdsForTargetResult = {
  validIds: Set<string>
  /** Authoritative reason string for each action that failed target validation. */
  invalidReasons: Map<string, string>
}

/**
 * Action IDs that are valid against the current target (when a target is selected).
 * Returns `undefined` when there is no target — same convention as the action drawer.
 */
export function selectValidActionIdsForTarget(
  encounterState: EncounterState,
  activeCombatant: CombatantInstance,
  targetCombatant: CombatantInstance | null,
  availableActions: CombatActionDefinition[],
): ValidActionIdsForTargetResult | undefined {
  if (!targetCombatant) return undefined
  const validIds = new Set<string>()
  const invalidReasons = new Map<string, string>()
  for (const action of availableActions) {
    if (isValidActionTarget(encounterState, targetCombatant, activeCombatant, action)) {
      validIds.add(action.id)
    } else {
      const reason = getActionTargetInvalidReason(
        encounterState, targetCombatant, activeCombatant, action,
      )
      if (reason) invalidReasons.set(action.id, reason)
    }
  }
  return { validIds, invalidReasons }
}

export type CanResolveCombatActionSelectionArgs = {
  selectedActionId: string
  selectedAction: CombatActionDefinition | null
  availableActions: CombatActionDefinition[]
  aoeStep: AoeStep
  aoeOriginCellId: string | null
  selectedActionTargetId: string
}

/** Mirrors active-route logic for when Resolve is enabled. */
export function canResolveCombatActionSelection(args: CanResolveCombatActionSelectionArgs): boolean {
  const {
    selectedActionId,
    selectedAction,
    availableActions,
    aoeStep,
    aoeOriginCellId,
    selectedActionTargetId,
  } = args
  if (!selectedActionId || !availableActions.some((a) => a.id === selectedActionId)) return false
  if (selectedAction && isAreaGridAction(selectedAction)) {
    return (
      aoeStep === 'confirm' &&
      Boolean(aoeOriginCellId) &&
      Boolean(selectedAction.areaTemplate)
    )
  }
  return Boolean(selectedActionTargetId)
}
