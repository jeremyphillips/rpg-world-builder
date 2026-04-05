import type { ComponentProps } from 'react'

import type { Location } from '@/features/content/locations/domain/model/location'
import type { SelectEntityOption } from '@/ui/patterns'

import { AllyRosterLane } from '../roster/AllyRosterLane'
import { EncounterSetupView } from '../layout/EncounterSetupView'
import { OpponentRosterLane } from '../roster/OpponentRosterLane'
import type { EnvironmentSetupValues } from './SimulatorEncounterEnvironmentSetup'
import { SimulatorEncounterEnvironmentSetup } from './SimulatorEncounterEnvironmentSetup'
import { SimulatorEncounterBuildingLocation } from './SimulatorEncounterBuildingLocation'

type AllyLaneProps = ComponentProps<typeof AllyRosterLane>
type OpponentLaneProps = ComponentProps<typeof OpponentRosterLane>

/**
 * Composes **Encounter Simulator** setup: environment + building (tactical map host), ally/opponent lanes.
 * Shared layout/roster primitives stay imported from `setup/layout` and `setup/roster`; this file is the
 * simulator-owned composition root (not a generic “all hosts” setup tree).
 */
export type SimulatorEncounterSetupSurfaceProps = {
  environmentSetup: EnvironmentSetupValues
  onEnvironmentSetupChange: (values: EnvironmentSetupValues) => void
  locations: Location[]
  buildingLocationIds: string[]
  onBuildingLocationIdsChange: (ids: string[]) => void
  buildingSelectOptions: SelectEntityOption[]
  campaignId: string | undefined
  onOpenAllyModal: () => void
  onOpenOpponentModal: () => void
} & Pick<
  AllyLaneProps,
  'selectedAllyIds' | 'monstersById' | 'characterPortraitById' | 'onResolvedCombatant' | 'onRemoveAllyCombatant'
> &
  Pick<
    OpponentLaneProps,
    | 'opponentRoster'
    | 'monstersById'
    | 'characterPortraitById'
    | 'environmentContext'
    | 'monsterFormsById'
    | 'monsterManualTriggersById'
    | 'opponentSourceCounts'
    | 'selectedOpponentOptions'
    | 'onResolvedCombatant'
    | 'onRemoveOpponentCombatant'
    | 'onAddOpponentCopy'
  >

export function SimulatorEncounterSetupSurface({
  environmentSetup,
  onEnvironmentSetupChange,
  locations,
  buildingLocationIds,
  onBuildingLocationIdsChange,
  buildingSelectOptions,
  campaignId,
  onOpenAllyModal,
  onOpenOpponentModal,
  selectedAllyIds,
  monstersById,
  characterPortraitById,
  onResolvedCombatant,
  onRemoveAllyCombatant,
  opponentRoster,
  environmentContext,
  monsterFormsById,
  monsterManualTriggersById,
  opponentSourceCounts,
  selectedOpponentOptions,
  onRemoveOpponentCombatant,
  onAddOpponentCopy,
}: SimulatorEncounterSetupSurfaceProps) {
  return (
    <EncounterSetupView
      environmentSetup={
        <SimulatorEncounterEnvironmentSetup
          values={environmentSetup}
          onChange={onEnvironmentSetupChange}
          buildingLocationSlot={
            <SimulatorEncounterBuildingLocation
              selectedBuildingIds={buildingLocationIds}
              onChange={onBuildingLocationIdsChange}
              locations={locations}
              buildingSelectOptions={buildingSelectOptions}
              campaignId={campaignId}
            />
          }
        />
      }
      allyLane={
        <AllyRosterLane
          selectedAllyIds={selectedAllyIds}
          monstersById={monstersById}
          characterPortraitById={characterPortraitById}
          onOpenModal={onOpenAllyModal}
          onResolvedCombatant={onResolvedCombatant}
          onRemoveAllyCombatant={onRemoveAllyCombatant}
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
          onOpenModal={onOpenOpponentModal}
          onResolvedCombatant={onResolvedCombatant}
          onRemoveOpponentCombatant={onRemoveOpponentCombatant}
          onAddOpponentCopy={onAddOpponentCopy}
        />
      }
    />
  )
}
