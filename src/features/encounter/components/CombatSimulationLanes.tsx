import { AppBadge } from '@/ui/primitives'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

import type { Monster } from '@/features/content/monsters/domain/types'
import {
  DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT,
  type CombatantInstance,
  type ManualEnvironmentContext,
  type ManualMonsterTriggerContext,
  type MonsterFormContext,
} from '@/features/mechanics/domain/encounter'
import type { OpponentOption, OpponentRosterEntry, AllyOption } from '../types'
import { CombatLane } from './CombatSimulationCards'
import { AllyCombatantSetupPreviewCard } from './AllyCombatantSetupPreviewCard'
import { OpponentCombatantSetupPreviewCard } from './OpponentCombatantSetupPreviewCard'

type AllyLaneProps = {
  allyOptions: AllyOption[]
  selectedAllyOptions: AllyOption[]
  selectedAllyIds: string[]
  loadingAllies: boolean
  onAllySelectionChange: (ids: string[]) => void
  onResolvedCombatant: (runtimeId: string, combatant: CombatantInstance | null) => void
  onRemoveAllyCombatant: (characterId: string) => void
}

export function AllyRosterLane({
  allyOptions,
  selectedAllyOptions,
  selectedAllyIds,
  loadingAllies,
  onAllySelectionChange,
  onResolvedCombatant,
  onRemoveAllyCombatant,
}: AllyLaneProps) {
  return (
    <CombatLane
      title="Allies"
      description="Choose approved allies to include as combatants with initiative, AC, HP, attacks, and surfaced active effects."
    >
      <Autocomplete<AllyOption, true, false, false>
        multiple
        options={allyOptions}
        value={selectedAllyOptions}
        loading={loadingAllies}
        onChange={(_, nextValue) => onAllySelectionChange(nextValue.map((option) => option.id))}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionLabel={(option) => option.label}
        noOptionsText="No approved allies found."
        renderOption={(props, option) => {
          const { key, ...rest } = props
          return (
            <Box component="li" key={key} {...rest}>
              <Stack spacing={0.25}>
                <Typography variant="body2">{option.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.subtitle}
                </Typography>
              </Stack>
            </Box>
          )
        }}
        renderInput={(params) => (
          <TextField {...params} label="Approved Allies" placeholder="Search allies" />
        )}
      />

      <Stack spacing={1.5}>
        {selectedAllyIds.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No ally combatants selected yet.
          </Typography>
        ) : (
          selectedAllyIds.map((characterId) => (
            <AllyCombatantSetupPreviewCard
              key={characterId}
              characterId={characterId}
              runtimeId={characterId}
              side="party"
              sourceKind="pc"
              onResolved={(combatant) => onResolvedCombatant(characterId, combatant)}
              onRemove={() => onRemoveAllyCombatant(characterId)}
            />
          ))
        )}
      </Stack>
    </CombatLane>
  )
}

type OpponentLaneProps = {
  opponentOptions: OpponentOption[]
  selectedOpponentOptions: OpponentOption[]
  opponentRoster: OpponentRosterEntry[]
  loadingOpponents: boolean
  monstersById: Record<string, Monster>
  environmentContext: ManualEnvironmentContext
  monsterFormsById: Record<string, MonsterFormContext>
  monsterManualTriggersById: Record<string, ManualMonsterTriggerContext>
  opponentSourceCounts: Record<string, number>
  onOpponentSelectionChange: (nextValue: OpponentOption[]) => void
  onResolvedCombatant: (runtimeId: string, combatant: CombatantInstance | null) => void
  onRemoveOpponentCombatant: (runtimeId: string) => void
  onAddOpponentCopy: (entry: OpponentRosterEntry) => void
}

export function OpponentRosterLane({
  opponentOptions,
  selectedOpponentOptions,
  opponentRoster,
  loadingOpponents,
  monstersById,
  environmentContext,
  monsterFormsById,
  monsterManualTriggersById,
  opponentSourceCounts,
  onOpponentSelectionChange,
  onResolvedCombatant,
  onRemoveOpponentCombatant,
  onAddOpponentCopy,
}: OpponentLaneProps) {
  return (
    <CombatLane
      title="Opponents"
      description="Choose NPC or monster sources. Removing a source from the multiselect clears every copy."
    >
      <Autocomplete<OpponentOption, true, false, false>
        multiple
        options={opponentOptions}
        value={selectedOpponentOptions}
        loading={loadingOpponents}
        onChange={(_, nextValue) => onOpponentSelectionChange(nextValue)}
        isOptionEqualToValue={(option, value) => option.key === value.key}
        getOptionLabel={(option) => option.label}
        noOptionsText="No NPC or monster options found."
        renderOption={(props, option) => {
          const { key, ...rest } = props
          return (
            <Box component="li" key={key} {...rest}>
              <Stack spacing={0.25}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">{option.label}</Typography>
                  <AppBadge label={option.kind === 'npc' ? 'NPC' : 'Monster'} tone="default" size="small" />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {option.subtitle}
                </Typography>
              </Stack>
            </Box>
          )
        }}
        renderInput={(params) => (
          <TextField {...params} label="Opponent Sources" placeholder="Search NPCs and monsters" />
        )}
      />

      <Stack spacing={1.5}>
        {opponentRoster.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No opponent combatants selected yet.
          </Typography>
        ) : (
          opponentRoster.map((entry) => {
            if (entry.kind === 'npc') {
              return (
                <AllyCombatantSetupPreviewCard
                  key={entry.runtimeId}
                  characterId={entry.sourceId}
                  runtimeId={entry.runtimeId}
                  side="enemies"
                  sourceKind="npc"
                  onResolved={(combatant) => onResolvedCombatant(entry.runtimeId, combatant)}
                  onRemove={() => onRemoveOpponentCombatant(entry.runtimeId)}
                />
              )
            }

            const monster = monstersById[entry.sourceId]
            if (!monster) {
              return (
                <Paper key={entry.runtimeId} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="error">
                      Monster `{entry.sourceId}` could not be resolved.
                    </Typography>
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => onRemoveOpponentCombatant(entry.runtimeId)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </Button>
                  </Stack>
                </Paper>
              )
            }

            return (
              <OpponentCombatantSetupPreviewCard
                key={entry.runtimeId}
                monster={monster}
                runtimeId={entry.runtimeId}
                environmentContext={environmentContext}
                currentForm={monsterFormsById[entry.runtimeId] ?? 'true-form'}
                manualTriggerContext={
                  monsterManualTriggersById[entry.runtimeId] ?? DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT
                }
                onResolved={(combatant) => onResolvedCombatant(entry.runtimeId, combatant)}
                onRemove={() => onRemoveOpponentCombatant(entry.runtimeId)}
                onDuplicate={() => onAddOpponentCopy(entry)}
              />
            )
          })
        )}
      </Stack>

      {selectedOpponentOptions.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {selectedOpponentOptions.map((option) => (
            <AppBadge
              key={option.key}
              label={`${option.label} \u00d7 ${opponentSourceCounts[option.key] ?? 0}`}
              tone="default"
              variant="outlined"
              size="small"
            />
          ))}
        </Stack>
      )}
    </CombatLane>
  )
}
