/**
 * React context for the **Encounter Simulator**: roster/setup state, local `EncounterState`, and UI wiring.
 * Future **GameSession** live play will compose combat differently (multiplayer, ownership); this stays a single-operator sandbox.
 */
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

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { useCampaignParty } from '@/features/campaign/hooks'
import { useCharacters } from '@/features/character/hooks'
import { formatMonsterIdentityLine } from '@/features/content/monsters/formatters'
import { buildMonsterModalStats } from '@/features/combat/presentation'
import { ATMOSPHERE_TAGS } from '@/features/mechanics/domain/environment'
import {
  buildEncounterPresentationGridPerceptionInputArgs,
  deriveEncounterPresentationGridPerceptionInput,
  type EncounterSimulatorViewerMode,
  type EncounterViewerContext,
} from '../domain'
import { SIMULATOR_ENCOUNTER_SETUP_POLICY } from '../domain/setup'
import {
  useEncounterState,
  useEncounterOptions,
  useEncounterRoster,
  useEncounterSceneViewerPresentation,
  useEncounterRuntimeInteractionMode,
  useEncounterRuntimePresentation,
} from '../hooks'
import { AppPageHeader } from '@/ui/patterns'
import type { SelectEntityOption } from '@/ui/patterns'
import type { Location } from '@/features/content/locations/domain/model/location'
import { listCampaignLocations } from '@/features/content/locations/domain/repo/locationRepo'
import { resolveEncounterSpaceForSimulatorStart } from '@/features/game-session/combat/resolveEncounterSpaceForSimulatorStart'
import {
  OpponentRosterLane,
  AllyRosterLane,
  SelectEncounterAllyModal,
  SelectEncounterOpponentModal,
  EncounterEditModal,
  type EnvironmentSetupValues,
} from '../components'
import type { CombatantPortraitEntry } from '../helpers/combatants'

import { campaignEncounterActivePath, campaignEncounterSetupPath } from './encounterPaths'
import type { EncounterContextPromptEnvironment } from '../domain/encounterContextPrompt.types'

