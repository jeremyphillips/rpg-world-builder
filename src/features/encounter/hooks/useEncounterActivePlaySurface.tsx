import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { AppToast, type AppAlertTone } from '@/ui/primitives'
import { useCanvasZoom, useCanvasPan } from '@/ui/hooks'

import { CombatPlayView } from '@/features/combat/components/CombatPlayView'

import { areaTemplateRadiusFt } from '@/features/mechanics/domain/combat/resolution/action/action-targeting'
import {
  isValidActionTarget,
  actionRequiresCreatureTargetForResolve,
  getPrimaryResolutionMissing,
} from '@/features/mechanics/domain/combat'
import {
  getSingleCellPlacementRequirement,
  validateSingleCellPlacement,
  type PlacementValidationReason,
} from '@/features/mechanics/domain/combat/resolution/action/action-requirement-model'
import { getCombatantDisplayLabel } from '@/features/mechanics/domain/combat/state'
import { buildInitialCasterOptionsForAction } from '@/features/mechanics/domain/spells/caster-options'

import { buildEncounterActionToastPayload } from '../helpers/actions'
import { deriveEncounterSideOutcome } from '../helpers/state'
import { EncounterGameOverModal } from '../components/active/modals/EncounterGameOverModal'
import { canResolveCombatActionSelection, selectValidActionIdsForTarget } from '../domain'
import {
  isAreaGridAction,
  isSelfCenteredAreaAction,
  resolveAttachedEmanationAnchorModeFromSelection,
} from '../helpers/actions'
import { findGridObstacleAtCell, formatGridCellLabel, getCellForCombatant } from '@/features/mechanics/domain/combat/space/space.helpers'
import {
  actionUsesGridCreatureTargeting,
  isValidAoeOriginCell,
  selectCombatantIdsInAoeFootprint,
} from '@/features/mechanics/domain/combat/space/selectors/space.selectors'
import {
  AllyCombatantActivePreviewCard,
  AllyActionDrawer,
  EncounterActiveSidebar,
  EncounterGrid,
  OpponentCombatantActivePreviewCard,
  OpponentActionDrawer,
  useCloseCombatantActionDrawerOnActiveCombatantChange,
} from '../components'
import type { CombatantActionDrawerProps } from '../components/active/drawers/CombatantActionDrawer'
import { deriveGridHoverStatusMessage } from '../helpers/ui'
import type { EncounterRuntimeContextValue } from '../routes/EncounterRuntimeContext'

export type EncounterActivePlaySurfaceDeps = Pick<
  EncounterRuntimeContextValue,
  | 'encounterState'
  | 'activeHeader'
  | 'activeCombatant'
  | 'activeCombatantId'
  | 'availableActions'
  | 'selectedActionId'
  | 'setSelectedActionId'
  | 'selectedCasterOptions'
  | 'setSelectedCasterOptions'
  | 'selectedSingleCellPlacementCellId'
  | 'setSelectedSingleCellPlacementCellId'
  | 'selectedActionTargetId'
  | 'setSelectedActionTargetId'
  | 'selectedAction'
  | 'aoeStep'
  | 'setAoeStep'
  | 'aoeOriginCellId'
  | 'setAoeOriginCellId'
  | 'aoeHoverCellId'
  | 'setAoeHoverCellId'
  | 'resetAoePlacement'
  | 'gridViewModel'
  | 'combatantViewerPresentationKindById'
  | 'handleMoveCombatant'
  | 'handleResolveAction'
  | 'handleNextTurn'
  | 'registerCombatLogAppended'
  | 'handleResetEncounter'
  | 'actionDrawerOpen'
  | 'setActionDrawerOpen'
  | 'monstersById'
  | 'characterPortraitById'
  | 'interactionMode'
  | 'setInteractionMode'
  | 'singleCellPlacementHoverCellId'
  | 'setSingleCellPlacementHoverCellId'
  | 'unaffectedCombatantIds'
  | 'setUnaffectedCombatantIds'
  | 'selectedObjectAnchorId'
  | 'setSelectedObjectAnchorId'
  | 'objectAnchorHoverCellId'
  | 'setObjectAnchorHoverCellId'
  | 'suppressSameSideHostile'
  | 'spellsById'
>

