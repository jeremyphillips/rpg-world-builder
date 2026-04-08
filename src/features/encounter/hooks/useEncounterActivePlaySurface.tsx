import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useTheme } from '@mui/material/styles'

import { AppToast } from '@/ui/primitives'
import { useCanvasZoom, useCanvasPan } from '@/ui/hooks'

import { CombatGrid } from '@/features/combat/components/grid/CombatGrid'
import { CombatPlayView } from '@/features/combat/components/CombatPlayView'

import { areaTemplateRadiusFt } from '@/features/mechanics/domain/combat/resolution/action/action-targeting'
import {
  isValidActionTarget,
  actionRequiresCreatureTargetForResolve,
  getPrimaryResolutionMissing,
  isPickLockDoorSelectionValid,
  resolvePickLockAvailability,
} from '@/features/mechanics/domain/combat'
import {
  getSingleCellPlacementRequirement,
  validateSingleCellPlacement,
  type PlacementValidationReason,
} from '@/features/mechanics/domain/combat/resolution/action/action-requirement-model'
import { getCombatantDisplayLabel } from '@/features/mechanics/domain/combat/state'
import { buildInitialCasterOptionsForAction } from '@/features/mechanics/domain/spells/caster-options'

import { deriveEncounterToastsFromNewLogSlice } from '../toast/derive-encounter-toast-for-viewer'
import type { EncounterToastPresentation, EncounterToastViewerInput } from '../toast/encounter-toast-types'
import { deriveEncounterSideOutcome } from '../helpers/state'
import { EncounterGameOverModal } from '../components/active/modals/EncounterGameOverModal'
import {
  EncounterSceneTransitionModal,
  type EncounterSceneTransitionModalProps,
} from '../components/active/modals/EncounterSceneTransitionModal'
import { canResolveCombatActionSelection, selectValidActionIdsForTarget } from '../domain'
import {
  isAreaGridAction,
  isSelfCenteredAreaAction,
  resolveAttachedEmanationAnchorModeFromSelection,
} from '../helpers/actions'
import { findGridObjectAtCell, formatGridCellLabel, getCellForCombatant } from '@/features/mechanics/domain/combat/space/space.helpers'
import {
  actionUsesGridCreatureTargeting,
  isValidAoeOriginCell,
  selectCombatantIdsInAoeFootprint,
} from '@/features/mechanics/domain/combat/space/selectors/space.selectors'
import {
  AllyCombatantActivePreviewCard,
  AllyActionDrawer,
  EncounterActiveSidebar,
  EncounterContextPrompt,
  OpponentCombatantActivePreviewCard,
  OpponentActionDrawer,
  useCloseCombatantActionDrawerOnActiveCombatantChange,
} from '../components'
import { getEncounterUiStateTheme } from '../ui/theme/encounterUiStateTheme'
import type { CombatantActionDrawerProps } from '../components/active/drawers/CombatantActionDrawer'
import { deriveGridHoverStatusMessage } from '../helpers/ui'
import type { EncounterRuntimeContextValue } from '../routes/EncounterRuntimeContext'
import type { EncounterContextPromptEnvironment } from '../domain/encounterContextPrompt.types'
import type { CombatIntent } from '@/features/mechanics/domain/combat'
import type { CombatIntentResult } from '@/features/mechanics/domain/combat/results'
import type { EncounterState } from '@/features/mechanics/domain/combat'
import { useEncounterContextPromptStrip } from './useEncounterContextPrompt'

/** Keeps {@link EncounterSceneTransitionModal} on screen long enough to read; the apply itself is synchronous and would otherwise dismiss in the same frame. */
const MIN_SCENE_TRANSITION_MODAL_MS = 1000

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
  | 'selectedDoorCellIdA'
  | 'setSelectedDoorCellIdA'
  | 'selectedDoorCellIdB'
  | 'setSelectedDoorCellIdB'
  | 'suppressSameSideHostile'
  | 'spellsById'
  | 'capabilities'
  | 'viewerContext'
  | 'encounterDirective'
  | 'contextStripTitleTone'
