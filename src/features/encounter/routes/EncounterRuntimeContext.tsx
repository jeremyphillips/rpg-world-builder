import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { useCampaignParty } from '@/features/campaign/hooks'
import { useCharacters } from '@/features/character/hooks'
import { formatMonsterIdentityLine } from '@/features/content/monsters/formatters'
import { buildMonsterModalStats } from '../helpers/presentation'
import {
  ATMOSPHERE_TAGS,
  DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE,
} from '@/features/mechanics/domain/environment'
import { getEffectiveGroundMovementBudgetFt } from '@/features/mechanics/domain/encounter/state'
import { resolveBattlefieldEffectOriginCellId } from '@/features/mechanics/domain/encounter/state/battlefield/battlefield-effect-anchor'
import { getCombatantBaseMovement } from '@/features/mechanics/domain/encounter/state/shared'
import { actionRequiresCreatureTargetForResolve } from '@/features/mechanics/domain/encounter'
import { getSingleCellPlacementRequirement } from '@/features/mechanics/domain/encounter/resolution/action/action-requirement-model'
import { getCombatantDisplayLabel } from '@/features/mechanics/domain/encounter/state'

import {
  canResolveCombatActionSelection,
  deriveEncounterCapabilities,
  deriveEncounterHeaderModel,
  deriveEncounterPerceptionUiFeedback,
  deriveEncounterPresentationGridPerceptionInput,
  type EncounterSimulatorViewerMode,
  type EncounterViewerContext,
} from '../domain'
import { useEncounterState, useEncounterOptions, useEncounterRoster } from '../hooks'
import type { GridInteractionMode } from '../domain'
import {
  OpponentRosterLane,
  AllyRosterLane,
  EncounterSetupHeader,
  EncounterActiveHeader,
  SelectEncounterAllyModal,
  SelectEncounterOpponentModal,
  EncounterEditModal,
  CombatTurnOrderModal,
  GRID_SIZE_PRESETS,
  type EnvironmentSetupValues,
  type GridSizePreset,
} from '../components'
import { areaTemplateRadiusFt } from '@/features/mechanics/domain/encounter/resolution/action/action-targeting'
import { isAreaGridAction } from '../helpers/actions'
import { getCellForCombatant } from '../space/space.helpers'
import { buildCombatantViewerPresentationKindById } from '../space/rendering/grid-occupant-render-visibility'
import { selectGridViewModel } from '../space/selectors/space.selectors'
import { createSquareGridSpace } from '../space/creation/createSquareGridSpace'
import { placeRandomGridObstacle } from '../space/placement/placeRandomGridObstacle'

import type { CombatantPortraitEntry } from '../helpers/combatants'

import { campaignEncounterActivePath, campaignEncounterSetupPath } from './encounterPaths'

