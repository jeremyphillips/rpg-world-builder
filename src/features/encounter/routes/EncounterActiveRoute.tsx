import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import {
  AppToast,
  ENCOUNTER_ACTIVE_HEADER_HEIGHT_CSS_VAR,
  ENCOUNTER_ACTIVE_HEADER_LAYOUT_HEIGHT_PX,
  type AppAlertTone,
} from '@/ui/primitives'
import { ZoomControl } from '@/ui/patterns'

import { areaTemplateRadiusFt } from '@/features/mechanics/domain/encounter/resolution/action/action-targeting'
import { isValidActionTarget } from '@/features/mechanics/domain/encounter'
import { getCombatantDisplayLabel } from '@/features/mechanics/domain/encounter/state'

import { buildEncounterActionToastPayload } from '../helpers/encounter-action-toast'
import { deriveEncounterSideOutcome } from '../helpers/derive-encounter-side-outcome'
import { EncounterGameOverModal } from '../components/active/modals/EncounterGameOverModal'
import { canResolveCombatActionSelection, selectValidActionIdsForTarget } from '../domain'
import {
  isAreaGridAction,
  isSelfCenteredAreaAction,
} from '../helpers/area-grid-action'
import { getCellForCombatant } from '../space/space.helpers'
import {
  actionUsesGridCreatureTargeting,
  isValidAoeOriginCell,
  selectCombatantIdsInAoeFootprint,
} from '../space/space.selectors'
import {
  AllyCombatantActivePreviewCard,
  AllyActionDrawer,
  EncounterActiveSidebar,
  EncounterGrid,
  OpponentCombatantActivePreviewCard,
  OpponentActionDrawer,
  useCloseCombatantActionDrawerOnActiveCombatantChange,
} from '../components'
import { deriveGridHoverStatusMessage } from '../helpers/deriveGridHoverStatus'
import { campaignEncounterSetupPath } from './encounterPaths'
import { useEncounterRuntime } from './EncounterRuntimeContext'

const DEFAULT_ZOOM = 1
const MIN_ZOOM = 0.25
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25

const AFFECTED_NAME_MAX = 40

