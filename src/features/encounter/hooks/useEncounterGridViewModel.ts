import { useMemo } from 'react'

import { areaTemplateRadiusFt } from '@/features/mechanics/domain/combat/resolution/action/action-targeting'
import { resolveBattlefieldEffectOriginCellId } from '@/features/mechanics/domain/combat/state/battlefield/battlefield-effect-anchor'
import { getSingleCellPlacementRequirement } from '@/features/mechanics/domain/combat/resolution/action/action-requirement-model'
import { getCellForCombatant } from '@/features/mechanics/domain/combat/space/space.helpers'
import { buildCombatantViewerPresentationKindById } from '@/features/mechanics/domain/combat/space/rendering/grid-occupant-render-visibility'
import { selectGridViewModel } from '@/features/mechanics/domain/combat/space/selectors/space.selectors'
import type { CombatantInstance } from '@/features/mechanics/domain/combat'
import type { EncounterState } from '@/features/mechanics/domain/combat'
import type { CombatActionDefinition } from '@/features/mechanics/domain/combat/resolution/combat-action.types'
import type { GridPerceptionInput } from '@/features/mechanics/domain/perception/perception.render.projection'
import { isAreaGridAction } from '../helpers/actions'
import type { GridInteractionMode } from '../domain'
import type { AoeStep } from '../helpers/actions'

type UseEncounterGridViewModelArgs = {
  encounterState: EncounterState | null
  activeCombatantId: string | null
  activeCombatant: CombatantInstance | null
  selectedAction: CombatActionDefinition | null
  selectedActionTargetId: string
  selectedCasterOptions: Record<string, string>
  aoeStep: AoeStep
  aoeHoverCellId: string | null
  aoeOriginCellId: string | null
  interactionMode: GridInteractionMode
  singleCellPlacementHoverCellId: string | null
  selectedSingleCellPlacementCellId: string | null
  presentationGridPerceptionInput: GridPerceptionInput | undefined
}

/**
 * Shared grid view model + token presentation kinds for Encounter Simulator and GameSession play.
 */
export function useEncounterGridViewModel({
  encounterState,
  activeCombatantId,
  activeCombatant,
  selectedAction,
  selectedActionTargetId,
  selectedCasterOptions,
  aoeStep,
  aoeHoverCellId,
  aoeOriginCellId,
  interactionMode,
  singleCellPlacementHoverCellId,
  selectedSingleCellPlacementCellId,
  presentationGridPerceptionInput,
}: UseEncounterGridViewModelArgs) {
  const selectedActionRangeFt = useMemo(() => selectedAction?.targeting?.rangeFt ?? null, [selectedAction])

  const persistentAttachedAuras = useMemo(() => {
    if (!encounterState?.attachedAuraInstances?.length) return undefined
    const resolved = encounterState.attachedAuraInstances
      .map((a) => {
        const originCellId = resolveBattlefieldEffectOriginCellId(
          encounterState.space,
          encounterState.placements,
          a.anchor,
        )
        if (!originCellId) return null
        return { originCellId, areaRadiusFt: a.area.size }
      })
      .filter((x): x is { originCellId: string; areaRadiusFt: number } => x !== null)
    return resolved.length > 0 ? resolved : undefined
  }, [encounterState?.attachedAuraInstances, encounterState?.space, encounterState?.placements])

  const aoeGridOverlay = useMemo(() => {
    if (!encounterState?.space || !encounterState.placements || !activeCombatantId) return null
    if (!selectedAction || !isAreaGridAction(selectedAction, selectedCasterOptions) || aoeStep === 'none')
      return null
    const casterCellId = getCellForCombatant(encounterState.placements, activeCombatantId)
    if (!casterCellId || !selectedAction.areaTemplate) return null
    const castRangeFt = selectedAction.targeting?.rangeFt ?? 0
    const areaRadiusFt = areaTemplateRadiusFt(selectedAction.areaTemplate)
    return {
      castRangeFt,
      areaRadiusFt,
      casterCellId,
      hoverCellId: aoeHoverCellId,
      originCellId: aoeOriginCellId,
      step: aoeStep === 'confirm' ? ('confirm' as const) : ('placing' as const),
    }
  }, [
    encounterState,
    activeCombatantId,
    selectedAction,
    selectedCasterOptions,
    aoeStep,
    aoeHoverCellId,
    aoeOriginCellId,
  ])

  const singleCellPlacementGridOverlay = useMemo(() => {
    if (!encounterState?.space || !encounterState.placements || !activeCombatantId) return null
    if (interactionMode !== 'single-cell-place') return null
    if (!selectedAction) return null
    const req = getSingleCellPlacementRequirement(selectedAction)
    if (!req) return null
    const casterCellId = getCellForCombatant(encounterState.placements, activeCombatantId)
    if (!casterCellId) return null
    return {
      casterCellId,
      rangeFt: req.rangeFt,
      lineOfSightRequired: req.lineOfSightRequired,
      mustBeUnoccupied: req.mustBeUnoccupied,
      hoverCellId: singleCellPlacementHoverCellId,
      selectedCellId: selectedSingleCellPlacementCellId,
    }
  }, [
    encounterState,
    activeCombatantId,
    selectedAction,
    interactionMode,
    singleCellPlacementHoverCellId,
    selectedSingleCellPlacementCellId,
  ])

  const gridViewModel = useMemo(() => {
    if (!encounterState) return undefined
    const rangeForRing =
      aoeGridOverlay || singleCellPlacementGridOverlay ? null : selectedActionRangeFt
    return selectGridViewModel(encounterState, {
      selectedTargetId: selectedActionTargetId || null,
      selectedActionRangeFt: rangeForRing,
      selectedAction,
      showReachable:
        (activeCombatant?.turnResources?.movementRemaining ?? 0) > 0 &&
        interactionMode !== 'aoe-place' &&
        interactionMode !== 'single-cell-place',
      aoe: aoeGridOverlay,
      placementPick: singleCellPlacementGridOverlay,
      persistentAttachedAuras,
      perception: presentationGridPerceptionInput,
    })
  }, [
    encounterState,
    selectedActionTargetId,
    selectedActionRangeFt,
    selectedAction,
    activeCombatant,
    aoeGridOverlay,
    singleCellPlacementGridOverlay,
    interactionMode,
    persistentAttachedAuras,
    presentationGridPerceptionInput,
  ])

  const combatantViewerPresentationKindById = useMemo(() => {
    if (!encounterState) return {}
    const ids = Object.keys(encounterState.combatantsById)
    return buildCombatantViewerPresentationKindById(encounterState, presentationGridPerceptionInput, ids)
  }, [encounterState, presentationGridPerceptionInput])

  return {
    gridViewModel,
    combatantViewerPresentationKindById,
    aoeGridOverlay,
    singleCellPlacementGridOverlay,
  }
}