function useEncounterRuntimeValue() {
  useActiveCampaign()
  const navigate = useNavigate()
  const { id: campaignId } = useParams<{ id: string }>()
  const { catalog, ruleset } = useCampaignRules()
  const suppressSameSideHostile = ruleset.mechanics.combat.encounter.suppressSameSideHostile === true
  const { party } = useCampaignParty('approved')
  const { characters: npcs } = useCharacters({ type: 'npc' })

  const characterPortraitById = useMemo(() => {
    const out: Record<string, CombatantPortraitEntry> = {}
    for (const m of party) {
      out[m.id] = { imageKey: m.imageKey ?? null, imageUrl: m.imageUrl }
    }
    for (const n of npcs) {
      const doc = n as { _id: string; imageKey?: string | null; imageUrl?: string | null }
      out[doc._id] = {
        imageKey: doc.imageKey ?? null,
        imageUrl: doc.imageUrl ?? null,
      }
    }
    return out
  }, [party, npcs])

  const runtimeIdCounter = useRef(0)
  const nextRuntimeId = (prefix: string) => {
    runtimeIdCounter.current += 1
    return `${prefix}-${runtimeIdCounter.current}`
  }

  const monstersById = catalog.monstersById
  const { allyOptions, npcAllyOptions, opponentOptions, opponentOptionsByKey } =
    useEncounterOptions({
      allies: party,
      npcs,
      monstersById,
    })

  const allAllyOptions = useMemo(
    () => [...allyOptions, ...npcAllyOptions],
    [allyOptions, npcAllyOptions],
  )

  const {
    selectedAllyIds,
    setSelectedAllyIds,
    opponentRoster,
    selectedOpponentOptions,
    opponentSourceCounts,
    selectedCombatantIds,
    handleOpponentSelectionChange,
    removeAllyCombatant,
    removeOpponentCombatant,
    addOpponentCopy,
  } = useEncounterRoster({
    allyOptions: allAllyOptions,
    opponentOptionsByKey,
    nextRuntimeId,
  })

  const {
    encounterState,
    activeCombatantId,
    activeCombatant,
    availableActions,
    availableActionTargets,
    selectedActionId,
    setSelectedActionId,
    selectedCasterOptions,
    setSelectedCasterOptions,
    selectedSingleCellPlacementCellId,
    setSelectedSingleCellPlacementCellId,
    singleCellPlacementHoverCellId,
    setSingleCellPlacementHoverCellId,
    selectedActionTargetId,
    setSelectedActionTargetId,
    unresolvedCombatantCount,
    selectedCombatants,
    environmentContext,
    monsterFormsById,
    monsterManualTriggersById,
    handleResolvedCombatant,
    handleStartEncounter: handleStartEncounterBase,
    handleNextTurn,
    handleResolveAction,
    handleResetEncounter: handleResetEncounterBase,
    handleMoveCombatant,
    registerCombatLogAppended,
    aoeStep,
    setAoeStep,
    aoeOriginCellId,
    setAoeOriginCellId,
    aoeHoverCellId,
    setAoeHoverCellId,
    resetAoePlacement,
    unaffectedCombatantIds,
    setUnaffectedCombatantIds,
    selectedObjectAnchorId,
    setSelectedObjectAnchorId,
    objectAnchorHoverCellId,
    setObjectAnchorHoverCellId,
  } = useEncounterState({
    selectedCombatantIds,
    opponentRoster,
    monstersById,
    weaponsById: catalog.weaponsById,
    armorById: catalog.armorById,
    spellsById: catalog.spellsById,
    suppressSameSideHostile,
  })

  /** Presentation POV for grid/sidebar/header — not tied to turn/action ownership. */
  const [simulatorViewerMode, setSimulatorViewerMode] = useState<EncounterSimulatorViewerMode>('active-combatant')
  const [presentationSelectedCombatantId, setPresentationSelectedCombatantId] = useState<string | null>(null)

  useEffect(() => {
    if (!encounterState) {
      setSimulatorViewerMode('active-combatant')
      setPresentationSelectedCombatantId(null)
    }
  }, [encounterState])

  /**
   * Last grid/sidebar target selection seeds `presentationSelectedCombatantId` for “Selected combatant” POV.
   * Clearing the action target does not clear this — user can still view as that combatant until another selection.
   */
  useEffect(() => {
    if (!encounterState || !selectedActionTargetId) return
    if (!encounterState.combatantsById[selectedActionTargetId]) return
    setPresentationSelectedCombatantId(selectedActionTargetId)
  }, [encounterState, selectedActionTargetId])

  const handleSimulatorViewerModeChange = useCallback((mode: EncounterSimulatorViewerMode) => {
    setSimulatorViewerMode(mode)
  }, [])

  const viewerContext: EncounterViewerContext = useMemo(
    () => ({
      viewerRole: 'dm' as const,
      simulatorViewerMode,
      presentationSelectedCombatantId,
      controlledCombatantIds: [],
    }),
    [simulatorViewerMode, presentationSelectedCombatantId],
  )

  const presentationGridPerceptionInput = useMemo(
    () =>
      deriveEncounterPresentationGridPerceptionInput({
        encounterState,
        simulatorViewerMode,
        activeCombatantId,
        presentationSelectedCombatantId,
      }),
    [encounterState, simulatorViewerMode, activeCombatantId, presentationSelectedCombatantId],
  )

  const handleStartEncounter = useCallback(
    (opts?: Parameters<typeof handleStartEncounterBase>[0]) => {
      handleStartEncounterBase(opts)
      if (campaignId) navigate(campaignEncounterActivePath(campaignId), { replace: true })
    },
    [handleStartEncounterBase, navigate, campaignId],
  )

  const handleResetEncounter = useCallback(() => {
    handleResetEncounterBase()
    if (campaignId) navigate(campaignEncounterSetupPath(campaignId), { replace: true })
  }, [handleResetEncounterBase, navigate, campaignId])

  const [environmentSetup, setEnvironmentSetup] = useState<EnvironmentSetupValues>(
    DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE,
  )
  const [gridSizePreset, setGridSizePreset] = useState<GridSizePreset>('medium')
  const [interactionMode, setInteractionMode] = useState<GridInteractionMode>('select-target')
  const [allyModalOpen, setAllyModalOpen] = useState(false)
  const [opponentModalOpen, setOpponentModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [turnOrderModalOpen, setTurnOrderModalOpen] = useState(false)
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false)

  const partyAllyModalOptions = useMemo(
    () =>
      allyOptions.map((a) => ({
        id: a.id,
        label: a.label,
        subtitle: a.subtitle,
        imageKey: a.imageKey,
        imageUrl: a.imageUrl,
      })),
    [allyOptions],
  )

  const npcAllyModalOptions = useMemo(
    () =>
      npcAllyOptions.map((a) => ({
        id: a.id,
        label: a.label,
        subtitle: a.subtitle,
        imageKey: a.imageKey,
        imageUrl: a.imageUrl,
      })),
    [npcAllyOptions],
  )

  const { monsterModalOptions, npcModalOptions } = useMemo(() => {
    const monsters = opponentOptions
      .filter((o) => o.kind === 'monster')
      .map((o) => {
        const block = monstersById[o.sourceId]
        if (!block) {
          return {
            id: o.key,
            label: o.label,
            subtitle: o.subtitle,
            imageKey: o.imageKey,
            imageUrl: o.imageUrl,
          }
        }
        return {
          id: o.key,
          label: o.label,
          subtitle: formatMonsterIdentityLine(block),
          stats: buildMonsterModalStats(block, catalog.armorById),
          imageKey: block.imageKey,
        }
      })
    const npcList = opponentOptions
      .filter((o) => o.kind === 'npc')
      .map((o) => ({
        id: o.key,
        label: o.label,
        subtitle: o.subtitle,
        imageKey: o.imageKey,
        imageUrl: o.imageUrl,
      }))
    return { monsterModalOptions: monsters, npcModalOptions: npcList }
  }, [opponentOptions, monstersById, catalog.armorById])

  const selectedOpponentKeys = useMemo(
    () => selectedOpponentOptions.map((o) => o.key),
    [selectedOpponentOptions],
  )

  const handleAllyModalApply = useCallback(
    (ids: string[]) => setSelectedAllyIds(ids),
    [setSelectedAllyIds],
  )

  const handleOpponentModalApply = useCallback(
    (keys: string[]) => {
      const keySet = new Set(keys)
      const nextSelection = opponentOptions.filter((o) => keySet.has(o.key))
      handleOpponentSelectionChange(nextSelection)
    },
    [opponentOptions, handleOpponentSelectionChange],
  )

  const prevActiveCombatantId = useRef(activeCombatantId)
  if (prevActiveCombatantId.current !== activeCombatantId) {
    prevActiveCombatantId.current = activeCombatantId
    if (interactionMode !== 'select-target') setInteractionMode('select-target')
  }

  useEffect(() => {
    if (aoeStep === 'none' && interactionMode === 'aoe-place') {
      setInteractionMode('select-target')
    }
  }, [aoeStep, interactionMode])

  const canStartEncounter = selectedCombatants.length > 0 && unresolvedCombatantCount === 0

  // selectedActionLabel / selectedTargetLabel were consumed by the now-commented-out footer.
  // The route derives these directly when needed (e.g. CombatantActionDrawer).

  const selectedAction = useMemo(
    () => availableActions.find((a) => a.id === selectedActionId) ?? null,
    [availableActions, selectedActionId],
  )

  useEffect(() => {
    if (aoeStep === 'none') return
    if (isAreaGridAction(selectedAction, selectedCasterOptions)) {
      setInteractionMode('aoe-place')
    }
  }, [aoeStep, selectedAction, selectedCasterOptions])

  const selectedActionRangeFt = useMemo(() => {
    return selectedAction?.targeting?.rangeFt ?? null
  }, [selectedAction])

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
      step: aoeStep === 'confirm' ? 'confirm' as const : 'placing' as const,
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

  // turnResources was consumed by the now-commented-out footer.
  // activeCombatant.turnResources is still accessible directly via the context.

  const environmentSummaryParts = [
    environmentSetup.setting,
    environmentSetup.lightingLevel !== 'bright' ? environmentSetup.lightingLevel : null,
    environmentSetup.terrainMovement !== 'normal' ? environmentSetup.terrainMovement : null,
    environmentSetup.visibilityObscured !== 'none' ? environmentSetup.visibilityObscured : null,
    environmentSetup.atmosphereTags.length > 0
      ? environmentSetup.atmosphereTags
          .map((id) => ATMOSPHERE_TAGS.find((t) => t.id === id)?.name ?? id)
          .join(', ')
      : null,
  ].filter(Boolean)
  const environmentSummary = environmentSummaryParts.length > 0 ? environmentSummaryParts.join(', ') : undefined

  const setupHeader = (
    <EncounterSetupHeader
      allyCount={selectedAllyIds.length}
      opponentCount={opponentRoster.length}
      environmentSummary={environmentSummary}
      canStartEncounter={canStartEncounter}
      onStartEncounter={() => {
        const preset = GRID_SIZE_PRESETS[gridSizePreset]
        const base = createSquareGridSpace({
          id: `grid-${Date.now()}`,
          name: 'Combat Grid',
          columns: preset.columns,
          rows: preset.rows,
        })
        const space = placeRandomGridObstacle(base, environmentSetup.setting)
        handleStartEncounter({ space, environmentBaseline: environmentSetup })
      }}
    />
  )

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
    if (encounterState && catalog.spellsById) {
      return getEffectiveGroundMovementBudgetFt(activeCombatant, encounterState, {
        spellLookup: (id) => catalog.spellsById[id],
        suppressSameSideHostile,
      })
    }
    return getCombatantBaseMovement(activeCombatant)
  }, [activeCombatant, encounterState, catalog.spellsById, suppressSameSideHostile])

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

  /** Matches {@link getCombatantAvailableActions}: empty means no action/bonus costs left to spend on real options (bonus slot can read “available” while bonus list is empty). */
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
        onEditEncounter={() => setEditModalOpen(true)}
        onResetEncounter={handleResetEncounter}
        simulatorViewerMode={simulatorViewerMode}
        onSimulatorViewerModeChange={handleSimulatorViewerModeChange}
        perceptionFeedback={perceptionUiFeedback}
        nextCombatantPresentationKind={nextCombatantPresentationKind}
      />
    ) : undefined

  // activeFooter commented out -- action resolution now handled by CombatantActionDrawer
  const activeFooter = undefined

  return {
    viewerContext,
    /** Presentation POV (grid/sidebar/header); not turn ownership. */
    simulatorViewerMode,
    setSimulatorViewerMode,
    presentationSelectedCombatantId,
    setPresentationSelectedCombatantId,
    presentationGridPerceptionInput,
    presentationViewerCombatantId: presentationGridPerceptionInput?.viewerCombatantId ?? null,
    capabilities,
    campaignId,
    monstersById,
    characterPortraitById,
    allyOptions,
    opponentOptions,
    selectedAllyIds,
    setSelectedAllyIds,
    opponentRoster,
    selectedOpponentOptions,
    opponentSourceCounts,
    selectedCombatantIds,
    handleOpponentSelectionChange,
    removeAllyCombatant,
    removeOpponentCombatant,
    addOpponentCopy,
    encounterState,
    activeCombatantId,
    activeCombatant,
    availableActions,
    availableActionTargets,
    selectedActionId,
    setSelectedActionId,
    selectedCasterOptions,
    setSelectedCasterOptions,
    selectedSingleCellPlacementCellId,
    setSelectedSingleCellPlacementCellId,
    singleCellPlacementHoverCellId,
    setSingleCellPlacementHoverCellId,
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
    unaffectedCombatantIds,
    setUnaffectedCombatantIds,
    selectedObjectAnchorId,
    setSelectedObjectAnchorId,
    objectAnchorHoverCellId,
    setObjectAnchorHoverCellId,
    suppressSameSideHostile,
    spellsById: catalog.spellsById,
    unresolvedCombatantCount,
    selectedCombatants,
    environmentContext,
    monsterFormsById,
    monsterManualTriggersById,
    handleResolvedCombatant,
    handleNextTurn,
    handleResolveAction,
    handleMoveCombatant,
    environmentSetup,
    setEnvironmentSetup,
    gridSizePreset,
    setGridSizePreset,
    interactionMode,
    setInteractionMode,
    allyModalOpen,
    setAllyModalOpen,
    opponentModalOpen,
    setOpponentModalOpen,
    editModalOpen,
    setEditModalOpen,
    turnOrderModalOpen,
    setTurnOrderModalOpen,
    partyAllyModalOptions,
    npcAllyModalOptions,
    monsterModalOptions,
    npcModalOptions,
    selectedOpponentKeys,
    handleAllyModalApply,
    handleOpponentModalApply,
    canStartEncounter,
    gridViewModel,
    combatantViewerPresentationKindById,
    setupHeader,
    activeHeader,
    activeFooter,
    actionDrawerOpen,
    setActionDrawerOpen,
    handleStartEncounter,
    handleResetEncounter,
    registerCombatLogAppended,
  }
}