export default function EncounterActiveRoute() {
  const {
    encounterState,
    campaignId,
    activeHeader,
    activeCombatant,
    activeCombatantId,
    availableActions,
    selectedActionId,
    setSelectedActionId,
    selectedCasterOptions,
    setSelectedCasterOptions,
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
  } = useEncounterRuntime()

  const [toastPayload, setToastPayload] = useState<{
    title: string
    tone: AppAlertTone
    narrative: string
    mechanics: string
  } | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
  const [placementError, setPlacementError] = useState<string | null>(null)
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

  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM)), [])
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM)), [])
  const handleZoomReset = useCallback(() => {
    setZoom(DEFAULT_ZOOM)
    setPan({ x: 0, y: 0 })
  }, [])

  const combatantRoster = useMemo(
    () => (encounterState ? Object.values(encounterState.combatantsById) : []),
    [encounterState],
  )

  const targetCombatant = useMemo(() => {
    if (!encounterState || !selectedActionTargetId) return null
    return encounterState.combatantsById[selectedActionTargetId] ?? null
  }, [encounterState, selectedActionTargetId])

  const targetValidation = useMemo(() => {
    if (!encounterState || !activeCombatant || !targetCombatant) return undefined
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
        if (!nextTarget || !action || !isValidActionTarget(encounterState, nextTarget, activeCombatant, action)) {
          setSelectedActionId('')
        }
      }
    },
    [encounterState, activeCombatant, availableActions, selectedActionId, setSelectedActionTargetId, setSelectedActionId],
  )

  const handleSelectAction = useCallback(
    (actionId: string) => {
      const action = availableActions.find((a) => a.id === actionId)
      setSelectedActionId(actionId)
      setPlacementError(null)

      if (isAreaGridAction(action)) {
        setSelectedActionTargetId('')
        if (!encounterState?.space || !encounterState.placements || !activeCombatantId || !action?.areaTemplate) {
          resetAoePlacement()
          return
        }
        if (isSelfCenteredAreaAction(action)) {
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
      }
    },
    [
      availableActions,
      encounterState,
      activeCombatantId,
      setSelectedActionId,
      setSelectedActionTargetId,
      setAoeOriginCellId,
      setAoeStep,
      resetAoePlacement,
    ],
  )

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
      }),
    [
      selectedActionId,
      selectedAction,
      availableActions,
      aoeStep,
      aoeOriginCellId,
      selectedActionTargetId,
    ],
  )

  const handleCloseDrawer = useCallback(() => {
    resetAoePlacement()
    setSelectedActionId('')
    setActionDrawerOpen(false)
  }, [resetAoePlacement, setSelectedActionId, setActionDrawerOpen])

  const handleCloseDrawerOnTurnChange = useCallback(() => {
    handleCloseDrawer()
    setSelectedActionTargetId('')
  }, [handleCloseDrawer, setSelectedActionTargetId])

  useCloseCombatantActionDrawerOnActiveCombatantChange(activeCombatantId, handleCloseDrawerOnTurnChange)

  const handleCancelAoe = useCallback(() => {
    resetAoePlacement()
    setSelectedActionId('')
  }, [resetAoePlacement, setSelectedActionId])

  const handleUndoAoeSelection = useCallback(() => {
    if (!selectedAction || !isAreaGridAction(selectedAction)) return
    if (isSelfCenteredAreaAction(selectedAction)) {
      resetAoePlacement()
      setSelectedActionId('')
      return
    }
    setAoeStep('placing')
    setAoeOriginCellId(null)
  }, [selectedAction, resetAoePlacement, setSelectedActionId, setAoeStep, setAoeOriginCellId])

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

      if (
        (aoeStep === 'placing' || aoeStep === 'confirm') &&
        selectedAction &&
        isAreaGridAction(selectedAction) &&
        !isSelfCenteredAreaAction(selectedAction)
      ) {
        const space = encounterState.space
        const placements = encounterState.placements
        if (!space || !placements) return
        const casterCell = getCellForCombatant(placements, activeCombatantId)
        const castRangeFt = selectedAction.targeting?.rangeFt ?? 0
        if (!casterCell || !isValidAoeOriginCell(space, casterCell, cellId, castRangeFt)) {
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
      selectedAction,
      handleMoveCombatant,
      handleSelectTarget,
      setAoeOriginCellId,
      setAoeStep,
      setActionDrawerOpen,
    ],
  )

  const handleCellHover = useCallback(
    (cellId: string | null) => {
      setAoeHoverCellId(cellId)
    },
    [setAoeHoverCellId],
  )

  const movementHighlightActive = useMemo(
    () =>
      (activeCombatant?.turnResources?.movementRemaining ?? 0) > 0 && interactionMode !== 'aoe-place',
    [activeCombatant, interactionMode],
  )

  const creatureTargetingActive = useMemo(() => {
    if (!selectedAction) return false
    if (
      aoeStep !== 'none' &&
      isAreaGridAction(selectedAction) &&
      !isSelfCenteredAreaAction(selectedAction)
    ) {
      return false
    }
    return actionUsesGridCreatureTargeting(selectedAction)
  }, [selectedAction, aoeStep])

  const gridHoverStatusMessage = useMemo(
    () =>
      deriveGridHoverStatusMessage({
        encounterState,
        activeCombatantId,
        activeCombatant,
        hoveredCellId: aoeHoverCellId,
        selectedAction,
        aoeStep,
        movementHighlightActive,
      }),
    [
      encounterState,
      activeCombatantId,
      activeCombatant,
      aoeHoverCellId,
      selectedAction,
      aoeStep,
      movementHighlightActive,
    ],
  )

  if (!encounterState) {
    if (campaignId) return <Navigate to={campaignEncounterSetupPath(campaignId)} replace />
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
    targetCombatant,
    allCombatants: combatantRoster,
    targetLabel: targetCombatant ? getCombatantDisplayLabel(targetCombatant, combatantRoster) : undefined,
    canResolveAction,
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
  }

  return (
    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {activeHeader}

      {gridHoverStatusMessage && (
        <Typography
          variant="caption"
          component="div"
          role="status"
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `calc(var(${ENCOUNTER_ACTIVE_HEADER_HEIGHT_CSS_VAR}, ${ENCOUNTER_ACTIVE_HEADER_LAYOUT_HEIGHT_PX}px))`,
            zIndex: (theme) => theme.zIndex.appBar,
            px: 2,
            py: 0.5,
            minHeight: 26,
            textAlign: 'center',
            color: 'text.secondary',
            fontWeight: 600,
            pointerEvents: 'none',
            textShadow: (theme) => `0 1px 0 ${theme.palette.background.paper}`,
          }}
        >
          {gridHoverStatusMessage}
        </Typography>
      )}

      <EncounterGameOverModal
        open={gameOverOpen}
        outcome={encounterOutcome}
        onClose={() => setGameOverDismissed(true)}
        onResetEncounter={() => {
          setGameOverDismissed(false)
          handleResetEncounter()
        }}
      />

      <AppToast
        open={toastOpen && toastPayload != null}
        onClose={() => setToastOpen(false)}
        title={toastPayload?.title ?? ''}
        tone={toastPayload?.tone ?? 'info'}
        mechanics={toastPayload?.mechanics || undefined}
      >
        {toastPayload?.narrative || undefined}
      </AppToast>

      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {gridViewModel && (
          <EncounterGrid
            grid={gridViewModel}
            zoom={zoom}
            pan={pan}
            onPanChange={setPan}
            renderTokenPopover={renderTokenPopover}
            onCellClick={handleCellClick}
            onCellHover={handleCellHover}
            hoveredCellId={aoeHoverCellId}
            movementHighlightActive={movementHighlightActive}
            hasMovementRemaining={(activeCombatant?.turnResources?.movementRemaining ?? 0) > 0}
            creatureTargetingActive={creatureTargetingActive}
          />
        )}

        <ZoomControl
          zoom={zoom}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleZoomReset}
        />

        <EncounterActiveSidebar
          encounterState={encounterState}
          monstersById={monstersById}
          characterPortraitById={characterPortraitById}
          activeCombatantId={activeCombatantId}
          selectedTargetId={selectedActionTargetId}
          onSelectTarget={(combatantId) => {
            handleSelectTarget(combatantId)
            setActionDrawerOpen(true)
          }}
        />
      </Box>

      {actionDrawerCombatant && (
        actionDrawerCombatant.side === 'party' ? (
          <AllyActionDrawer {...drawerProps} />
        ) : (
          <OpponentActionDrawer {...drawerProps} />
        )
      )}
    </Box>
  )
}