> & {
  /**
   * Rare escape hatch: fully replace the under-header strip (debug, one-off experiments).
   * Standard contextual interactions use {@link contextualPromptEnvironment} instead.
   */
  contextualStripOverride?: ReactNode | null
  /** Normalized inputs for contextual prompts (stairs, future portals/objectives). */
  contextualPromptEnvironment?: EncounterContextPromptEnvironment | null
  handleStairTraversal?: (intent: Extract<CombatIntent, { kind: 'stair-traversal' }>) => void
  handleOpenDoor?: (intent: Extract<CombatIntent, { kind: 'open-door' }>) => CombatIntentResult
  /**
   * Grid-aligned view of encounter state (see {@link resolveViewerSceneEncounterState}). When omitted,
   * defaults to `encounterState`. Mechanics / intents still use authoritative `encounterState` only.
   */
  presentationEncounterState?: EncounterState | null
}

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
    registerCombatLogAppended: _registerCombatLogAppended,
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
    selectedDoorCellIdA,
    setSelectedDoorCellIdA,
    selectedDoorCellIdB,
    setSelectedDoorCellIdB,
    suppressSameSideHostile,
    spellsById,
    capabilities,
    viewerContext,
    encounterDirective,
    contextStripTitleTone,
    contextualStripOverride,
    contextualPromptEnvironment,
    handleStairTraversal,
    handleOpenDoor,
    presentationEncounterState,
  }: EncounterActivePlaySurfaceDeps,
  options?: UseEncounterActivePlaySurfaceOptions,
) {
  /** Scene the viewer sees on the tactical grid (defaults to authoritative encounter state). */
  const sceneEncounterState = presentationEncounterState ?? encounterState

  const theme = useTheme()
  const playSurfaceHeaderOffset = useMemo(() => {
    const u = getEncounterUiStateTheme(theme)
    return {
      activeHeaderOffsetCssVar: u.header.height.cssVarName,
      activeHeaderOffsetFallbackPx: u.header.height.layoutFallbackPx,
    }
  }, [theme])

  const [toastPayload, setToastPayload] = useState<EncounterToastPresentation | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
  /** Drives {@link EncounterSceneTransitionModal} during synchronous scene swaps (stairs today; extend for doors/portals). */
  const [sceneTransition, setSceneTransition] = useState<
    Omit<EncounterSceneTransitionModalProps, 'open'> | null
  >(null)
  /** Browser timer handle (`number`); avoid `ReturnType<typeof setTimeout>` which can be Node `Timeout` under `@types/node`. */
  const sceneTransitionDismissTimerRef = useRef<number | null>(null)
  const toastOpenRef = useRef(false)
  const toastQueueRef = useRef<EncounterToastPresentation[]>([])
  const shownToastDedupeKeysRef = useRef<Set<string>>(new Set())
  /** Tracks processed `encounterState.log` length so remote hydration (e.g. other player’s intent) also drives toasts. */
  const lastProcessedCombatLogLenRef = useRef<number | null>(null)

  useEffect(() => {
    toastOpenRef.current = toastOpen
  }, [toastOpen])

  useEffect(() => {
    return () => {
      if (sceneTransitionDismissTimerRef.current != null) {
        clearTimeout(sceneTransitionDismissTimerRef.current)
        sceneTransitionDismissTimerRef.current = null
      }
    }
  }, [])

  const toastViewerInput = useMemo((): EncounterToastViewerInput => {
    const mode: EncounterToastViewerInput['viewerMode'] =
      viewerContext.mode === 'simulator' ? 'simulator' : 'session'
    return {
      viewerMode: mode,
      controlledCombatantIds: viewerContext.controlledCombatantIds,
      tonePerspective: capabilities?.tonePerspective ?? 'dm',
      viewerRole: viewerContext.mode === 'session' ? viewerContext.viewerRole : undefined,
      simulatorPresentationCombatantId:
        viewerContext.mode === 'simulator' ? viewerContext.presentationSelectedCombatantId ?? null : undefined,
    }
  }, [
    viewerContext.mode,
    viewerContext.controlledCombatantIds,
    viewerContext.viewerRole,
    viewerContext.presentationSelectedCombatantId,
    capabilities?.tonePerspective,
  ])

  const handleToastClose = useCallback(() => {
    setToastOpen(false)
    window.setTimeout(() => {
      const next = toastQueueRef.current.shift()
      if (next) {
        setToastPayload(next)
        setToastOpen(true)
      } else {
        setToastPayload(null)
      }
    }, 0)
  }, [])

  /** Client-only feedback (e.g. door locked); mirrors log-driven toast queue behavior. */
  const enqueueManualEncounterToast = useCallback((presentation: EncounterToastPresentation) => {
    const busy = toastOpenRef.current || toastQueueRef.current.length > 0
    if (!busy) {
      setToastPayload(presentation)
      setToastOpen(true)
      return
    }
    const q = toastQueueRef.current
    const last = q[q.length - 1]
    if (last?.dedupeKey !== presentation.dedupeKey) q.push(presentation)
  }, [])

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
    if (!encounterState) {
      shownToastDedupeKeysRef.current.clear()
      lastProcessedCombatLogLenRef.current = null
      return
    }

    const log = encounterState.log
    const prevLen = lastProcessedCombatLogLenRef.current
    if (prevLen === null) {
      lastProcessedCombatLogLenRef.current = log.length
      return
    }
    if (log.length < prevLen) {
      lastProcessedCombatLogLenRef.current = log.length
      return
    }
    if (log.length === prevLen) return

    const newEntries = log.slice(prevLen)
    lastProcessedCombatLogLenRef.current = log.length

    const presentations = deriveEncounterToastsFromNewLogSlice(newEntries, encounterState, toastViewerInput)
    if (presentations.length === 0) return

    let placedFirstInBatch = false
    for (const presentation of presentations) {
      if (shownToastDedupeKeysRef.current.has(presentation.dedupeKey)) continue
      shownToastDedupeKeysRef.current.add(presentation.dedupeKey)

      const busy = toastOpenRef.current || toastQueueRef.current.length > 0
      if (!placedFirstInBatch && !busy) {
        setToastPayload(presentation)
        setToastOpen(true)
        placedFirstInBatch = true
        continue
      }
      const q = toastQueueRef.current
      const last = q[q.length - 1]
      if (last?.dedupeKey !== presentation.dedupeKey) q.push(presentation)
    }
  }, [encounterState, encounterState?.log.length, toastViewerInput])

  const { zoom, zoomControlProps, wheelContainerRef, bindResetPan } = useCanvasZoom()
  const { pan, isDragging, consumeClickSuppressionAfterPan, pointerHandlers, resetPan } = useCanvasPan()
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
    if (!sceneEncounterState?.space || !selectedSingleCellPlacementCellId) return null
    return formatGridCellLabel(sceneEncounterState.space, selectedSingleCellPlacementCellId)
  }, [sceneEncounterState, selectedSingleCellPlacementCellId])

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
      if (!capabilities?.canSelectAction) return
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
      capabilities?.canSelectAction,
    ],
  )

  const handleSelectAction = useCallback(
    (actionId: string) => {
      if (!capabilities?.canSelectAction) return
      const action = availableActions.find((a) => a.id === actionId)
      setSelectedActionId(actionId)
      setPlacementError(null)
      setSelectedObjectAnchorId(null)
      setObjectAnchorHoverCellId(null)
      setSelectedDoorCellIdA(null)
      setSelectedDoorCellIdB(null)

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

      if (action?.resolutionMode === 'pick-lock') {
        setSelectedActionTargetId('')
        resetAoePlacement()
        setSingleCellPlacementHoverCellId(null)
        setSingleCellPlacementError(null)
        if (!encounterState || !activeCombatantId) {
          setInteractionMode('select-target')
          return
        }
        const pl = resolvePickLockAvailability(encounterState, activeCombatantId)
        if (pl.available && pl.legalTargets.length === 1) {
          const t = pl.legalTargets[0]!
          setSelectedDoorCellIdA(t.cellIdA)
          setSelectedDoorCellIdB(t.cellIdB)
          setInteractionMode('select-target')
          return
        }
        if (pl.available && pl.legalTargets.length > 1) {
          setInteractionMode('pick-lock-select')
          return
        }
        setInteractionMode('select-target')
        return
      }

      if (isAreaGridAction(action, initialOpts)) {
        setSelectedActionTargetId('')
        if (!sceneEncounterState?.space || !sceneEncounterState.placements || !activeCombatantId || !action?.areaTemplate) {
          resetAoePlacement()
          return
        }
        if (isSelfCenteredAreaAction(action, initialOpts)) {
          const cell = getCellForCombatant(sceneEncounterState.placements, activeCombatantId)
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
      sceneEncounterState,
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
      setSelectedDoorCellIdA,
      setSelectedDoorCellIdB,
      encounterState,
      activeCombatantId,
      capabilities?.canSelectAction,
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
    } else     if (v === 'place') {
      setInteractionMode('aoe-place')
      if (sceneEncounterState?.space && sceneEncounterState.placements && activeCombatantId && action.areaTemplate) {
        setAoeOriginCellId(null)
        setAoeStep('placing')
      }
    }
  }, [
    selectedCasterOptions,
    selectedActionId,
    availableActions,
    sceneEncounterState?.space,
    sceneEncounterState?.placements,
    activeCombatantId,
    resetAoePlacement,
    setAoeOriginCellId,
    setAoeStep,
    setInteractionMode,
    setSelectedObjectAnchorId,
  ])

  const aoeAffectedSummary = useMemo(() => {
    if (!sceneEncounterState || !selectedAction?.areaTemplate || (aoeStep !== 'confirm' && aoeStep !== 'placing')) {
      return { names: [] as string[], total: 0, overflow: 0 }
    }
    const r = areaTemplateRadiusFt(selectedAction.areaTemplate)
    const space = sceneEncounterState.space
    const placements = sceneEncounterState.placements
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
    const ids = selectCombatantIdsInAoeFootprint(sceneEncounterState, previewOrigin, r)
    const roster = Object.values(sceneEncounterState.combatantsById)
    const names = ids
      .map((id) => {
        const c = sceneEncounterState.combatantsById[id]
        return c ? getCombatantDisplayLabel(c, roster) : undefined
      })
      .filter((n): n is string => Boolean(n))
    const total = names.length
    const shown = names.slice(0, AFFECTED_NAME_MAX)
    const overflow = Math.max(0, total - shown.length)
    return { names: shown, total, overflow }
  }, [sceneEncounterState, selectedAction, aoeOriginCellId, aoeHoverCellId, aoeStep, activeCombatantId])

  const canResolveAction = useMemo(
    () =>
      Boolean(capabilities?.canResolveAction) &&
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
        selectedDoorCellIdA,
        selectedDoorCellIdB,
        encounterState,
        activeCombatant,
      }),
    [
      capabilities?.canResolveAction,
      selectedActionId,
      selectedAction,
      availableActions,
      aoeStep,
      aoeOriginCellId,
      selectedActionTargetId,
      selectedCasterOptions,
      selectedSingleCellPlacementCellId,
      selectedObjectAnchorId,
      selectedDoorCellIdA,
      selectedDoorCellIdB,
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
        selectedDoorCellIdA,
        selectedDoorCellIdB,
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
      selectedDoorCellIdA,
      selectedDoorCellIdB,
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
    setSelectedDoorCellIdA(null)
    setSelectedDoorCellIdB(null)
    setUnaffectedCombatantIds([])
    setSelectedActionId('')
    setActionDrawerOpen(false)
  }, [
    resetAoePlacement,
    setInteractionMode,
    setSingleCellPlacementHoverCellId,
    setSelectedObjectAnchorId,
    setObjectAnchorHoverCellId,
    setSelectedDoorCellIdA,
    setSelectedDoorCellIdB,
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

  const handleEndTurnWithPermission = useCallback(() => {
    if (!capabilities?.canEndTurn) return
    handleNextTurn()
  }, [capabilities?.canEndTurn, handleNextTurn])

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
      if (!sceneEncounterState || !activeCombatantId) return

      if (interactionMode === 'single-cell-place') {
        if (!capabilities?.canSelectAction) return
        const space = sceneEncounterState.space
        const placements = sceneEncounterState.placements
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
        if (!capabilities?.canSelectAction) return
        const space = sceneEncounterState.space
        if (!space) return
        const gridObject = findGridObjectAtCell(space, cellId)
        if (gridObject) {
          setPlacementError(null)
          setSelectedObjectAnchorId(gridObject.id)
        }
        return
      }

      if (interactionMode === 'pick-lock-select') {
        if (!capabilities?.canSelectAction) return
        if (!encounterState?.space || !encounterState.placements || !activeCombatantId) return
        const space = encounterState.space
        const placements = encounterState.placements
        const actorCell = getCellForCombatant(placements, activeCombatantId, space, encounterState)
        if (!actorCell) return
        if (!isPickLockDoorSelectionValid(encounterState, activeCombatantId, actorCell, cellId)) return
        setSelectedDoorCellIdA(actorCell)
        setSelectedDoorCellIdB(cellId)
        setInteractionMode('select-target')
        return
      }

      if (
        (aoeStep === 'placing' || aoeStep === 'confirm') &&
        selectedAction &&
        isAreaGridAction(selectedAction, selectedCasterOptions) &&
        !isSelfCenteredAreaAction(selectedAction, selectedCasterOptions)
      ) {
        if (!capabilities?.canSelectAction) return
        const space = sceneEncounterState.space
        const placements = sceneEncounterState.placements
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

      const occupant = sceneEncounterState.placements?.find((p) => p.cellId === cellId)
      if (occupant) {
        if (!capabilities?.canSelectAction) return
        handleSelectTarget(occupant.combatantId)
        setActionDrawerOpen(true)
      } else {
        if (!capabilities?.canMoveActiveCombatant) return
        handleMoveCombatant(cellId)
      }
    },
    [
      sceneEncounterState,
      encounterState,
      activeCombatantId,
      aoeStep,
      aoeOriginCellId,
      selectedAction,
      selectedCasterOptions,
      interactionMode,
      capabilities?.canSelectAction,
      capabilities?.canMoveActiveCombatant,
      handleMoveCombatant,
      handleSelectTarget,
      setAoeOriginCellId,
      setAoeStep,
      setActionDrawerOpen,
      setSelectedSingleCellPlacementCellId,
      setSingleCellPlacementError,
      setSelectedObjectAnchorId,
      setSelectedDoorCellIdA,
      setSelectedDoorCellIdB,
      setInteractionMode,
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

  /** Reachable-cell / movement affordances only for the viewer who may act on the active turn (see `deriveEncounterCapabilities`). */
  const movementHighlightActive = useMemo(
    () =>
      Boolean(capabilities?.canMoveActiveCombatant) &&
      (activeCombatant?.turnResources?.movementRemaining ?? 0) > 0 &&
      interactionMode !== 'aoe-place' &&
      interactionMode !== 'single-cell-place' &&
      interactionMode !== 'object-anchor-select' &&
      interactionMode !== 'pick-lock-select',
    [capabilities?.canMoveActiveCombatant, activeCombatant, interactionMode],
  )

  const creatureTargetingActive = useMemo(() => {
    if (
      interactionMode === 'single-cell-place' ||
      interactionMode === 'object-anchor-select' ||
      interactionMode === 'pick-lock-select'
    )
      return false
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
        encounterState: sceneEncounterState,
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
      sceneEncounterState,
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

  /**
   * Defers synchronous stair application to the next task so the transition modal can paint first,
   * then enforces a minimum open time so the overlay does not flash subliminally.
   * TODO: If other transition kinds share this path, lift payload construction next to each intent resolver.
   */
  const handleStairTraversalForContextPrompt = useMemo(() => {
    if (!handleStairTraversal) return undefined
    return (intent: Extract<CombatIntent, { kind: 'stair-traversal' }>) => {
      if (sceneTransitionDismissTimerRef.current != null) {
        clearTimeout(sceneTransitionDismissTimerRef.current)
        sceneTransitionDismissTimerRef.current = null
      }
      const shownAt = performance.now()
      setSceneTransition({
        title: 'Changing scene',
        subtitle: intent.destinationEncounterSpace.name,
        detail: 'Via stairs',
        transitionKind: 'stairs',
        loading: true,
      })
      window.setTimeout(() => {
        try {
          handleStairTraversal(intent)
        } finally {
          const elapsed = performance.now() - shownAt
          const rest = Math.max(0, MIN_SCENE_TRANSITION_MODAL_MS - elapsed)
          sceneTransitionDismissTimerRef.current = window.setTimeout(() => {
            sceneTransitionDismissTimerRef.current = null
            setSceneTransition(null)
          }, rest)
        }
      }, 0)
    }
  }, [handleStairTraversal])

  const handleOpenDoorForContextPrompt = useMemo(() => {
    if (!handleOpenDoor) return undefined
    return (intent: Extract<CombatIntent, { kind: 'open-door' }>) => {
      const result: CombatIntentResult = handleOpenDoor(intent)
      if (!result.ok && result.error.code === 'validation-failed') {
        const locked = result.error.issues?.some((i) => i.code === 'door-locked')
        if (locked) {
          enqueueManualEncounterToast({
            title: 'Door is locked',
            children: '',
            mechanics: undefined,
            tone: 'warning',
            variant: 'standard',
            autoHideDuration: 5000,
            dedupeKey: `context:door-locked:${performance.now()}`,
          })
        }
      }
    }
  }, [handleOpenDoor, enqueueManualEncounterToast])

  const contextualPromptStrip = useEncounterContextPromptStrip({
    env: contextualPromptEnvironment ?? null,
    viewerRole: viewerContext.viewerRole ?? 'dm',
    capabilities,
    activeCombatantMovementRemainingFt: activeCombatant?.turnResources?.movementRemaining ?? 0,
    handleStairTraversal: handleStairTraversalForContextPrompt,
    handleOpenDoor: handleOpenDoorForContextPrompt,
  })

  /** Unified under-header strip: exceptional override → shared contextual prompts → default directive. */
  const contextualStrip = useMemo(() => {
    if (contextualStripOverride != null) return contextualStripOverride
    if (contextualPromptStrip != null) return contextualPromptStrip
    return (
      <EncounterContextPrompt
        title={encounterDirective}
        titleTone={contextStripTitleTone}
      />
    )
  }, [contextualStripOverride, contextualPromptStrip, encounterDirective, contextStripTitleTone])

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
    onEndTurn: handleEndTurnWithPermission,
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
    <>
      <EncounterSceneTransitionModal open={sceneTransition != null} {...(sceneTransition ?? {})} />
      <CombatPlayView
        {...playSurfaceHeaderOffset}
        activeHeader={activeHeader}
        contextualStrip={contextualStrip}
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
            onClose={handleToastClose}
            title={toastPayload?.title ?? ''}
            tone={toastPayload?.tone ?? 'info'}
            variant={toastPayload?.variant ?? 'standard'}
            autoHideDuration={toastPayload?.autoHideDuration ?? 8000}
            mechanics={toastPayload?.mechanics || undefined}
          >
            {toastPayload?.children || undefined}
          </AppToast>
        }
        wheelContainerRef={wheelContainerRef}
        zoomControlProps={zoomControlProps}
        encounterGrid={
          gridViewModel ? (
            <CombatGrid
              grid={gridViewModel}
              zoom={zoom}
              pan={pan}
              panPointerHandlers={pointerHandlers}
              isDragging={isDragging}
              consumeClickSuppressionAfterPan={consumeClickSuppressionAfterPan}
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
              if (!capabilities?.canSelectAction) return
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
    </>
  )
}
