import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import { useAuth } from '@/app/providers/AuthProvider'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { useCampaignParty } from '@/features/campaign/hooks'
import { useCharacters } from '@/features/character/hooks'
import { fetchPersistedCombatSession } from '@/features/combat/api/combatSessionApi'
import type { OpponentRosterEntry } from '@/features/encounter/types'
import type { EncounterState } from '@/features/mechanics/domain/combat'
import {
  buildEncounterPresentationGridPerceptionInputArgs,
  deriveEncounterPresentationGridPerceptionInput,
  resolveSessionControlledCombatantIds,
  sessionEncounterPresentationSimulatorViewerMode,
  type EncounterViewerContext,
} from '@/features/encounter/domain'
import { useEncounterState } from '@/features/encounter/hooks/useEncounterState'
import { useEncounterSceneViewerPresentation } from '@/features/encounter/hooks/useEncounterSceneViewerPresentation'
import { useEncounterRuntimeInteractionMode } from '@/features/encounter/hooks/useEncounterRuntimeInteractionMode'
import { useEncounterRuntimePresentation } from '@/features/encounter/hooks/useEncounterRuntimePresentation'
import { useEncounterActivePlaySurface } from '@/features/encounter/hooks/useEncounterActivePlaySurface'
import type { EncounterContextPromptEnvironment } from '@/features/encounter/domain/encounterContextPrompt.types'
import type { CombatantPortraitEntry } from '@/features/encounter/helpers/combatants'

import type { Location } from '@/features/content/locations/domain/model/location'
import { listCampaignLocations } from '@/features/content/locations/domain/repo/locationRepo'
import type { GameSession } from '../domain/game-session.types'
import { summarizeEncounterSpaceForLog } from '../combat/buildEncounterSpaceFromLocationMap'
import { campaignGameSessionLobbyPath } from '../routes/gameSessionPaths'
import { useGameSessionSync } from '../routes/GameSessionSyncContext'
import { resolveGameSessionEncounterSeat } from '../utils/resolveGameSessionEncounterSeat'

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
  const { user } = useAuth()
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

  const [campaignLocations, setCampaignLocations] = useState<Location[]>([])

  useEffect(() => {
    if (!campaignId) return
    let cancelled = false
    void listCampaignLocations(campaignId).then((locs) => {
      if (!cancelled) setCampaignLocations(locs)
    })
    return () => {
      cancelled = true
    }
  }, [campaignId])

  const [persisted, setPersisted] = useState<Awaited<ReturnType<typeof fetchPersistedCombatSession>> | null>(
    null,
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const revisionRef = useRef(revision)
  revisionRef.current = revision

  /** Play-level: refetch persisted combat when shell reports a newer `combatRevision` for this
   * encounter (layout subscription stays lightweight; combat GET runs here).
   */
  const { lastSyncPayload } = useGameSessionSync()

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

  useEffect(() => {
    if (!session.activeEncounterId || !lastSyncPayload) return
    if (lastSyncPayload.combatSessionId !== session.activeEncounterId) return
    if (lastSyncPayload.combatRevision === undefined) return
    if (lastSyncPayload.combatRevision <= revisionRef.current) return

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
  }, [lastSyncPayload, session.activeEncounterId])

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

  const [actionDrawerOpen, setActionDrawerOpen] = useState(false)

  const selectedAction = useMemo(
    () => encounter.availableActions.find((a) => a.id === encounter.selectedActionId) ?? null,
    [encounter.availableActions, encounter.selectedActionId],
  )

  const { interactionMode, setInteractionMode } = useEncounterRuntimeInteractionMode({
    activeCombatantId: encounter.activeCombatantId,
    aoeStep: encounter.aoeStep,
    selectedAction,
    selectedCasterOptions: encounter.selectedCasterOptions,
  })

  const { viewerRole, playerCharacterId } = useMemo(
    () =>
      resolveGameSessionEncounterSeat(session, user?.id ?? null, {
        encounterState: encounter.encounterState,
        partyRoster: party.map((m) => ({ id: m.id, ownerUserId: m.ownerUserId })),
      }),
    [session, user?.id, encounter.encounterState, party],
  )

  const controlledCombatantIds = useMemo(() => {
    if (!encounter.encounterState) return [] as string[]
    return resolveSessionControlledCombatantIds(encounter.encounterState, {
      viewerRole,
      playerCharacterId,
    })
  }, [encounter.encounterState, viewerRole, playerCharacterId])

  const sessionPresentationViewerMode = sessionEncounterPresentationSimulatorViewerMode(viewerRole)

  const viewerContext: EncounterViewerContext = useMemo(
    () => ({
      mode: 'session',
      viewerRole,
      viewerUserId: user?.id ?? null,
      simulatorViewerMode: sessionPresentationViewerMode,
      presentationSelectedCombatantId: null,
      controlledCombatantIds,
    }),
    [viewerRole, user?.id, controlledCombatantIds, sessionPresentationViewerMode],
  )

  const { presentationEncounterState, sceneViewerSlot } = useEncounterSceneViewerPresentation({
    encounterState: encounter.encounterState,
    controlledCombatantIds,
    selectedActionTargetId: encounter.selectedActionTargetId,
    presentationSelectedCombatantId: null,
    activeCombatantId: encounter.activeCombatantId,
    viewerRole,
    hostMode: 'session',
  })

  const presentationGridPerceptionInput = useMemo(
    () =>
      deriveEncounterPresentationGridPerceptionInput(
        buildEncounterPresentationGridPerceptionInputArgs({
          hostMode: 'session',
          viewerRole,
          encounterState: presentationEncounterState,
          activeCombatantId: encounter.activeCombatantId,
        }),
      ),
    [presentationEncounterState, encounter.activeCombatantId, viewerRole],
  )

  const handleResetEncounter = useCallback(() => {
    if (campaignId) {
      navigate(campaignGameSessionLobbyPath(campaignId, session.id))
    }
  }, [campaignId, navigate, session.id])

  const { gridViewModel, combatantViewerPresentationKindById, activeHeader, capabilities, encounterDirective, contextStripTitleTone } =
    useEncounterRuntimePresentation({
      presentationEncounterState,
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
      availableActions: encounter.availableActions,
      selectedActionId: encounter.selectedActionId,
      selectedObjectAnchorId: encounter.selectedObjectAnchorId,
      viewerContext,
      simulatorViewerMode: sessionPresentationViewerMode,
      onSimulatorViewerModeChange: () => {},
      handleNextTurn: encounter.handleNextTurn,
      handleResetEncounter,
      setActionDrawerOpen,
      onEditEncounter: () => {},
      monstersById,
      spellsById: catalog.spellsById,
      suppressSameSideHostile,
      sceneViewerSlot,
    })

  const contextualPromptEnvironment = useMemo((): EncounterContextPromptEnvironment | null => {
    if (!campaignId) return null
    return {
      campaignId,
      locations: campaignLocations,
      locationContext: session.location,
      encounterState: encounter.encounterState,
    }
  }, [campaignId, campaignLocations, session.location, encounter.encounterState])

  const playSurface = useEncounterActivePlaySurface(
    {
      encounterState: encounter.encounterState,
      presentationEncounterState,
      viewerContext,
      capabilities,
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
      encounterDirective,
      contextStripTitleTone,
      contextualPromptEnvironment,
      handleStairTraversal: encounter.handleStairTraversal,
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
