import { Navigate } from 'react-router-dom'

import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import {
  AllyCombatantActiveCard,
  AllyCombatantActivePreviewCard,
  CombatActionPreviewCard,
  CombatLane,
  CombatLogPanel,
  CombatTargetPreviewCard,
  EncounterActiveView,
  EncounterEnvironmentSummary,
  EncounterGrid,
  EncounterView,
  OpponentCombatantActiveCard,
  OpponentCombatantActivePreviewCard,
} from '../components'
import { campaignEncounterSetupPath } from './encounterPaths'
import { useEncounterRuntime } from './EncounterRuntimeContext'

export default function EncounterActiveRoute() {
  const {
    encounterState,
    campaignId,
    activeHeader,
    activeFooter,
    activeCombatantId,
    activeCombatant,
    availableActions,
    selectedActionId,
    setSelectedActionId,
    selectedCasterOptions,
    setSelectedCasterOptions,
    selectedActionTargetId,
    setSelectedActionTargetId,
    environmentSetup,
    gridViewModel,
    interactionMode,
    setInteractionMode,
    handleMoveCombatant,
  } = useEncounterRuntime()

  if (!encounterState) {
    if (campaignId) return <Navigate to={campaignEncounterSetupPath(campaignId)} replace />
    return null
  }

  return (
    <EncounterView mode="active" activeHeader={activeHeader} activeFooter={activeFooter}>
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
            <Typography variant="subtitle2" color="text.secondary">
              Action
            </Typography>
            <CombatActionPreviewCard
              action={availableActions.find((a) => a.id === selectedActionId) ?? null}
            />
          </>
        }
        targetPreview={
          <>
            <Typography variant="subtitle2" color="text.secondary">
              Target
            </Typography>
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
        grid={
          gridViewModel ? (
            <EncounterGrid
              grid={gridViewModel}
              onCellClick={(cellId) => {
                if (interactionMode === 'move') {
                  handleMoveCombatant(cellId)
                  const combatant = activeCombatant
                  const remaining = combatant?.turnResources?.movementRemaining ?? 0
                  const cellFeet = gridViewModel.cellFeet
                  if (remaining <= cellFeet) setInteractionMode('select-target')
                  return
                }
                const occupant = encounterState.placements?.find((p) => p.cellId === cellId)
                if (occupant) setSelectedActionTargetId(occupant.combatantId)
              }}
            />
          ) : undefined
        }
        allyLane={
          <CombatLane title="Allies" description="Party members in this encounter.">
            <Stack spacing={1.5}>
              {encounterState.partyCombatantIds.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No ally combatants.
                </Typography>
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
                <Typography variant="body2" color="text.secondary">
                  No opponent combatants.
                </Typography>
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
    </EncounterView>
  )
}
