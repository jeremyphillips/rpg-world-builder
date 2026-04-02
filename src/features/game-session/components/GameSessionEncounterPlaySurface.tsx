import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { useCampaignParty } from '@/features/campaign/hooks'
import { useCharacters } from '@/features/character/hooks'
import { fetchPersistedCombatSession } from '@/features/combat/api/combatSessionApi'
import type { OpponentRosterEntry } from '@/features/encounter/types'
import type { EncounterState } from '@/features/mechanics/domain/combat'
import {
  deriveEncounterPresentationGridPerceptionInput,
  type EncounterViewerContext,
} from '@/features/encounter/domain'
import { isAreaGridAction } from '@/features/encounter/helpers/actions'
import type { GridInteractionMode } from '@/features/encounter/domain'
import { useEncounterState } from '@/features/encounter/hooks/useEncounterState'
import { useEncounterGridViewModel } from '@/features/encounter/hooks/useEncounterGridViewModel'
import { useEncounterCombatActiveHeader } from '@/features/encounter/hooks/useEncounterCombatActiveHeader'
import { useEncounterActivePlaySurface } from '@/features/encounter/hooks/useEncounterActivePlaySurface'
import type { CombatantPortraitEntry } from '@/features/encounter/helpers/combatants'

import type { GameSession } from '../domain/game-session.types'
import { summarizeEncounterSpaceForLog } from '../combat/buildEncounterSpaceFromLocationMap'
import { campaignGameSessionLobbyPath } from '../routes/gameSessionPaths'

function buildHydrationFromEncounter(encounter: EncounterState): {
  selectedCombatantIds: string[]
  opponentRoster: OpponentRosterEntry[]
} {
  const selectedCombatantIds = Object.keys(encounter.combatantsById)
  const opponentRoster: OpponentRosterEntry[] = Object.values(encounter.combatantsById)
    .filter((c) => c.side === 'enemies')
    .map((c) => ({
      runtimeId: c.instanceId,
      sourceKey:
        c.source.kind === 'monster' ? `monster:${c.source.sourceId}` : `npc:${c.source.sourceId}`,
      sourceId: c.source.sourceId,
      kind: c.source.kind === 'monster' ? 'monster' : 'npc',
      label: c.source.label,
    }))
  return { selectedCombatantIds, opponentRoster }
}