function placementReasonMessage(reason: PlacementValidationReason): string {
  switch (reason) {
    case 'out-of-range':
      return 'Out of range'
    case 'no-line-of-sight':
      return 'No line of sight'
    case 'occupied':
      return 'Cell occupied'
    case 'invalid-terrain':
      return 'Invalid terrain'
    default:
      return 'Invalid placement'
  }
}

const AFFECTED_NAME_MAX = 40

export type UseEncounterActivePlaySurfaceOptions = {
  /** When set and encounter state is missing, redirect (Encounter Simulator → setup). */
  setupPathWhenEmpty?: string | null
}

export function useEncounterActivePlaySurface(
  {
    encounterState,
    activeHeader,
    activeCombatant,
    activeCombatantId,
    availableActions,
    selectedActionId,
    setSelectedActionId,
    selectedCasterOptions,
    setSelectedCasterOptions,
    selectedSingleCellPlacementCellId,
    setSelectedSingleCellPlacementCellId,
    selectedActionTargetId,
    setSelectedActionTargetId,
    selectedAction,
    aoeStep,
    setAoeStep,
    aoeOriginCellId,
    setAoeOriginCellId,
    aoeHoverCellId,
    setAoeHoverCellId,
    resetAoePlacement,
    gridViewModel,
    combatantViewerPresentationKindById,
    handleMoveCombatant,
    handleResolveAction,
    handleNextTurn,
    registerCombatLogAppended,
    handleResetEncounter,
    actionDrawerOpen,
    setActionDrawerOpen,
    monstersById,
    characterPortraitById,
    interactionMode,
    setInteractionMode,
    singleCellPlacementHoverCellId,
    setSingleCellPlacementHoverCellId,
    unaffectedCombatantIds,
    setUnaffectedCombatantIds,
    selectedObjectAnchorId,
    setSelectedObjectAnchorId,
    objectAnchorHoverCellId,
    setObjectAnchorHoverCellId,
    suppressSameSideHostile,
    spellsById,
  }: EncounterActivePlaySurfaceDeps,
  options?: UseEncounterActivePlaySurfaceOptions,
) {
  const [toastPayload, setToastPayload] = useState<{
    title: string
    tone: AppAlertTone
    narrative: string
    mechanics: string
  } | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
  const [placementError, setPlacementError] = useState<string | null>(null)
  const [singleCellPlacementError, setSingleCellPlacementError] = useState<string | null>(null)
  const [gameOverDismissed, setGameOverDismissed] = useState(false)

  const encounterOutcome = useMemo(() => deriveEncounterSideOutcome(encounterState), [encounterState])

  useEffect(() => {
    if (!encounterState) setGameOverDismissed(false)
  }, [encounterState])

  useEffect(() => {
    if (encounterOutcome.kind === 'ongoing') setGameOverDismissed(false)
  }, [encounterOutcome.kind])

  const gameOverOpen =
    encounterOutcome.kind !== 'ongoing' && !gameOverDismissed && encounterState != null


  useEffect(() => {
    registerCombatLogAppended((events, stateAfter) => {
      const payload = buildEncounterActionToastPayload(events, stateAfter)
      if (payload) {
        setToastPayload(payload)
        setToastOpen(true)
      }
    })
    return () => registerCombatLogAppended(undefined)
  }, [registerCombatLogAppended])

  const { zoom, zoomControlProps, wheelContainerRef, bindResetPan } = useCanvasZoom()
  const { pan, isDragging, hasDragMoved, pointerHandlers, resetPan } = useCanvasPan()
  useEffect(() => { bindResetPan(resetPan) }, [bindResetPan, resetPan])

  const combatantRoster = useMemo(
    () => (encounterState ? Object.values(encounterState.combatantsById) : []),
    [encounterState],
  )

  const unaffectedCombatantOptions = useMemo(() => {
    if (!encounterState?.combatantsById || !activeCombatantId) return []
    const roster = Object.values(encounterState.combatantsById)
    return roster
      .filter((c) => c.instanceId !== activeCombatantId)
      .map((c) => ({
        id: c.instanceId,
        label: getCombatantDisplayLabel(c, roster),
        subtitle: c.side === 'party' ? 'Ally' : 'Enemy',
        imageKey: c.portraitImageKey ?? null,
      }))
  }, [encounterState, activeCombatantId])

  const attachedEmanationSetup = useMemo((): CombatantActionDrawerProps['attachedEmanationSetup'] => {
    if (!selectedAction?.attachedEmanation || !encounterState || !activeCombatantId) return null
    return {
      activeCombatantId,
      allCombatants: combatantRoster,
      combatantOptions: unaffectedCombatantOptions,
      unaffectedCombatantIds,
      onUnaffectedChange: setUnaffectedCombatantIds,
      suppressSameSideHostile,
      partyCombatantIds: encounterState.partyCombatantIds,
    }
  }, [
    selectedAction?.attachedEmanation,
    encounterState,
    activeCombatantId,
    combatantRoster,
    unaffectedCombatantOptions,
    unaffectedCombatantIds,
    setUnaffectedCombatantIds,
    suppressSameSideHostile,
  ])

  const placementCellSummaryLabel = useMemo(() => {
    if (!encounterState?.space || !selectedSingleCellPlacementCellId) return null
    return formatGridCellLabel(encounterState.space, selectedSingleCellPlacementCellId)
  }, [encounterState, selectedSingleCellPlacementCellId])

  const targetCombatant = useMemo(() => {
    if (!encounterState || !selectedActionTargetId) return null
    return encounterState.combatantsById[selectedActionTargetId] ?? null
  }, [encounterState, selectedActionTargetId])

  const targetValidation = useMemo(() => {
    if (!encounterState || !activeCombatant) return undefined
    return selectValidActionIdsForTarget(encounterState, activeCombatant, targetCombatant, availableActions)
  }, [encounterState, activeCombatant, targetCombatant, availableActions])

  const validActionIdsForTarget = targetValidation?.validIds
  const invalidActionReasons = targetValidation?.invalidReasons

  const handleSelectTarget = useCallback(
    (nextTargetId: string) => {
      setSelectedActionTargetId(nextTargetId)

      if (selectedActionId && encounterState && activeCombatant) {
        const nextTarget = encounterState.combatantsById[nextTargetId]
        const action = availableActions.find((a) => a.id === selectedActionId)
        if (!action) {
          setSelectedActionId('')
        } else if (actionRequiresCreatureTargetForResolve(action, selectedCasterOptions)) {
          if (!nextTarget || !isValidActionTarget(encounterState, nextTarget, activeCombatant, action)) {
            setSelectedActionId('')
          }
        }
      }
    },
    [
      encounterState,
      activeCombatant,
      availableActions,
      selectedActionId,
      selectedCasterOptions,
      setSelectedActionTargetId,
      setSelectedActionId,
    ],
  )

  const handleSelectAction = useCallback(
    (actionId: string) => {
      const action = availableActions.find((a) => a.id === actionId)
      setSelectedActionId(actionId)
      setPlacementError(null)
      setSelectedObjectAnchorId(null)
      setObjectAnchorHoverCellId(null)

      if (action?.attachedEmanation) {
        if (suppressSameSideHostile && encounterState && activeCombatantId) {
          setUnaffectedCombatantIds(encounterState.partyCombatantIds.filter((id) => id !== activeCombatantId))
        } else {
          setUnaffectedCombatantIds([])
        }
      } else {
        setUnaffectedCombatantIds([])
      }

      if (action?.attachedEmanation?.anchorMode === 'object') {
        setSelectedActionTargetId('')
        resetAoePlacement()
        setInteractionMode('object-anchor-select')
        return
      }

      const initialOpts = action ? buildInitialCasterOptionsForAction(action) : {}

      if (action?.attachedEmanation?.anchorMode === 'place-or-object') {
        setSelectedActionTargetId('')
        if (resolveAttachedEmanationAnchorModeFromSelection(action, initialOpts) === 'object') {
          resetAoePlacement()
          setInteractionMode('object-anchor-select')
          return
        }
      }

      if (isAreaGridAction(action, initialOpts)) {
        setSelectedActionTargetId('')
        if (!encounterState?.space || !encounterState.placements || !activeCombatantId || !action?.areaTemplate) {
          resetAoePlacement()
          return
        }
        if (isSelfCenteredAreaAction(action, initialOpts)) {
          const cell = getCellForCombatant(encounterState.placements, activeCombatantId)
          if (cell) {
            setAoeOriginCellId(cell)
            setAoeStep('confirm')
          } else {
            resetAoePlacement()
          }
        } else {
          setAoeOriginCellId(null)
          setAoeStep('placing')
        }
      } else {
        resetAoePlacement()
        setInteractionMode('select-target')
        setSingleCellPlacementHoverCellId(null)
        setSingleCellPlacementError(null)
      }
    },
    [
      availableActions,
      encounterState,
      activeCombatantId,
      suppressSameSideHostile,
      setUnaffectedCombatantIds,
      setSelectedActionId,
      setSelectedActionTargetId,
      setAoeOriginCellId,
      setAoeStep,
      resetAoePlacement,
      setInteractionMode,
      setSingleCellPlacementHoverCellId,
      setSingleCellPlacementError,
      setSelectedObjectAnchorId,
      setObjectAnchorHoverCellId,
    ],
  )

  const prevPlaceOrObjectAnchorRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const action = availableActions.find((a) => a.id === selectedActionId)
    const ae = action?.attachedEmanation
    if (!ae || ae.anchorMode !== 'place-or-object') {
      prevPlaceOrObjectAnchorRef.current = undefined
      return
    }
    const fid = ae.anchorChoiceFieldId
    if (!fid) return
    const v = selectedCasterOptions[fid]?.trim() ?? ''
    if (v === prevPlaceOrObjectAnchorRef.current) return
    prevPlaceOrObjectAnchorRef.current = v
    if (v === 'object') {
      resetAoePlacement()
      setSelectedObjectAnchorId(null)
      setInteractionMode('object-anchor-select')
    } else if (v === 'place') {
      setInteractionMode('aoe-place')
      if (encounterState?.space && encounterState.placements && activeCombatantId && action.areaTemplate) {
        setAoeOriginCellId(null)
        setAoeStep('placing')
      }
    }
  }, [
    selectedCasterOptions,
    selectedActionId,
    availableActions,
    encounterState?.space,
    encounterState?.placements,
    activeCombatantId,
    resetAoePlacement,
    setAoeOriginCellId,
    setAoeStep,
    setInteractionMode,
    setSelectedObjectAnchorId,
  ])

  const aoeAffectedSummary = useMemo(() => {
    if (!encounterState || !selectedAction?.areaTemplate || (aoeStep !== 'confirm' && aoeStep !== 'placing')) {
      return { names: [] as string[], total: 0, overflow: 0 }
    }
    const r = areaTemplateRadiusFt(selectedAction.areaTemplate)
    const space = encounterState.space
    const placements = encounterState.placements
    let previewOrigin: string | null = null
    if (space && placements && activeCombatantId) {
      const casterCell = getCellForCombatant(placements, activeCombatantId)
      const castRangeFt = selectedAction.targeting?.rangeFt ?? 0
      const hoverValid =
        Boolean(
          casterCell &&
            aoeHoverCellId &&
            isValidAoeOriginCell(space, casterCell, aoeHoverCellId, castRangeFt),
        )
      if (hoverValid && aoeHoverCellId) {
        previewOrigin = aoeHoverCellId
      } else if (aoeStep === 'confirm' && aoeOriginCellId) {
        previewOrigin = aoeOriginCellId
      }
    }
    if (!previewOrigin) {
      return { names: [] as string[], total: 0, overflow: 0 }
    }
    const ids = selectCombatantIdsInAoeFootprint(encounterState, previewOrigin, r)
    const roster = Object.values(encounterState.combatantsById)
    const names = ids
      .map((id) => {
        const c = encounterState.combatantsById[id]
        return c ? getCombatantDisplayLabel(c, roster) : undefined
      })
      .filter((n): n is string => Boolean(n))
    const total = names.length
    const shown = names.slice(0, AFFECTED_NAME_MAX)
    const overflow = Math.max(0, total - shown.length)
    return { names: shown, total, overflow }
  }, [encounterState, selectedAction, aoeOriginCellId, aoeHoverCellId, aoeStep, activeCombatantId])

  const canResolveAction = useMemo(
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

  const primaryResolutionMissing = useMemo(
    () =>
      getPrimaryResolutionMissing(selectedAction, {
        selectedActionTargetId,
        aoeStep,
        aoeOriginCellId,
        selectedCasterOptions,
        selectedSingleCellPlacementCellId,
        selectedObjectAnchorId,
        encounterState,
        activeCombatant,
      }),
    [
      selectedAction,
      selectedActionTargetId,
      aoeStep,
      aoeOriginCellId,
      selectedCasterOptions,
      selectedSingleCellPlacementCellId,
      selectedObjectAnchorId,
      encounterState,
      activeCombatant,
    ],
  )

  const handleCloseDrawer = useCallback(() => {
    resetAoePlacement()
    setInteractionMode('select-target')
    setSingleCellPlacementHoverCellId(null)
    setSingleCellPlacementError(null)
    setSelectedObjectAnchorId(null)
    setObjectAnchorHoverCellId(null)
    setUnaffectedCombatantIds([])
    setSelectedActionId('')
    setActionDrawerOpen(false)
  }, [
    resetAoePlacement,
    setInteractionMode,
    setSingleCellPlacementHoverCellId,
    setSelectedObjectAnchorId,
    setObjectAnchorHoverCellId,
    setUnaffectedCombatantIds,
    setSelectedActionId,
    setActionDrawerOpen,
  ])

  const handleCloseDrawerOnTurnChange = useCallback(() => {
    handleCloseDrawer()
    setSelectedActionTargetId('')
    setSelectedObjectAnchorId(null)
    setObjectAnchorHoverCellId(null)
  }, [handleCloseDrawer, setSelectedActionTargetId, setSelectedObjectAnchorId, setObjectAnchorHoverCellId])

  useCloseCombatantActionDrawerOnActiveCombatantChange(activeCombatantId, handleCloseDrawerOnTurnChange)

  const handleCancelAoe = useCallback(() => {
    resetAoePlacement()
    setSelectedActionId('')
  }, [resetAoePlacement, setSelectedActionId])

  const handleUndoAoeSelection = useCallback(() => {
    if (!selectedAction || !isAreaGridAction(selectedAction, selectedCasterOptions)) return
    if (isSelfCenteredAreaAction(selectedAction, selectedCasterOptions)) {
      resetAoePlacement()
      setSelectedActionId('')
      return
    }
    setAoeStep('placing')
    setAoeOriginCellId(null)
  }, [
    selectedAction,
    selectedCasterOptions,
    resetAoePlacement,
    setSelectedActionId,
    setAoeStep,
    setAoeOriginCellId,
  ])

  const renderTokenPopover = useCallback(
    (occupantId: string) => {
      if (!encounterState) return null
      const combatant = encounterState.combatantsById[occupantId]
      if (!combatant) return null
      const roster = Object.values(encounterState.combatantsById)

      if (combatant.side === 'party') {
        return (
          <AllyCombatantActivePreviewCard
            combatant={combatant}
            monstersById={monstersById}
            characterPortraitById={characterPortraitById}
            allCombatants={roster}
            isCurrentTurn={occupantId === activeCombatantId}
          />
        )
      }
      return (
        <OpponentCombatantActivePreviewCard
          combatant={combatant}
          monstersById={monstersById}
          characterPortraitById={characterPortraitById}
          allCombatants={roster}
          isCurrentTurn={occupantId === activeCombatantId}
        />
      )
    },
    [encounterState, activeCombatantId, monstersById, characterPortraitById],
  )

  const handleCellClick = useCallback(
    (cellId: string) => {
      if (!encounterState || !activeCombatantId) return

      if (interactionMode === 'single-cell-place') {
        const space = encounterState.space
        const placements = encounterState.placements
        if (!space || !placements || !selectedAction) return
        const req = getSingleCellPlacementRequirement(selectedAction)
        if (!req) return
        const casterCell = getCellForCombatant(placements, activeCombatantId)
        if (!casterCell) return
        const v = validateSingleCellPlacement(space, placements, casterCell, cellId, req)
        if (!v.isValid) {
          setSingleCellPlacementError(placementReasonMessage(v.reasons[0] ?? 'out-of-range'))
          return
        }
        setSingleCellPlacementError(null)
        setSelectedSingleCellPlacementCellId(cellId)
        return
      }

      if (interactionMode === 'object-anchor-select') {
        const space = encounterState.space
        if (!space) return
        const obstacle = findGridObstacleAtCell(space, cellId)
        if (obstacle) {
          setPlacementError(null)
          setSelectedObjectAnchorId(obstacle.id)
        }
        return
      }

      if (
        (aoeStep === 'placing' || aoeStep === 'confirm') &&
        selectedAction &&
        isAreaGridAction(selectedAction, selectedCasterOptions) &&
        !isSelfCenteredAreaAction(selectedAction, selectedCasterOptions)
      ) {
        const space = encounterState.space
        const placements = encounterState.placements
        if (!space || !placements) return
        const casterCell = getCellForCombatant(placements, activeCombatantId)
        const castRangeFt = selectedAction.targeting?.rangeFt ?? 0
        if (!casterCell) return

        if (aoeStep === 'confirm' && aoeOriginCellId === cellId) {
          setPlacementError(null)
          setAoeOriginCellId(null)
          setAoeStep('placing')
          return
        }

        if (!isValidAoeOriginCell(space, casterCell, cellId, castRangeFt)) {
          setPlacementError('Choose a valid point within range (not blocked).')
          return
        }
        setPlacementError(null)
        setAoeOriginCellId(cellId)
        setAoeStep('confirm')
        return
      }

      const occupant = encounterState.placements?.find((p) => p.cellId === cellId)
      if (occupant) {
        handleSelectTarget(occupant.combatantId)
        setActionDrawerOpen(true)
      } else {
        handleMoveCombatant(cellId)
      }
    },
    [
      encounterState,
      activeCombatantId,
      aoeStep,
      aoeOriginCellId,
      selectedAction,
      selectedCasterOptions,
      interactionMode,
      handleMoveCombatant,
      handleSelectTarget,
      setAoeOriginCellId,
      setAoeStep,
      setActionDrawerOpen,
      setSelectedSingleCellPlacementCellId,
      setSingleCellPlacementError,
      setSelectedObjectAnchorId,
    ],
  )

  const handleCellHover = useCallback(
    (cellId: string | null) => {
      if (interactionMode === 'single-cell-place') {
        setSingleCellPlacementHoverCellId(cellId)
      } else if (interactionMode === 'object-anchor-select') {
        setObjectAnchorHoverCellId(cellId)
      } else {
        setAoeHoverCellId(cellId)
      }
    },
    [interactionMode, setAoeHoverCellId, setSingleCellPlacementHoverCellId, setObjectAnchorHoverCellId],
  )

  const movementHighlightActive = useMemo(
    () =>
      (activeCombatant?.turnResources?.movementRemaining ?? 0) > 0 &&
      interactionMode !== 'aoe-place' &&
      interactionMode !== 'single-cell-place' &&
      interactionMode !== 'object-anchor-select',
    [activeCombatant, interactionMode],
  )

  const creatureTargetingActive = useMemo(() => {
    if (interactionMode === 'single-cell-place' || interactionMode === 'object-anchor-select') return false
    if (!selectedAction) return false
    if (
      aoeStep !== 'none' &&
      isAreaGridAction(selectedAction, selectedCasterOptions) &&
      !isSelfCenteredAreaAction(selectedAction, selectedCasterOptions)
    ) {
      return false
    }
    return actionUsesGridCreatureTargeting(selectedAction)
  }, [selectedAction, selectedCasterOptions, aoeStep, interactionMode])

  const gridHoverStatusMessage = useMemo(
    () =>
      deriveGridHoverStatusMessage({
        encounterState,
        activeCombatantId,
        activeCombatant,
        hoveredCellId:
          interactionMode === 'single-cell-place'
            ? singleCellPlacementHoverCellId
            : interactionMode === 'object-anchor-select'
              ? objectAnchorHoverCellId
              : aoeHoverCellId,
        selectedAction,
        selectedCasterOptions,
        aoeStep,
        movementHighlightActive,
        interactionMode,
      }),
    [
      encounterState,
      activeCombatantId,
      activeCombatant,
      aoeHoverCellId,
      singleCellPlacementHoverCellId,
      objectAnchorHoverCellId,
      selectedAction,
      selectedCasterOptions,
      aoeStep,
      movementHighlightActive,
      interactionMode,
    ],
  )

  /** Must run unconditionally — do not place after an early return (Rules of Hooks). */
  const spatialPresentation = useMemo(
    () =>
      encounterState && spellsById
        ? {
            encounterState,
            battlefieldSpell: {
              spellLookup: (id: string) => spellsById[id],
              suppressSameSideHostile,
            },
          }
        : undefined,
    [encounterState, spellsById, suppressSameSideHostile],
  )

  if (!encounterState) {
    if (options?.setupPathWhenEmpty) return <Navigate to={options.setupPathWhenEmpty} replace />
    return null
  }

  const actionDrawerCombatant = activeCombatant

  const drawerProps = {
    open: actionDrawerOpen,
    onClose: handleCloseDrawer,
    monstersById,
    characterPortraitById,
    combatant: actionDrawerCombatant!,
    drawerTitle: getCombatantDisplayLabel(actionDrawerCombatant!, combatantRoster),
    availableActions,
    validActionIdsForTarget,
    invalidActionReasons,
    selectedActionId,
    onSelectAction: handleSelectAction,
    selectedCasterOptions,
    onCasterOptionsChange: setSelectedCasterOptions,
    selectedSingleCellPlacementCellId,
    onSelectedSingleCellPlacementCellIdChange: setSelectedSingleCellPlacementCellId,
    placementCellSummaryLabel,
    singleCellPlacementError,
    onDismissSingleCellPlacementError: () => setSingleCellPlacementError(null),
    onEnterSingleCellPlacementMode: () => {
      setSingleCellPlacementError(null)
      setInteractionMode('single-cell-place')
    },
    onExitSingleCellPlacementMode: () => {
      setInteractionMode('select-target')
      setSingleCellPlacementHoverCellId(null)
    },
    targetCombatant,
    allCombatants: combatantRoster,
    targetLabel: targetCombatant ? getCombatantDisplayLabel(targetCombatant, combatantRoster) : undefined,
    canResolveAction,
    primaryResolutionMissingMessage: primaryResolutionMissing?.message,
    onResolveAction: handleResolveAction,
    onEndTurn: handleNextTurn,
    aoeStep,
    aoePlacementError: placementError,
    onDismissAoeError: () => setPlacementError(null),
    aoeAffectedNames: aoeAffectedSummary.names,
    aoeAffectedTotal: aoeAffectedSummary.total,
    aoeAffectedOverflow: aoeAffectedSummary.overflow,
    onCancelAoe: handleCancelAoe,
    onUndoAoeSelection: handleUndoAoeSelection,
    attachedEmanationSetup,
    spatialPresentation,
  }

  return (
    <CombatPlayView
      activeHeader={activeHeader}
      gridHoverStatusMessage={gridHoverStatusMessage}
      gameOverModal={
        <EncounterGameOverModal
          open={gameOverOpen}
          outcome={encounterOutcome}
          onClose={() => setGameOverDismissed(true)}
          onResetEncounter={() => {
            setGameOverDismissed(false)
            handleResetEncounter()
          }}
        />
      }
      toast={
        <AppToast
          open={toastOpen && toastPayload != null}
          onClose={() => setToastOpen(false)}
          title={toastPayload?.title ?? ''}
          tone={toastPayload?.tone ?? 'info'}
          mechanics={toastPayload?.mechanics || undefined}
        >
          {toastPayload?.narrative || undefined}
        </AppToast>
      }
      wheelContainerRef={wheelContainerRef}
      zoomControlProps={zoomControlProps}
      encounterGrid={
        gridViewModel ? (
          <EncounterGrid
            grid={gridViewModel}
            zoom={zoom}
            pan={pan}
            panPointerHandlers={pointerHandlers}
            isDragging={isDragging}
            hasDragMoved={hasDragMoved}
            renderTokenPopover={renderTokenPopover}
            onCellClick={handleCellClick}
            onCellHover={handleCellHover}
            hoveredCellId={
              interactionMode === 'single-cell-place'
                ? singleCellPlacementHoverCellId
                : interactionMode === 'object-anchor-select'
                  ? objectAnchorHoverCellId
                  : aoeHoverCellId
            }
            movementHighlightActive={movementHighlightActive}
            hasMovementRemaining={(activeCombatant?.turnResources?.movementRemaining ?? 0) > 0}
            creatureTargetingActive={creatureTargetingActive}
            singleCellPlacementPickActive={interactionMode === 'single-cell-place'}
            objectAnchorPickActive={interactionMode === 'object-anchor-select'}
          />
        ) : null
      }
      encounterActiveSidebar={
        <EncounterActiveSidebar
          encounterState={encounterState}
          monstersById={monstersById}
          characterPortraitById={characterPortraitById}
          activeCombatantId={activeCombatantId}
          selectedTargetId={selectedActionTargetId}
          spellsById={spellsById}
          suppressSameSideHostile={suppressSameSideHostile}
          combatantViewerPresentationKindById={combatantViewerPresentationKindById}
          onSelectTarget={(combatantId) => {
            handleSelectTarget(combatantId)
            setActionDrawerOpen(true)
          }}
        />
      }
      actionDrawer={
        actionDrawerCombatant ? (
          actionDrawerCombatant.side === 'party' ? (
            <AllyActionDrawer {...drawerProps} />
          ) : (
            <OpponentActionDrawer {...drawerProps} />
          )
        ) : null
      }
    />
  )
}
