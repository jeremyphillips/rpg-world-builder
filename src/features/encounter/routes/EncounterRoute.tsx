import { useMemo, useRef, useState } from 'react'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { useCampaignParty } from '@/features/campaign/hooks'
import { useCharacters } from '@/features/character/hooks'
import { useEncounterState, useEncounterOptions, useEncounterRoster } from '../hooks'
import {
  CombatLogPanel,
  EncounterControlsPanel,
  OpponentRosterLane,
  AllyRosterLane,
  EncounterView,
  EncounterSetupHeader,
  EncounterActiveHeader,
  EncounterActiveFooter,
  EncounterSetupView,
  EncounterEnvironmentSetup,
} from '../components'
import type { EnvironmentSetupValues } from '../components/EncounterEnvironmentSetup'

const DEFAULT_ENVIRONMENT: EnvironmentSetupValues = {
  setting: 'outdoors',
  lightingLevel: 'bright',
  terrainMovement: 'normal',
  visibilityObscured: 'none',
}

export default function EncounterRoute() {
  const { campaignId, campaignName } = useActiveCampaign()
  const { catalog } = useCampaignRules()
  const { party, loading: loadingParty } = useCampaignParty('approved')
  const { characters: npcs, loading: loadingNpcs } = useCharacters({ type: 'npc' })

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
    selectedAllyOptions,
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
    selectedActionTargetId,
    setSelectedActionTargetId,
    unresolvedCombatantCount,
    selectedCombatants,
    controlTargetId,
    setControlTargetId,
    damageAmount,
    setDamageAmount,
    damageTypeInput,
    setDamageTypeInput,
    healingAmount,
    setHealingAmount,
    conditionInput,
    setConditionInput,
    stateInput,
    setStateInput,
    markerDurationTurns,
    setMarkerDurationTurns,
    markerDurationBoundary,
    setMarkerDurationBoundary,
    environmentContext,
    setEnvironmentContext,
    monsterFormsById,
    monsterManualTriggersById,
    reducedToZeroSaveOutcome,
    setReducedToZeroSaveOutcome,
    controlTargetHasReducedToZeroSave,
    canTriggerReducedToZeroHook,
    handleResolvedCombatant,
    handleStartEncounter,
    handleNextTurn,
    handleResolveAction,
    handleResetEncounter,
    handleApplyDamage,
    handleApplyHealing,
    handleAddCondition,
    handleRemoveCondition,
    handleAddState,
    handleRemoveState,
    handleTriggerReducedToZeroHook,
    handleMonsterFormChange,
    handleMonsterManualTriggerChange,
  } = useEncounterState({
    selectedCombatantIds,
    opponentRoster,
    monstersById,
  })

  const [environmentSetup, setEnvironmentSetup] = useState<EnvironmentSetupValues>(DEFAULT_ENVIRONMENT)

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

  const activeHeader = encounterState ? (
    <EncounterActiveHeader
      roundNumber={encounterState.roundNumber}
      turnIndex={encounterState.turnIndex}
      activeCombatantLabel={activeCombatant?.source.label ?? null}
      onNextTurn={handleNextTurn}
      onResetEncounter={handleResetEncounter}
    />
  ) : undefined

  const activeFooter = encounterState ? (
    <EncounterActiveFooter
      turnResources={turnResources}
      selectedActionLabel={selectedActionLabel}
      selectedTargetLabel={selectedTargetLabel}
      canResolveAction={Boolean(selectedActionId && selectedActionTargetId)}
      onResolveAction={handleResolveAction}
      onEndTurn={handleNextTurn}
    />
  ) : undefined

  return (
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
              allyOptions={allyOptions}
              selectedAllyOptions={selectedAllyOptions}
              selectedAllyIds={selectedAllyIds}
              loadingAllies={loadingParty}
              onAllySelectionChange={setSelectedAllyIds}
              onResolvedCombatant={handleResolvedCombatant}
              onRemoveAllyCombatant={removeAllyCombatant}
            />
          }
          opponentLane={
            <OpponentRosterLane
              opponentOptions={opponentOptions}
              selectedOpponentOptions={selectedOpponentOptions}
              opponentRoster={opponentRoster}
              loadingOpponents={loadingNpcs}
              monstersById={monstersById}
              environmentContext={environmentContext}
              monsterFormsById={monsterFormsById}
              monsterManualTriggersById={monsterManualTriggersById}
              opponentSourceCounts={opponentSourceCounts}
              onOpponentSelectionChange={handleOpponentSelectionChange}
              onResolvedCombatant={handleResolvedCombatant}
              onRemoveOpponentCombatant={removeOpponentCombatant}
              onAddOpponentCopy={addOpponentCopy}
            />
          }
        />
      )}

      {mode === 'active' && (
        <Stack spacing={3}>
          <EncounterControlsPanel
            selectedCombatantCount={selectedCombatantIds.length}
            resolvedCombatantCount={selectedCombatants.length}
            unresolvedCombatantCount={unresolvedCombatantCount}
            encounterState={encounterState}
            activeCombatant={activeCombatant}
            canStartEncounter={canStartEncounter}
            onStartEncounter={handleStartEncounter}
            onNextTurn={handleNextTurn}
            onResetEncounter={handleResetEncounter}
            environmentContext={environmentContext}
            onEnvironmentContextChange={setEnvironmentContext}
            controlTargetId={controlTargetId}
            onControlTargetIdChange={setControlTargetId}
            damageAmount={damageAmount}
            onDamageAmountChange={setDamageAmount}
            damageTypeInput={damageTypeInput}
            onDamageTypeInputChange={setDamageTypeInput}
            onApplyDamage={handleApplyDamage}
            healingAmount={healingAmount}
            onHealingAmountChange={setHealingAmount}
            onApplyHealing={handleApplyHealing}
            controlTargetHasReducedToZeroSave={controlTargetHasReducedToZeroSave}
            reducedToZeroSaveOutcome={reducedToZeroSaveOutcome}
            onReducedToZeroSaveOutcomeChange={setReducedToZeroSaveOutcome}
            onTriggerReducedToZeroHook={handleTriggerReducedToZeroHook}
            canTriggerReducedToZeroHook={canTriggerReducedToZeroHook}
            conditionInput={conditionInput}
            onConditionInputChange={setConditionInput}
            onAddCondition={handleAddCondition}
            onRemoveCondition={handleRemoveCondition}
            stateInput={stateInput}
            onStateInputChange={setStateInput}
            onAddState={handleAddState}
            onRemoveState={handleRemoveState}
            markerDurationTurns={markerDurationTurns}
            onMarkerDurationTurnsChange={setMarkerDurationTurns}
            markerDurationBoundary={markerDurationBoundary}
            onMarkerDurationBoundaryChange={setMarkerDurationBoundary}
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
              gap: 3,
            }}
          >
            <AllyRosterLane
              allyOptions={allyOptions}
              selectedAllyOptions={selectedAllyOptions}
              selectedAllyIds={selectedAllyIds}
              loadingAllies={loadingParty}
              onAllySelectionChange={setSelectedAllyIds}
              onResolvedCombatant={handleResolvedCombatant}
              onRemoveAllyCombatant={removeAllyCombatant}
            />

            <OpponentRosterLane
              opponentOptions={opponentOptions}
              selectedOpponentOptions={selectedOpponentOptions}
              opponentRoster={opponentRoster}
              loadingOpponents={loadingNpcs}
              monstersById={monstersById}
              environmentContext={environmentContext}
              monsterFormsById={monsterFormsById}
              monsterManualTriggersById={monsterManualTriggersById}
              opponentSourceCounts={opponentSourceCounts}
              onOpponentSelectionChange={handleOpponentSelectionChange}
              onResolvedCombatant={handleResolvedCombatant}
              onRemoveOpponentCombatant={removeOpponentCombatant}
              onAddOpponentCopy={addOpponentCopy}
            />
          </Box>

          <CombatLogPanel
            encounterState={encounterState}
            selectedAllyCount={selectedAllyIds.length}
            opponentCombatantCount={opponentRoster.length}
          />
        </Stack>
      )}
    </EncounterView>
  )
}