export function GameSessionEncounterPlaySurface({ session }: { session: GameSession }) {
  const { catalog, ruleset } = useCampaignRules()
  const suppressSameSideHostile = ruleset.mechanics.combat.encounter.suppressSameSideHostile === true
  const { party } = useCampaignParty('approved')
  const { characters: npcs } = useCharacters({ type: 'npc' })
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()

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

  const monstersById = catalog.monstersById

  const [persisted, setPersisted] = useState<Awaited<ReturnType<typeof fetchPersistedCombatSession>> | null>(
    null,
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!session.activeEncounterId) return
    let cancelled = false
    setLoadError(null)
    ;(async () => {
      try {
        const dto = await fetchPersistedCombatSession(session.activeEncounterId!)
        if (!cancelled) {
          setPersisted(dto)
          setRevision(dto.revision)
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Failed to load combat session')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session.activeEncounterId])

  const hydratedEncounterState = persisted?.state ?? null

  useEffect(() => {
    const isDev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV)
    if (!isDev) return
    if (!hydratedEncounterState?.space) return
    const summary = summarizeEncounterSpaceForLog(hydratedEncounterState.space)
    console.info('[game-session play] persisted encounter space', {
      encounterLocationId: session.location?.locationId ?? null,
      buildingId: session.location?.buildingId ?? null,
      floorId: session.location?.floorId ?? null,
      derivedSpace: summary,
    })
  }, [hydratedEncounterState?.space, session.location])

  const { selectedCombatantIds, opponentRoster } = useMemo(() => {
    if (!hydratedEncounterState) return { selectedCombatantIds: [] as string[], opponentRoster: [] as OpponentRosterEntry[] }
    return buildHydrationFromEncounter(hydratedEncounterState)
  }, [hydratedEncounterState])

  const persistedCombat = useMemo(
    () =>
      persisted && session.activeEncounterId
        ? { sessionId: persisted.sessionId, revision, setRevision }
        : undefined,
    [persisted, session.activeEncounterId, revision],
  )

  const encounter = useEncounterState({
    selectedCombatantIds,
    opponentRoster,
    monstersById,
    weaponsById: catalog.weaponsById,
    armorById: catalog.armorById,
    spellsById: catalog.spellsById,
    suppressSameSideHostile,
    hydratedEncounterState,
    persistedCombat,
  })

  const [interactionMode, setInteractionMode] = useState<GridInteractionMode>('select-target')
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false)

  const selectedAction = useMemo(
    () => encounter.availableActions.find((a) => a.id === encounter.selectedActionId) ?? null,
    [encounter.availableActions, encounter.selectedActionId],
  )

  const viewerContext: EncounterViewerContext = useMemo(
    () => ({
      viewerRole: 'dm',
      simulatorViewerMode: 'active-combatant',
      presentationSelectedCombatantId: null,
      controlledCombatantIds: [],
    }),
    [],
  )

  const presentationGridPerceptionInput = useMemo(
    () =>
      deriveEncounterPresentationGridPerceptionInput({
        encounterState: encounter.encounterState,
        simulatorViewerMode: 'active-combatant',
        activeCombatantId: encounter.activeCombatantId,
        presentationSelectedCombatantId: null,
      }),
    [encounter.encounterState, encounter.activeCombatantId],
  )

  const prevActiveCombatantId = useRef(encounter.activeCombatantId)
  if (prevActiveCombatantId.current !== encounter.activeCombatantId) {
    prevActiveCombatantId.current = encounter.activeCombatantId
    if (interactionMode !== 'select-target') setInteractionMode('select-target')
  }

  useEffect(() => {
    if (encounter.aoeStep === 'none' && interactionMode === 'aoe-place') {
      setInteractionMode('select-target')
    }
  }, [encounter.aoeStep, interactionMode])

  useEffect(() => {
    if (encounter.aoeStep === 'none') return
    if (isAreaGridAction(selectedAction, encounter.selectedCasterOptions)) {
      setInteractionMode('aoe-place')
    }
  }, [encounter.aoeStep, selectedAction, encounter.selectedCasterOptions])

  const { gridViewModel, combatantViewerPresentationKindById } = useEncounterGridViewModel({
    encounterState: encounter.encounterState,
    activeCombatantId: encounter.activeCombatantId,
    activeCombatant: encounter.activeCombatant,
    selectedAction,
    selectedActionTargetId: encounter.selectedActionTargetId,
    selectedCasterOptions: encounter.selectedCasterOptions,
    aoeStep: encounter.aoeStep,
    aoeHoverCellId: encounter.aoeHoverCellId,
    aoeOriginCellId: encounter.aoeOriginCellId,
    interactionMode,
    singleCellPlacementHoverCellId: encounter.singleCellPlacementHoverCellId,
    selectedSingleCellPlacementCellId: encounter.selectedSingleCellPlacementCellId,
    presentationGridPerceptionInput: presentationGridPerceptionInput ?? undefined,
  })

  const handleResetEncounter = useCallback(() => {
    if (campaignId) {
      navigate(campaignGameSessionLobbyPath(campaignId, session.id))
    }
  }, [campaignId, navigate, session.id])

  const { activeHeader } = useEncounterCombatActiveHeader({
    variant: 'session',
    encounterState: encounter.encounterState,
    activeCombatant: encounter.activeCombatant,
    availableActions: encounter.availableActions,
    selectedActionId: encounter.selectedActionId,
    selectedAction,
    selectedCasterOptions: encounter.selectedCasterOptions,
    aoeStep: encounter.aoeStep,
    aoeOriginCellId: encounter.aoeOriginCellId,
    selectedActionTargetId: encounter.selectedActionTargetId,
    selectedSingleCellPlacementCellId: encounter.selectedSingleCellPlacementCellId,
    selectedObjectAnchorId: encounter.selectedObjectAnchorId,
    interactionMode,
    gridViewModel,
    combatantViewerPresentationKindById,
    presentationGridPerceptionInput,
    viewerContext,
    simulatorViewerMode: 'active-combatant',
    onSimulatorViewerModeChange: () => {},
    handleNextTurn: encounter.handleNextTurn,
    handleResetEncounter,
    setActionDrawerOpen,
    onEditEncounter: () => {},
    monstersById,
    spellsById: catalog.spellsById,
    suppressSameSideHostile,
  })

  const playSurface = useEncounterActivePlaySurface(
    {
      encounterState: encounter.encounterState,
      activeHeader,
      activeCombatant: encounter.activeCombatant,
      activeCombatantId: encounter.activeCombatantId,
      availableActions: encounter.availableActions,
      selectedActionId: encounter.selectedActionId,
      setSelectedActionId: encounter.setSelectedActionId,
      selectedCasterOptions: encounter.selectedCasterOptions,
      setSelectedCasterOptions: encounter.setSelectedCasterOptions,
      selectedSingleCellPlacementCellId: encounter.selectedSingleCellPlacementCellId,
      setSelectedSingleCellPlacementCellId: encounter.setSelectedSingleCellPlacementCellId,
      selectedActionTargetId: encounter.selectedActionTargetId,
      setSelectedActionTargetId: encounter.setSelectedActionTargetId,
      selectedAction,
      aoeStep: encounter.aoeStep,
      setAoeStep: encounter.setAoeStep,
      aoeOriginCellId: encounter.aoeOriginCellId,
      setAoeOriginCellId: encounter.setAoeOriginCellId,
      aoeHoverCellId: encounter.aoeHoverCellId,
      setAoeHoverCellId: encounter.setAoeHoverCellId,
      resetAoePlacement: encounter.resetAoePlacement,
      gridViewModel,
      combatantViewerPresentationKindById,
      handleMoveCombatant: encounter.handleMoveCombatant,
      handleResolveAction: encounter.handleResolveAction,
      handleNextTurn: encounter.handleNextTurn,
      registerCombatLogAppended: encounter.registerCombatLogAppended,
      handleResetEncounter,
      actionDrawerOpen,
      setActionDrawerOpen,
      monstersById,
      characterPortraitById,
      interactionMode,
      setInteractionMode,
      singleCellPlacementHoverCellId: encounter.singleCellPlacementHoverCellId,
      setSingleCellPlacementHoverCellId: encounter.setSingleCellPlacementHoverCellId,
      unaffectedCombatantIds: encounter.unaffectedCombatantIds,
      setUnaffectedCombatantIds: encounter.setUnaffectedCombatantIds,
      selectedObjectAnchorId: encounter.selectedObjectAnchorId,
      setSelectedObjectAnchorId: encounter.setSelectedObjectAnchorId,
      objectAnchorHoverCellId: encounter.objectAnchorHoverCellId,
      setObjectAnchorHoverCellId: encounter.setObjectAnchorHoverCellId,
      suppressSameSideHostile,
      spellsById: catalog.spellsById,
    },
    { setupPathWhenEmpty: null },
  )

  if (loadError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {loadError}
      </Alert>
    )
  }

  if (!persisted || !session.activeEncounterId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress aria-label="Loading combat" />
      </Box>
    )
  }

  return playSurface ?? (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <CircularProgress aria-label="Preparing play surface" />
    </Box>
  )
}
