import {
  isValidActionTarget,
  getActionTargetInvalidReason,
  getActionResolutionReadiness,
  actionRequiresCreatureTargetForResolve,
} from '@/features/mechanics/domain/encounter'
import type { EncounterState } from '@/features/mechanics/domain/encounter'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

import type { AoeStep } from '../../helpers/area-grid-action'

export type ValidActionIdsForTargetResult = {
  validIds: Set<string>
  /** Authoritative reason string for each action that failed target validation. */
  invalidReasons: Map<string, string>
}

const NO_TARGET_HINT = 'Select a target'

/**
 * Per-action validity for the current target context.
 * When `targetCombatant` is null, actions that require a creature target are invalid with {@link NO_TARGET_HINT};
 * actions that do not require a target are valid.
 */
export function selectValidActionIdsForTarget(
  encounterState: EncounterState,
  activeCombatant: CombatantInstance,
  targetCombatant: CombatantInstance | null,
  availableActions: CombatActionDefinition[],
): ValidActionIdsForTargetResult {
  const validIds = new Set<string>()
  const invalidReasons = new Map<string, string>()

  for (const action of availableActions) {
    if (!actionRequiresCreatureTargetForResolve(action)) {
      validIds.add(action.id)
      continue
    }

    if (!targetCombatant) {
      invalidReasons.set(action.id, NO_TARGET_HINT)
      continue
    }

    if (isValidActionTarget(encounterState, targetCombatant, activeCombatant, action)) {
      validIds.add(action.id)
    } else {
      const reason = getActionTargetInvalidReason(
        encounterState,
        targetCombatant,
        activeCombatant,
        action,
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
  selectedCasterOptions: Record<string, string>
  /** Grid cell for summon placement when required by spawn metadata. */
  selectedSingleCellPlacementCellId?: string | null
  /** Grid obstacle id when attached emanation `anchorMode === 'object'`. */
  selectedObjectAnchorId?: string | null
  encounterState: EncounterState | null | undefined
  activeCombatant: CombatantInstance | null | undefined
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
    selectedCasterOptions,
    selectedSingleCellPlacementCellId,
    selectedObjectAnchorId,
    encounterState,
    activeCombatant,
  } = args
  if (!selectedActionId || !availableActions.some((a) => a.id === selectedActionId)) return false
  if (!selectedAction) return false

  return getActionResolutionReadiness(selectedAction, {
    selectedActionTargetId,
    aoeStep,
    aoeOriginCellId,
    selectedCasterOptions,
    selectedSingleCellPlacementCellId,
    selectedObjectAnchorId,
    encounterState,
    activeCombatant,
  }).canResolve
}
