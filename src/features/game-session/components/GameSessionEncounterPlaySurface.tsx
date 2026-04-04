import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import StairsIcon from '@mui/icons-material/Stairs'
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
import { getCellForCombatant } from '@/features/mechanics/domain/combat/space/space.helpers'
import {
  deriveEncounterPresentationGridPerceptionInput,
  resolveSessionControlledCombatantIds,
  type EncounterViewerContext,
} from '@/features/encounter/domain'
import { isAreaGridAction } from '@/features/encounter/helpers/actions'
import type { GridInteractionMode } from '@/features/encounter/domain'
import { useEncounterState } from '@/features/encounter/hooks/useEncounterState'
import { useEncounterGridViewModel } from '@/features/encounter/hooks/useEncounterGridViewModel'
import { useEncounterCombatActiveHeader } from '@/features/encounter/hooks/useEncounterCombatActiveHeader'
import { useEncounterActivePlaySurface } from '@/features/encounter/hooks/useEncounterActivePlaySurface'
import { EncounterContextPrompt } from '@/features/encounter/components'
import type { CombatantPortraitEntry } from '@/features/encounter/helpers/combatants'

import type { Location } from '@/features/content/locations/domain/types'
import { listCampaignLocations } from '@/features/content/locations/domain/repo/locationRepo'
import { STAIR_TRAVERSAL_MOVEMENT_COST_FT } from '@/shared/domain/locations/transitions/stairTraversal.constants'
import type { GameSession } from '../domain/game-session.types'
import { summarizeEncounterSpaceForLog } from '../combat/buildEncounterSpaceFromLocationMap'
import { resolveGameSessionStairTraversalPayload } from '../combat/resolveGameSessionStairTraversalPayload'
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

  const [interactionMode, setInteractionMode] = useState<GridInteractionMode>('select-target')
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false)

  const selectedAction = useMemo(
    () => encounter.availableActions.find((a) => a.id === encounter.selectedActionId) ?? null,
    [encounter.availableActions, encounter.selectedActionId],
  )

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

  const viewerContext: EncounterViewerContext = useMemo(
    () => ({
      mode: 'session',
      viewerRole,
      viewerUserId: user?.id ?? null,
      simulatorViewerMode: 'active-combatant',
      presentationSelectedCombatantId: null,
      controlledCombatantIds,
    }),
    [viewerRole, user?.id, controlledCombatantIds],
  )

  const presentationGridPerceptionInput = useMemo(
    () =>
      deriveEncounterPresentationGridPerceptionInput({
        encounterState: encounter.encounterState,
        /** DM seat: omniscient grid tokens + cell presentation; players use active combatant POV. */
        simulatorViewerMode: viewerRole === 'dm' ? 'dm' : 'active-combatant',
        activeCombatantId: encounter.activeCombatantId,
        presentationSelectedCombatantId: null,
      }),
    [encounter.encounterState, encounter.activeCombatantId, viewerRole],
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

  const { activeHeader, capabilities, encounterDirective, contextStripTitleTone } = useEncounterCombatActiveHeader({
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

  const [stairPayloadRes, setStairPayloadRes] = useState<
    Awaited<ReturnType<typeof resolveGameSessionStairTraversalPayload>> | null
  >(null)

  /** Ensures stair eligibility re-resolves when the mover steps onto a stair cell (not only on encounter ref churn). */
  const activeCombatantCellId = useMemo(() => {
    const es = encounter.encounterState
    if (!es?.space || !es.activeCombatantId || !es.placements?.length) return null
    return getCellForCombatant(es.placements, es.activeCombatantId, es.space)
  }, [encounter.encounterState?.placements, encounter.encounterState?.space, encounter.encounterState?.activeCombatantId])

  useEffect(() => {
    let cancelled = false
    if (!campaignId || !encounter.encounterState || campaignLocations.length === 0) {
      setStairPayloadRes(null)
      return
    }
    void resolveGameSessionStairTraversalPayload({
      campaignId,
      session,
      locations: campaignLocations,
      encounterState: encounter.encounterState,
    }).then((r) => {
      if (!cancelled) setStairPayloadRes(r)
    })
    return () => {
      cancelled = true
    }
  }, [
    campaignId,
    session,
    campaignLocations,
    encounter.encounterState,
    encounter.activeCombatantId,
    activeCombatantCellId,
  ])

  const contextualStripOverride = useMemo(() => {
    if (!stairPayloadRes?.ok || viewerRole === 'observer') return null
    const moveRemain = encounter.activeCombatant?.turnResources?.movementRemaining ?? 0
    const controlsActive = Boolean(capabilities?.canMoveActiveCombatant)
    const canAfford = moveRemain >= STAIR_TRAVERSAL_MOVEMENT_COST_FT
    const canUse = controlsActive && canAfford
    return (
      <EncounterContextPrompt
        title="Use stairs"
        subtitle={stairPayloadRes.destinationFloorLabel}
        icon={<StairsIcon fontSize="small" color="action" aria-hidden />}
        primaryAction={{
          label: 'Go',
          onClick: () => encounter.handleStairTraversal(stairPayloadRes.intent),
        }}
        disabled={!canUse}
        unavailableReason={
          canUse
            ? null
            : !controlsActive
              ? viewerRole === 'dm'
                ? 'Only the controlling player can move this combatant.'
                : 'You cannot control this combatant right now.'
              : `Need at least ${STAIR_TRAVERSAL_MOVEMENT_COST_FT} ft of movement remaining to use stairs.`
        }
      />
    )
  }, [
    stairPayloadRes,
    viewerRole,
    capabilities?.canMoveActiveCombatant,
    encounter.activeCombatant?.turnResources?.movementRemaining,
    encounter,
  ])

  const playSurface = useEncounterActivePlaySurface(
    {
      encounterState: encounter.encounterState,
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
      contextualStripOverride,
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
