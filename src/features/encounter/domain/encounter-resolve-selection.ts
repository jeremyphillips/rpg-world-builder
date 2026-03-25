import { isValidActionTarget } from '@/features/mechanics/domain/encounter'
import type { EncounterState } from '@/features/mechanics/domain/encounter'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

import { isAreaGridAction, type AoeStep } from '../helpers/area-grid-action'

/**
 * Action IDs that are valid against the current target (when a target is selected).
 * Returns `undefined` when there is no target — same convention as the action drawer.
 */
export function selectValidActionIdsForTarget(
  encounterState: EncounterState,
  activeCombatant: CombatantInstance,
  targetCombatant: CombatantInstance | null,
  availableActions: CombatActionDefinition[],
): Set<string> | undefined {
  if (!targetCombatant) return undefined
  const ids = new Set<string>()
  for (const action of availableActions) {
    if (isValidActionTarget(encounterState, targetCombatant, activeCombatant, action)) {
      ids.add(action.id)
    }
  }
  return ids
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
