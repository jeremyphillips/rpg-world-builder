import {
  createContext,
  useCallback,
  useContext,
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
import { buildMonsterModalStats } from '../helpers/combatant-modal-stats'
import { useEncounterState, useEncounterOptions, useEncounterRoster } from '../hooks'
import {
  OpponentRosterLane,
  AllyRosterLane,
  EncounterSetupHeader,
  EncounterActiveHeader,
  EncounterActiveFooter,
  SelectEncounterAllyModal,
  SelectEncounterOpponentModal,
  EncounterEditModal,
  CombatTurnOrderModal,
  GRID_SIZE_PRESETS,
  type EnvironmentSetupValues,
  type GridSizePreset,
  type InteractionMode,
} from '../components'
import { selectGridViewModel } from '../space/space.selectors'
import { createSquareGridSpace } from '../space/createSquareGridSpace'

import { campaignEncounterActivePath, campaignEncounterSetupPath } from './encounterPaths'

const DEFAULT_ENVIRONMENT: EnvironmentSetupValues = {
  setting: 'outdoors',
  lightingLevel: 'bright',
  terrainMovement: 'normal',
  visibilityObscured: 'none',
}

function useEncounterRuntimeValue() {
  useActiveCampaign()
  const navigate = useNavigate()
  const { id: campaignId } = useParams<{ id: string }>()
  const { catalog } = useCampaignRules()
  const { party } = useCampaignParty('approved')
  const { characters: npcs } = useCharacters({ type: 'npc' })

  const runtimeIdCounter = useRef(0)
  const nextRuntimeId = (prefix: string) => {
    runtimeIdCounter.current += 1
    return `${prefix}-${runtimeIdCounter.current}`
  }

  const monstersById = catalog.monstersById
  const { allyOptions, opponentOptions, opponentOptionsByKey } = useEncounterOptions({
    allies: party,
    npcs,
    monstersById,
  })

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
    allyOptions,
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
  } = useEncounterState({
    selectedCombatantIds,
    opponentRoster,
    monstersById,
    weaponsById: catalog.weaponsById,
    armorById: catalog.armorById,
  })

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

  const [environmentSetup, setEnvironmentSetup] = useState<EnvironmentSetupValues>(DEFAULT_ENVIRONMENT)
  const [gridSizePreset, setGridSizePreset] = useState<GridSizePreset>('medium')
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('select-target')
  const [allyModalOpen, setAllyModalOpen] = useState(false)
  const [opponentModalOpen, setOpponentModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [turnOrderModalOpen, setTurnOrderModalOpen] = useState(false)

  const allyModalOptions = useMemo(
    () =>
      allyOptions.map((a) => ({
        id: a.id,
        label: a.label,
        subtitle: a.subtitle,
      })),
    [allyOptions],
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
          }
        }
        return {
          id: o.key,
          label: o.label,
          subtitle: formatMonsterIdentityLine(block),
          stats: buildMonsterModalStats(block, catalog.armorById),
        }
      })
    const npcList = opponentOptions
      .filter((o) => o.kind === 'npc')
      .map((o) => ({
        id: o.key,
        label: o.label,
        subtitle: o.subtitle,
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

  const canStartEncounter = selectedCombatants.length > 0 && unresolvedCombatantCount === 0

  const selectedActionLabel = useMemo(
    () => availableActions.find((a) => a.id === selectedActionId)?.label ?? null,
    [availableActions, selectedActionId],
  )
  const selectedTargetLabel = useMemo(
    () => availableActionTargets.find((t) => t.id === selectedActionTargetId)?.label ?? null,
    [availableActionTargets, selectedActionTargetId],
  )

  const selectedActionRangeFt = useMemo(() => {
    const action = availableActions.find((a) => a.id === selectedActionId)
    return action?.targeting?.rangeFt ?? null
  }, [availableActions, selectedActionId])

  const gridViewModel = useMemo(() => {
    if (!encounterState) return undefined
    return selectGridViewModel(encounterState, {
      selectedTargetId: selectedActionTargetId || null,
      selectedActionRangeFt,
      showReachable: interactionMode === 'move',
    })
  }, [encounterState, selectedActionTargetId, selectedActionRangeFt, interactionMode])

  const turnResources = activeCombatant?.turnResources
    ? {
        actionAvailable: activeCombatant.turnResources.actionAvailable,
        bonusActionAvailable: activeCombatant.turnResources.bonusActionAvailable,
        reactionAvailable: activeCombatant.turnResources.reactionAvailable,
        movementRemaining: activeCombatant.turnResources.movementRemaining ?? 0,
      }
    : null

  const environmentSummaryParts = [
    environmentSetup.setting,
    environmentSetup.lightingLevel !== 'bright' ? environmentSetup.lightingLevel : null,
    environmentSetup.terrainMovement !== 'normal' ? environmentSetup.terrainMovement : null,
    environmentSetup.visibilityObscured !== 'none' ? environmentSetup.visibilityObscured : null,
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
        const space = createSquareGridSpace({
          id: `grid-${Date.now()}`,
          name: 'Combat Grid',
          columns: preset.columns,
          rows: preset.rows,
        })
        handleStartEncounter({ space })
      }}
    />
  )

  const nextCombatantLabel = useMemo(() => {
    if (!encounterState) return null
    const nextIdx = encounterState.turnIndex + 1
    const nextId = nextIdx < encounterState.initiativeOrder.length
      ? encounterState.initiativeOrder[nextIdx]
      : encounterState.initiativeOrder[0] ?? null
    if (!nextId) return null
    return encounterState.combatantsById[nextId]?.source.label ?? null
  }, [encounterState])

  const activeHeader = encounterState ? (
    <EncounterActiveHeader
      roundNumber={encounterState.roundNumber}
      turnIndex={encounterState.turnIndex}
      turnCount={encounterState.initiativeOrder.length}
      activeCombatantLabel={activeCombatant?.source.label ?? null}
      nextCombatantLabel={nextCombatantLabel}
      onEditEncounter={() => setEditModalOpen(true)}
      onResetEncounter={handleResetEncounter}
      onViewTurnOrder={() => setTurnOrderModalOpen(true)}
    />
  ) : undefined

  const activeFooter = encounterState ? (
    <EncounterActiveFooter
      turnResources={turnResources}
      selectedActionLabel={selectedActionLabel}
      selectedTargetLabel={selectedTargetLabel}
      canResolveAction={
        Boolean(
          selectedActionId &&
          selectedActionTargetId &&
          availableActions.some((a) => a.id === selectedActionId),
        )
      }
      interactionMode={interactionMode}
      onToggleInteractionMode={() =>
        setInteractionMode((prev) => (prev === 'move' ? 'select-target' : 'move'))
      }
      onResolveAction={handleResolveAction}
      onEndTurn={handleNextTurn}
    />
  ) : undefined

  return {
    campaignId,
    monstersById,
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
    selectedActionTargetId,
    setSelectedActionTargetId,
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
    allyModalOptions,
    monsterModalOptions,
    npcModalOptions,
    selectedOpponentKeys,
    handleAllyModalApply,
    handleOpponentModalApply,
    canStartEncounter,
    gridViewModel,
    setupHeader,
    activeHeader,
    activeFooter,
    handleStartEncounter,
    handleResetEncounter,
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
    allyModalOptions,
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
  } = useEncounterRuntime()

  return (
    <>
      <SelectEncounterAllyModal
        open={allyModalOpen}
        onClose={() => setAllyModalOpen(false)}
        options={allyModalOptions}
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
