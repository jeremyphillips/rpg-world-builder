/**
 * Encounter configuration (participants, environment, grid). DM/simulator-only surface — not player lobby.
 */
import { Navigate } from 'react-router-dom'

import {
  AllyRosterLane,
  EncounterEnvironmentSetup,
  EncounterGridSetup,
  EncounterSetupView,
  EncounterView,
  OpponentRosterLane,
} from '../components'
import { campaignEncounterActivePath } from './encounterPaths'
import { useEncounterRuntime } from './EncounterRuntimeContext'

export default function EncounterSetupRoute() {
  const {
    encounterState,
    campaignId,
    setupHeader,
    environmentSetup,
    setEnvironmentSetup,
    gridSizePreset,
    setGridSizePreset,
    selectedAllyIds,
    setAllyModalOpen,
    handleResolvedCombatant,
    removeAllyCombatant,
    opponentRoster,
    monstersById,
    characterPortraitById,
    environmentContext,
    monsterFormsById,
    monsterManualTriggersById,
    opponentSourceCounts,
    selectedOpponentOptions,
    setOpponentModalOpen,
    removeOpponentCombatant,
    addOpponentCopy,
  } = useEncounterRuntime()

  if (encounterState && campaignId) {
    return <Navigate to={campaignEncounterActivePath(campaignId)} replace />
  }

  return (
    <EncounterView mode="setup" setupHeader={setupHeader}>
      <EncounterSetupView
        environmentSetup={
          <EncounterEnvironmentSetup values={environmentSetup} onChange={setEnvironmentSetup} />
        }
        gridSetup={<EncounterGridSetup value={gridSizePreset} onChange={setGridSizePreset} />}
        allyLane={
          <AllyRosterLane
            selectedAllyIds={selectedAllyIds}
            monstersById={monstersById}
            characterPortraitById={characterPortraitById}
            onOpenModal={() => setAllyModalOpen(true)}
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
            onOpenModal={() => setOpponentModalOpen(true)}
            onResolvedCombatant={handleResolvedCombatant}
            onRemoveOpponentCombatant={removeOpponentCombatant}
            onAddOpponentCopy={addOpponentCopy}
          />
        }
      />
    </EncounterView>
  )
}