export type EncounterRuntimeContextValue = ReturnType<typeof useEncounterRuntimeValue>

const EncounterRuntimeContext = createContext<EncounterRuntimeContextValue | null>(null)

export function EncounterRuntimeProvider({ children }: { children: ReactNode }) {
  const value = useEncounterRuntimeValue()
  return (
    <EncounterRuntimeContext.Provider value={value}>
      {children}
      <EncounterRuntimeModals />
    </EncounterRuntimeContext.Provider>
  )
}

function EncounterRuntimeModals() {
  const {
    allyModalOpen,
    setAllyModalOpen,
    opponentModalOpen,
    setOpponentModalOpen,
    editModalOpen,
    setEditModalOpen,
    turnOrderModalOpen,
    setTurnOrderModalOpen,
    partyAllyModalOptions,
    npcAllyModalOptions,
    monsterModalOptions,
    npcModalOptions,
    selectedOpponentKeys,
    selectedAllyIds,
    handleAllyModalApply,
    handleOpponentModalApply,
    environmentSetup,
    setEnvironmentSetup,
    opponentRoster,
    monstersById,
    characterPortraitById,
    environmentContext,
    monsterFormsById,
    monsterManualTriggersById,
    opponentSourceCounts,
    selectedOpponentOptions,
    handleResolvedCombatant,
    removeAllyCombatant,
    removeOpponentCombatant,
    addOpponentCopy,
    encounterState,
    combatantViewerPresentationKindById,
  } = useEncounterRuntime()

  return (
    <>
      <SelectEncounterAllyModal
        open={allyModalOpen}
        onClose={() => setAllyModalOpen(false)}
        partyOptions={partyAllyModalOptions}
        npcOptions={npcAllyModalOptions}
        selectedAllyIds={selectedAllyIds}
        onApply={handleAllyModalApply}
      />

      <SelectEncounterOpponentModal
        open={opponentModalOpen}
        onClose={() => setOpponentModalOpen(false)}
        monsterOptions={monsterModalOptions}
        npcOptions={npcModalOptions}
        selectedOpponentKeys={selectedOpponentKeys}
        onApply={handleOpponentModalApply}
      />

      <EncounterEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        environmentValues={environmentSetup}
        onSave={setEnvironmentSetup}
        allyLane={
          <AllyRosterLane
            selectedAllyIds={selectedAllyIds}
            characterPortraitById={characterPortraitById}
            monstersById={monstersById}
            onOpenModal={() => {
              setEditModalOpen(false)
              setAllyModalOpen(true)
            }}
            onResolvedCombatant={handleResolvedCombatant}
            onRemoveAllyCombatant={removeAllyCombatant}
          />
        }
        opponentLane={
          <OpponentRosterLane
            opponentRoster={opponentRoster}
            monstersById={monstersById}
            characterPortraitById={characterPortraitById}
            environmentContext={environmentContext}
            monsterFormsById={monsterFormsById}
            monsterManualTriggersById={monsterManualTriggersById}
            opponentSourceCounts={opponentSourceCounts}
            selectedOpponentOptions={selectedOpponentOptions}
            onOpenModal={() => {
              setEditModalOpen(false)
              setOpponentModalOpen(true)
            }}
            onResolvedCombatant={handleResolvedCombatant}
            onRemoveOpponentCombatant={removeOpponentCombatant}
            onAddOpponentCopy={addOpponentCopy}
          />
        }
      />

      {encounterState && (
        <CombatTurnOrderModal
          open={turnOrderModalOpen}
          onClose={() => setTurnOrderModalOpen(false)}
          encounterState={encounterState}
          combatantViewerPresentationKindById={combatantViewerPresentationKindById}
        />
      )}
    </>
  )
}

export function useEncounterRuntime() {
  const ctx = useContext(EncounterRuntimeContext)
  if (!ctx) throw new Error('useEncounterRuntime must be used within EncounterRuntimeProvider')
  return ctx
}
