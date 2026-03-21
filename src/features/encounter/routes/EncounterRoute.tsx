import { useCallback, useMemo, useRef, useState } from 'react'

import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { useCampaignParty } from '@/features/campaign/hooks'
import { useCharacters } from '@/features/character/hooks'
import { useEncounterState, useEncounterOptions, useEncounterRoster } from '../hooks'
import {
  CombatLogPanel,
  OpponentRosterLane,
  AllyRosterLane,
  EncounterView,
  EncounterSetupHeader,
  EncounterActiveHeader,
  EncounterActiveFooter,
  EncounterSetupView,
  EncounterActiveView,
  EncounterEnvironmentSetup,
  EncounterEnvironmentSummary,
  AllyCombatantActiveCard,
  OpponentCombatantActiveCard,
  AllyCombatantActivePreviewCard,
  OpponentCombatantActivePreviewCard,
  CombatActionPreviewCard,
  CombatTargetPreviewCard,
  CombatLane,
  SelectEncounterAllyModal,
  SelectEncounterOpponentModal,
  EncounterEditModal,
  CombatTurnOrderModal,
} from '../components'
import type { EnvironmentSetupValues } from '../components/EncounterEnvironmentSetup'

const DEFAULT_ENVIRONMENT: EnvironmentSetupValues = {
  setting: 'outdoors',
  lightingLevel: 'bright',
  terrainMovement: 'normal',
  visibilityObscured: 'none',
}