function useEncounterRuntimeValue() {
  /** Setup defaults + edit flags; simulator uses {@link SIMULATOR_ENCOUNTER_SETUP_POLICY}. */
  const encounterSetupPolicy = SIMULATOR_ENCOUNTER_SETUP_POLICY

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

  const [locations, setLocations] = useState<Location[]>([])
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [buildingLocationIds, setBuildingLocationIds] = useState<string[]>([])
  const [startEncounterPending, setStartEncounterPending] = useState(false)
  const [startEncounterError, setStartEncounterError] = useState<string | null>(null)

  const defaultBuildingSeededRef = useRef(false)
  const prevCampaignIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!campaignId) return
    let cancelled = false
    setLocationsLoading(true)
    listCampaignLocations(campaignId)
      .then((locs) => {
        if (!cancelled) setLocations(locs)
      })
      .catch(() => {
        if (!cancelled) setLocations([])
      })
      .finally(() => {
        if (!cancelled) setLocationsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [campaignId])

  useEffect(() => {
    if (prevCampaignIdRef.current !== campaignId) {
      prevCampaignIdRef.current = campaignId
      defaultBuildingSeededRef.current = false
      setBuildingLocationIds([])
    }
  }, [campaignId])

  const sortedBuildings = useMemo(() => {
    const buildings = locations.filter((l) => l.scale === 'building')
    return [...buildings].sort((a, b) => {
      const ao = a.sortOrder ?? 0
      const bo = b.sortOrder ?? 0
      if (ao !== bo) return ao - bo
      return String(a.name).localeCompare(String(b.name))
    })
  }, [locations])

  useEffect(() => {
    if (!campaignId || locations.length === 0) return
    if (buildingLocationIds.length > 0) return
    if (defaultBuildingSeededRef.current) return
    const first = sortedBuildings[0]
    if (first) setBuildingLocationIds([first.id])
    defaultBuildingSeededRef.current = true
  }, [campaignId, locations, buildingLocationIds.length, sortedBuildings])

  const buildingSelectOptions: SelectEntityOption[] = useMemo(
    () =>
      sortedBuildings.map((l) => ({
        id: l.id,
        label: l.name,
        subtitle: l.category,
        imageKey: l.imageKey ?? null,
      })),
    [sortedBuildings],
  )

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
    rosterPolicy: encounterSetupPolicy.roster,
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
    handleStairTraversal,
    handleOpenDoor,
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
    selectedDoorCellIdA,
    setSelectedDoorCellIdA,
    selectedDoorCellIdB,
    setSelectedDoorCellIdB,
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
      mode: 'simulator' as const,
      viewerRole: 'dm' as const,
      viewerUserId: null,
      simulatorViewerMode,
      presentationSelectedCombatantId,
      controlledCombatantIds: [],
    }),
    [simulatorViewerMode, presentationSelectedCombatantId],
  )

  const {
    followMode,
    setFollowMode,
    sceneFocus,
    setSceneFocus,
    presentationEncounterState,
    sceneViewerSlot,
  } = useEncounterSceneViewerPresentation({
    encounterState,
    controlledCombatantIds: [],
    selectedActionTargetId,
    presentationSelectedCombatantId,
    activeCombatantId,
    viewerRole: 'dm',
    hostMode: 'simulator',
  })

  const contextualPromptEnvironment = useMemo((): EncounterContextPromptEnvironment | null => {
    if (!campaignId) return null
    return {
      campaignId,
      locations,
      locationContext: {
        buildingId: buildingLocationIds[0] ?? null,
        locationId: encounterState?.space?.locationId ?? null,
        floorId: encounterState?.space?.locationId ?? null,
      },
      encounterState,
    }
  }, [campaignId, locations, buildingLocationIds, encounterState])

  const presentationGridPerceptionInput = useMemo(
    () =>
      deriveEncounterPresentationGridPerceptionInput(
        buildEncounterPresentationGridPerceptionInputArgs({
          hostMode: 'simulator',
          encounterState: presentationEncounterState,
          activeCombatantId,
          simulatorViewerMode,
          presentationSelectedCombatantId,
        }),
      ),
    [presentationEncounterState, simulatorViewerMode, activeCombatantId, presentationSelectedCombatantId],
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

  const [environmentSetup, setEnvironmentSetup] = useState<EnvironmentSetupValues>(() => ({
    ...encounterSetupPolicy.environment.environmentDefaults,
  }))
  const [allyModalOpen, setAllyModalOpen] = useState(false)
  const [opponentModalOpen, setOpponentModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
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

  const selectedAction = useMemo(
    () => availableActions.find((a) => a.id === selectedActionId) ?? null,
    [availableActions, selectedActionId],
  )

  const { interactionMode, setInteractionMode } = useEncounterRuntimeInteractionMode({
    activeCombatantId,
    aoeStep,
    selectedAction,
    selectedCasterOptions,
  })

  const canStartEncounter = selectedCombatants.length > 0 && unresolvedCombatantCount === 0

  const handleSimulatorStartCombat = useCallback(async () => {
    if (!campaignId || startEncounterPending || !canStartEncounter) return
    setStartEncounterError(null)
    setStartEncounterPending(true)
    try {
      const { space } = await resolveEncounterSpaceForSimulatorStart({
        campaignId,
        locations,
        buildingLocationIds,
      })
      handleStartEncounter({ space, environmentBaseline: environmentSetup })
    } catch (e) {
      setStartEncounterError(e instanceof Error ? e.message : 'Could not start combat.')
    } finally {
      setStartEncounterPending(false)
    }
  }, [
    campaignId,
    startEncounterPending,
    canStartEncounter,
    locations,
    buildingLocationIds,
    handleStartEncounter,
    environmentSetup,
  ])

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

  const setupHeaderSubtitleParts = [
    `Allies: ${selectedAllyIds.length}`,
    `Opponents: ${opponentRoster.length}`,
  ]
  if (environmentSummary) {
    setupHeaderSubtitleParts.push(`Environment: ${environmentSummary}`)
  }

  const startCombatDisabled =
    !canStartEncounter || startEncounterPending || locationsLoading || !campaignId

  const setupHeader = (
    <Box
      sx={{
        px: 4,
        py: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <AppPageHeader
        headline="Encounter Simulator"
        actions={[
          <Button
            key="start-combat"
            variant="contained"
            disabled={startCombatDisabled}
            onClick={() => void handleSimulatorStartCombat()}
          >
            {startEncounterPending ? (
              <>
                <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} />
                Starting…
              </>
            ) : (
              'Start combat'
            )}
          </Button>,
        ]}
      />
      {startEncounterError ? (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setStartEncounterError(null)}>
          {startEncounterError}
        </Alert>
      ) : null}
    </Box>
  )

  const { gridViewModel, combatantViewerPresentationKindById, activeHeader, capabilities, encounterDirective, contextStripTitleTone } =
    useEncounterRuntimePresentation({
      presentationEncounterState,
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
      presentationGridPerceptionInput: presentationGridPerceptionInput ?? undefined,
      availableActions,
      selectedActionId,
      selectedObjectAnchorId,
      viewerContext,
      simulatorViewerMode,
      onSimulatorViewerModeChange: handleSimulatorViewerModeChange,
      handleNextTurn,
      handleResetEncounter,
      setActionDrawerOpen,
      onEditEncounter: () => setEditModalOpen(true),
      monstersById,
      spellsById: catalog.spellsById,
      suppressSameSideHostile,
      sceneViewerSlot,
    })

  // activeFooter commented out -- action resolution now handled by CombatantActionDrawer
  const activeFooter = undefined

  return {
    viewerContext,
    sceneFocus,
    setSceneFocus,
    followMode,
    setFollowMode,
    presentationEncounterState,
    /** Presentation POV (grid/sidebar/header); not turn ownership. */
    simulatorViewerMode,
    setSimulatorViewerMode,
    presentationSelectedCombatantId,
    setPresentationSelectedCombatantId,
    presentationGridPerceptionInput,
    presentationViewerCombatantId: presentationGridPerceptionInput?.viewerCombatantId ?? null,
    capabilities,
    encounterDirective,
    contextStripTitleTone,
    campaignId,
    locations,
    locationsLoading,
    buildingLocationIds,
    setBuildingLocationIds,
    buildingSelectOptions,
    monstersById,
    characterPortraitById,
    allyOptions,
    opponentOptions,
    encounterSetupPolicy,
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
    selectedDoorCellIdA,
    setSelectedDoorCellIdA,
    selectedDoorCellIdB,
    setSelectedDoorCellIdB,
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
    interactionMode,
    setInteractionMode,
    allyModalOpen,
    setAllyModalOpen,
    opponentModalOpen,
    setOpponentModalOpen,
    editModalOpen,
    setEditModalOpen,
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
    contextualPromptEnvironment,
    handleStairTraversal,
    handleOpenDoor,
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
    </>
  )
}

export function useEncounterRuntime() {
  const ctx = useContext(EncounterRuntimeContext)
  if (!ctx) throw new Error('useEncounterRuntime must be used within EncounterRuntimeProvider')
  return ctx
}
