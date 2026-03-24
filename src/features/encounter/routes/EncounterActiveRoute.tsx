import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

import Box from '@mui/material/Box'

import { AppToast, type AppAlertTone } from '@/ui/primitives'
import { ZoomControl } from '@/ui/patterns'

import { isValidActionTarget } from '@/features/mechanics/domain/encounter'

import { buildEncounterActionToastPayload } from '../helpers/encounter-action-toast'
import {
  AllyCombatantActivePreviewCard,
  AllyActionDrawer,
  EncounterActiveSidebar,
  EncounterGrid,
  OpponentCombatantActivePreviewCard,
  OpponentActionDrawer,
} from '../components'
import { campaignEncounterSetupPath } from './encounterPaths'
import { useEncounterRuntime } from './EncounterRuntimeContext'

const DEFAULT_ZOOM = 1
const MIN_ZOOM = 0.25
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25

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
    gridViewModel,
    handleMoveCombatant,
    handleResolveAction,
    handleNextTurn,
    registerCombatLogAppended,
  } = useEncounterRuntime()

  const [toastPayload, setToastPayload] = useState<{
    title: string
    tone: AppAlertTone
    narrative: string
    mechanics: string
  } | null>(null)
  const [toastOpen, setToastOpen] = useState(false)

  useEffect(() => {
    registerCombatLogAppended((events) => {
      const payload = buildEncounterActionToastPayload(events)
      if (payload) {
        setToastPayload(payload)
        setToastOpen(true)
      }
    })
    return () => registerCombatLogAppended(undefined)
  }, [registerCombatLogAppended])

  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false)

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM)), [])
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM)), [])
  const handleZoomReset = useCallback(() => {
    setZoom(DEFAULT_ZOOM)
    setPan({ x: 0, y: 0 })
  }, [])

  const targetCombatant = useMemo(() => {
    if (!encounterState || !selectedActionTargetId) return null
    return encounterState.combatantsById[selectedActionTargetId] ?? null
  }, [encounterState, selectedActionTargetId])

  const validActionIdsForTarget = useMemo(() => {
    if (!encounterState || !activeCombatant || !targetCombatant) return undefined
    const ids = new Set<string>()
    for (const action of availableActions) {
      if (isValidActionTarget(encounterState, targetCombatant, activeCombatant, action)) {
        ids.add(action.id)
      }
    }
    return ids
  }, [encounterState, activeCombatant, targetCombatant, availableActions])

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

  const canResolveAction = Boolean(
    selectedActionId &&
    selectedActionTargetId &&
    availableActions.some((a) => a.id === selectedActionId),
  )

  const renderTokenPopover = useCallback(
    (occupantId: string) => {
      if (!encounterState) return null
      const combatant = encounterState.combatantsById[occupantId]
      if (!combatant) return null

      if (combatant.side === 'party') {
        return (
          <AllyCombatantActivePreviewCard
            combatant={combatant}
            isCurrentTurn={occupantId === activeCombatantId}
          />
        )
      }
      return (
        <OpponentCombatantActivePreviewCard
          combatant={combatant}
          isCurrentTurn={occupantId === activeCombatantId}
        />
      )
    },
    [encounterState, activeCombatantId],
  )

  const handleCellClick = useCallback(
    (cellId: string) => {
      if (!encounterState) return

      const occupant = encounterState.placements?.find((p) => p.cellId === cellId)
      if (occupant) {
        handleSelectTarget(occupant.combatantId)
        setActionDrawerOpen(true)
      } else {
        handleMoveCombatant(cellId)
      }
    },
    [encounterState, handleMoveCombatant, handleSelectTarget],
  )

  if (!encounterState) {
    if (campaignId) return <Navigate to={campaignEncounterSetupPath(campaignId)} replace />
    return null
  }

  const actionDrawerCombatant = activeCombatant

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {activeHeader}

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
          <AllyActionDrawer
            open={actionDrawerOpen}
            onClose={() => setActionDrawerOpen(false)}
            combatant={actionDrawerCombatant}
            availableActions={availableActions}
            validActionIdsForTarget={validActionIdsForTarget}
            selectedActionId={selectedActionId}
            onSelectAction={setSelectedActionId}
            selectedCasterOptions={selectedCasterOptions}
            onCasterOptionsChange={setSelectedCasterOptions}
            targetLabel={targetCombatant?.source.label}
            canResolveAction={canResolveAction}
            onResolveAction={handleResolveAction}
            onEndTurn={handleNextTurn}
          />
        ) : (
          <OpponentActionDrawer
            open={actionDrawerOpen}
            onClose={() => setActionDrawerOpen(false)}
            combatant={actionDrawerCombatant}
            availableActions={availableActions}
            validActionIdsForTarget={validActionIdsForTarget}
            selectedActionId={selectedActionId}
            onSelectAction={setSelectedActionId}
            selectedCasterOptions={selectedCasterOptions}
            onCasterOptionsChange={setSelectedCasterOptions}
            targetLabel={targetCombatant?.source.label}
            canResolveAction={canResolveAction}
            onResolveAction={handleResolveAction}
            onEndTurn={handleNextTurn}
          />
        )
      )}
    </Box>
  )
}
