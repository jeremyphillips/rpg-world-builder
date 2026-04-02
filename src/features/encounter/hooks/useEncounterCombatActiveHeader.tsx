import { useMemo } from 'react'

import { actionRequiresCreatureTargetForResolve } from '@/features/mechanics/domain/combat'
import { getCombatantDisplayLabel } from '@/features/mechanics/domain/combat/state'
import { getEffectiveGroundMovementBudgetFt } from '@/features/mechanics/domain/combat/state'
import { getCombatantBaseMovement } from '@/features/mechanics/domain/combat/state/shared'
import type { CombatantInstance } from '@/features/mechanics/domain/combat'
import type { EncounterState } from '@/features/mechanics/domain/combat'
import type { CombatActionDefinition } from '@/features/mechanics/domain/combat/resolution/combat-action.types'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { GridPerceptionInput } from '@/features/mechanics/domain/perception/perception.render.projection'
import type { GridViewModel } from '@/features/mechanics/domain/combat/space/selectors/space.selectors'
import type { ViewerCombatantPresentationKind } from '@/features/mechanics/domain/combat/presentation/view.types'

import {
  canResolveCombatActionSelection,
  deriveEncounterCapabilities,
  deriveEncounterHeaderModel,
  deriveEncounterPerceptionUiFeedback,
  type EncounterViewerContext,
  type EncounterSimulatorViewerMode,
} from '../domain'
import type { GridInteractionMode } from '../domain'
import { EncounterActiveHeader } from '../components'
import type { AoeStep } from '../helpers/actions'

export type EncounterCombatActiveHeaderVariant = 'simulator' | 'session'

export type UseEncounterCombatActiveHeaderArgs = {
  variant: EncounterCombatActiveHeaderVariant
  encounterState: EncounterState | null
  activeCombatant: CombatantInstance | null
  availableActions: CombatActionDefinition[]
  selectedActionId: string
  selectedAction: CombatActionDefinition | null
  selectedCasterOptions: Record<string, string>
  aoeStep: AoeStep
  aoeOriginCellId: string | null
  selectedActionTargetId: string
  selectedSingleCellPlacementCellId: string | null
  selectedObjectAnchorId: string | null
  interactionMode: GridInteractionMode
  gridViewModel: GridViewModel | undefined
  combatantViewerPresentationKindById: Record<string, ViewerCombatantPresentationKind>
  presentationGridPerceptionInput: GridPerceptionInput | undefined
  viewerContext: EncounterViewerContext
  simulatorViewerMode: EncounterSimulatorViewerMode
  onSimulatorViewerModeChange: (mode: EncounterSimulatorViewerMode) => void
  handleNextTurn: () => void
  handleResetEncounter: () => void
  setActionDrawerOpen: (open: boolean) => void
  onEditEncounter: () => void
  monstersById: Record<string, Monster | undefined>
  spellsById: Record<string, Spell | undefined> | undefined
  suppressSameSideHostile: boolean
}

/**
 * Shared Encounter Simulator / GameSession active combat header (round, turn, actions, POV, movement).
 */