export default function EncounterRoute() {
  useActiveCampaign()
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
    controlTargetId: _controlTargetId,
    setControlTargetId: _setControlTargetId,
    damageAmount: _damageAmount,
    setDamageAmount: _setDamageAmount,
    damageTypeInput: _damageTypeInput,
    setDamageTypeInput: _setDamageTypeInput,
    healingAmount: _healingAmount,
    setHealingAmount: _setHealingAmount,
    conditionInput: _conditionInput,
    setConditionInput: _setConditionInput,
    stateInput: _stateInput,
    setStateInput: _setStateInput,
    markerDurationTurns: _markerDurationTurns,
    setMarkerDurationTurns: _setMarkerDurationTurns,
    markerDurationBoundary: _markerDurationBoundary,
    setMarkerDurationBoundary: _setMarkerDurationBoundary,
    environmentContext,
    setEnvironmentContext: _setEnvironmentContext,
    monsterFormsById,
    monsterManualTriggersById,
    reducedToZeroSaveOutcome: _reducedToZeroSaveOutcome,
    setReducedToZeroSaveOutcome: _setReducedToZeroSaveOutcome,
    controlTargetHasReducedToZeroSave: _controlTargetHasReducedToZeroSave,
    canTriggerReducedToZeroHook: _canTriggerReducedToZeroHook,
    handleResolvedCombatant,
    handleStartEncounter,
    handleNextTurn,
    handleResolveAction,
    handleResetEncounter,
    handleApplyDamage: _handleApplyDamage,
    handleApplyHealing: _handleApplyHealing,
    handleAddCondition: _handleAddCondition,
    handleRemoveCondition: _handleRemoveCondition,
    handleAddState: _handleAddState,
    handleRemoveState: _handleRemoveState,
    handleTriggerReducedToZeroHook: _handleTriggerReducedToZeroHook,
    handleMonsterFormChange: _handleMonsterFormChange,
    handleMonsterManualTriggerChange: _handleMonsterManualTriggerChange,
  } = useEncounterState({
    selectedCombatantIds,
    opponentRoster,
    monstersById,
    weaponsById: catalog.weaponsById,
    armorById: catalog.armorById,
  })

  const [environmentSetup, setEnvironmentSetup] = useState<EnvironmentSetupValues>(DEFAULT_ENVIRONMENT)
  const [allyModalOpen, setAllyModalOpen] = useState(false)
  const [opponentModalOpen, setOpponentModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [turnOrderModalOpen, setTurnOrderModalOpen] = useState(false)

  const allyModalOptions = useMemo(
    () => allyOptions.map((a) => ({ id: a.id, name: a.label })),
    [allyOptions],
  )

  const { monsterModalOptions, npcModalOptions } = useMemo(() => {
    const monsters = opponentOptions
      .filter((o) => o.kind === 'monster')
      .map((o) => {
        const block = monstersById[o.sourceId]
        return {
          id: o.sourceId,
          name: o.label,
          challengeRating: block?.lore?.challengeRating != null ? String(block.lore.challengeRating) : '—',
          creatureType: block?.type ?? '—',
        }
      })
    const npcList = opponentOptions
      .filter((o) => o.kind === 'npc')
      .map((o) => ({ id: o.sourceId, name: o.label }))
    return { monsterModalOptions: monsters, npcModalOptions: npcList }
  }, [opponentOptions, monstersById])

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

  const mode = encounterState ? 'active' : 'setup'
  const canStartEncounter = selectedCombatants.length > 0 && unresolvedCombatantCount === 0

  const selectedActionLabel = useMemo(
    () => availableActions.find((a) => a.id === selectedActionId)?.label ?? null,
    [availableActions, selectedActionId],
  )
  const selectedTargetLabel = useMemo(
    () => availableActionTargets.find((t) => t.id === selectedActionTargetId)?.label ?? null,
    [availableActionTargets, selectedActionTargetId],
  )

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
      onStartEncounter={handleStartEncounter}
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
      onResolveAction={handleResolveAction}
      onEndTurn={handleNextTurn}
    />
  ) : undefined

  return (
    <>
    <EncounterView
      mode={mode}
      setupHeader={setupHeader}
      activeHeader={activeHeader}
      activeFooter={activeFooter}
    >
      {mode === 'setup' && (
        <EncounterSetupView
          environmentSetup={
            <EncounterEnvironmentSetup
              values={environmentSetup}
              onChange={setEnvironmentSetup}
            />
          }
          allyLane={
            <AllyRosterLane
              selectedAllyIds={selectedAllyIds}
              onOpenModal={() => setAllyModalOpen(true)}
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
              onOpenModal={() => setOpponentModalOpen(true)}
              onResolvedCombatant={handleResolvedCombatant}
              onRemoveOpponentCombatant={removeOpponentCombatant}
              onAddOpponentCopy={addOpponentCopy}
            />
          }
        />
      )}

      {mode === 'active' && encounterState && (
        <EncounterActiveView
          focusedCard={
            activeCombatant ? (
              activeCombatant.side === 'party' ? (
                <AllyCombatantActiveCard
                  combatant={activeCombatant}
                  availableActions={availableActions}
                  selectedActionId={selectedActionId}
                  onSelectAction={setSelectedActionId}
                  selectedCasterOptions={selectedCasterOptions}
                  onCasterOptionsChange={setSelectedCasterOptions}
                />
              ) : (
                <OpponentCombatantActiveCard
                  combatant={activeCombatant}
                  availableActions={availableActions}
                  selectedActionId={selectedActionId}
                  onSelectAction={setSelectedActionId}
                  selectedCasterOptions={selectedCasterOptions}
                  onCasterOptionsChange={setSelectedCasterOptions}
                />
              )
            ) : null
          }
          actionPreview={
            <>
              <Typography variant="subtitle2" color="text.secondary">Action</Typography>
              <CombatActionPreviewCard
                action={availableActions.find((a) => a.id === selectedActionId) ?? null}
              />
            </>
          }
          targetPreview={
            <>
              <Typography variant="subtitle2" color="text.secondary">Target</Typography>  
              <CombatTargetPreviewCard
                target={
                  selectedActionTargetId
                    ? encounterState.combatantsById[selectedActionTargetId] ?? null
                    : null
                }
              />
            </>
          }
          environmentSummary={<EncounterEnvironmentSummary values={environmentSetup} />}
          allyLane={
            <CombatLane title="Allies" description="Party members in this encounter.">
              <Stack spacing={1.5}>
                {encounterState.partyCombatantIds.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No ally combatants.</Typography>
                ) : (
                  encounterState.partyCombatantIds.map((id) => {
                    const combatant = encounterState.combatantsById[id]
                    if (!combatant) return null
                    return (
                      <AllyCombatantActivePreviewCard
                        key={id}
                        combatant={combatant}
                        isCurrentTurn={id === activeCombatantId}
                        isSelected={id === selectedActionTargetId}
                        onClick={() => setSelectedActionTargetId(id)}
                      />
                    )
                  })
                )}
              </Stack>
            </CombatLane>
          }
          opponentLane={
            <CombatLane title="Opponents" description="Enemy combatants in this encounter.">
              <Stack spacing={1.5}>
                {encounterState.enemyCombatantIds.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No opponent combatants.</Typography>
                ) : (
                  encounterState.enemyCombatantIds.map((id) => {
                    const combatant = encounterState.combatantsById[id]
                    if (!combatant) return null
                    return (
                      <OpponentCombatantActivePreviewCard
                        key={id}
                        combatant={combatant}
                        isCurrentTurn={id === activeCombatantId}
                        isSelected={id === selectedActionTargetId}
                        onClick={() => setSelectedActionTargetId(id)}
                      />
                    )
                  })
                )}
              </Stack>
            </CombatLane>
          }
          combatLog={<CombatLogPanel log={encounterState.log} />}
        />
      )}
    </EncounterView>

    <SelectEncounterAllyModal
      open={allyModalOpen}
      onClose={() => setAllyModalOpen(false)}
      allies={allyModalOptions}
      selectedAllyIds={selectedAllyIds}
      onApply={handleAllyModalApply}
    />

    <SelectEncounterOpponentModal
      open={opponentModalOpen}
      onClose={() => setOpponentModalOpen(false)}
      monsters={monsterModalOptions}
      npcs={npcModalOptions}
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
          onOpenModal={() => { setEditModalOpen(false); setAllyModalOpen(true) }}
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
          onOpenModal={() => { setEditModalOpen(false); setOpponentModalOpen(true) }}
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