export function useEncounterCombatActiveHeader({
  variant,
  encounterState,
  activeCombatant,
  availableActions,
  selectedActionId,
  selectedAction,
  selectedCasterOptions,
  aoeStep,
  aoeOriginCellId,
  selectedActionTargetId,
  selectedSingleCellPlacementCellId,
  selectedObjectAnchorId,
  interactionMode,
  gridViewModel,
  combatantViewerPresentationKindById,
  presentationGridPerceptionInput,
  viewerContext,
  simulatorViewerMode,
  onSimulatorViewerModeChange,
  handleNextTurn,
  handleResetEncounter,
  setActionDrawerOpen,
  onEditEncounter,
  monstersById,
  spellsById,
  suppressSameSideHostile,
}: UseEncounterCombatActiveHeaderArgs) {
  const encounterCombatantRoster = useMemo(
    () => (encounterState ? Object.values(encounterState.combatantsById) : []),
    [encounterState],
  )

  const nextCombatantId = useMemo(() => {
    if (!encounterState) return null
    const nextIdx = encounterState.turnIndex + 1
    return nextIdx < encounterState.initiativeOrder.length
      ? encounterState.initiativeOrder[nextIdx]
      : encounterState.initiativeOrder[0] ?? null
  }, [encounterState])

  const nextCombatantLabel = useMemo(() => {
    if (!encounterState || !nextCombatantId) return null
    const nextCombatant = encounterState.combatantsById[nextCombatantId]
    if (!nextCombatant) return null
    return getCombatantDisplayLabel(nextCombatant, encounterCombatantRoster)
  }, [encounterState, encounterCombatantRoster, nextCombatantId])

  const nextCombatantPresentationKind = useMemo(() => {
    if (!nextCombatantId) return null
    return combatantViewerPresentationKindById[nextCombatantId] ?? 'visible'
  }, [nextCombatantId, combatantViewerPresentationKindById])

  const presentationViewerDisplayLabel = useMemo(() => {
    if (!encounterState || !activeCombatant) return null
    const vid = presentationGridPerceptionInput?.viewerCombatantId
    if (vid && encounterState.combatantsById[vid]) {
      return getCombatantDisplayLabel(encounterState.combatantsById[vid], encounterCombatantRoster)
    }
    return getCombatantDisplayLabel(activeCombatant, encounterCombatantRoster)
  }, [encounterState, activeCombatant, encounterCombatantRoster, presentationGridPerceptionInput])

  const perceptionUiFeedback = useMemo(
    () =>
      activeCombatant
        ? deriveEncounterPerceptionUiFeedback({
            simulatorViewerMode: viewerContext.simulatorViewerMode,
            presentationViewerDisplayLabel,
            gridPerception: gridViewModel?.perception,
          })
        : null,
    [
      activeCombatant,
      presentationViewerDisplayLabel,
      gridViewModel?.perception,
      viewerContext.simulatorViewerMode,
    ],
  )

  const capabilities = useMemo(
    () => (encounterState ? deriveEncounterCapabilities(encounterState, viewerContext) : null),
    [encounterState, viewerContext],
  )

  const targetCombatantForHeader = useMemo(() => {
    if (!encounterState || !selectedActionTargetId) return null
    return encounterState.combatantsById[selectedActionTargetId] ?? null
  }, [encounterState, selectedActionTargetId])

  const canResolveActionForHeader = useMemo(
    () =>
      canResolveCombatActionSelection({
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
      }),
    [
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
    ],
  )

  const availableActionIdsForHeader = useMemo(
    () => availableActions.map((a) => a.id),
    [availableActions],
  )

  const baseMovementFt = useMemo(() => {
    if (!activeCombatant) return 0
    if (encounterState && spellsById) {
      return getEffectiveGroundMovementBudgetFt(activeCombatant, encounterState, {
        spellLookup: (id) => spellsById[id],
        suppressSameSideHostile,
      })
    }
    return getCombatantBaseMovement(activeCombatant)
  }, [activeCombatant, encounterState, spellsById, suppressSameSideHostile])

  const encounterHeaderModel = useMemo(() => {
    if (!activeCombatant) {
      return { directive: '—', endTurnEmphasis: 'subtle' as const }
    }
    return deriveEncounterHeaderModel({
      turn: {
        combatantActions: activeCombatant.actions,
        availableActionIds: availableActionIdsForHeader,
        turnResources: activeCombatant.turnResources ?? null,
      },
      interaction: {
        interactionMode,
        selectedActionId,
        selectedAction,
        selectedCasterOptions,
        aoeStep,
        canResolveAction: canResolveActionForHeader,
        selectedActionRequiresCreatureTarget: selectedAction
          ? actionRequiresCreatureTargetForResolve(selectedAction, selectedCasterOptions)
          : undefined,
      },
      display: {
        selectedActionLabel: selectedAction?.label ?? null,
        selectedTargetLabel:
          targetCombatantForHeader && encounterState
            ? getCombatantDisplayLabel(targetCombatantForHeader, encounterCombatantRoster)
            : null,
      },
    })
  }, [
    activeCombatant,
    interactionMode,
    availableActionIdsForHeader,
    selectedActionId,
    selectedAction,
    aoeStep,
    targetCombatantForHeader,
    canResolveActionForHeader,
    encounterState,
    encounterCombatantRoster,
    selectedCasterOptions,
  ])

  const canOpenActionsDrawer =
    Boolean(capabilities?.canSelectAction) && availableActions.length > 0

  const activeHeader =
    encounterState && activeCombatant ? (
      <EncounterActiveHeader
        roundNumber={encounterState.roundNumber}
        turnIndex={encounterState.turnIndex}
        turnCount={encounterState.initiativeOrder.length}
        nextCombatantLabel={nextCombatantLabel}
        activeCombatant={activeCombatant}
        activeCombatantDisplayLabel={getCombatantDisplayLabel(activeCombatant, encounterCombatantRoster)}
        monstersById={monstersById}
        turnResources={activeCombatant.turnResources ?? null}
        baseMovementFt={baseMovementFt}
        directive={encounterHeaderModel.directive}
        endTurnEmphasis={encounterHeaderModel.endTurnEmphasis}
        canOpenActions={canOpenActionsDrawer}
        onOpenActions={() => setActionDrawerOpen(true)}
        canEndTurn={capabilities?.canEndTurn ?? false}
        onEndTurn={handleNextTurn}
        onEditEncounter={onEditEncounter}
        onResetEncounter={handleResetEncounter}
        simulatorViewerMode={simulatorViewerMode}
        onSimulatorViewerModeChange={onSimulatorViewerModeChange}
        perceptionFeedback={perceptionUiFeedback}
        nextCombatantPresentationKind={nextCombatantPresentationKind}
        toolbarVariant={variant === 'session' ? 'session' : 'simulator'}
      />
    ) : undefined

  return { activeHeader, capabilities }
}
