import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

import type { Monster } from '@/features/content/monsters/domain/types'
import { DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT, type CombatantInstance, type ManualEnvironmentContext, type ManualMonsterTriggerContext, type MonsterFormContext } from '@/features/mechanics/domain/encounter'
import type { EnemyOption, EnemyRosterEntry, PartyOption } from '../types'
import { CharacterCombatantCard, CombatLane, MonsterCombatantCard } from './CombatSimulationCards'

type PartyLaneProps = {
  partyOptions: PartyOption[]
  selectedPartyOptions: PartyOption[]
  selectedPartyIds: string[]
  loadingParty: boolean
  encounterState: { combatantsById: Record<string, CombatantInstance> } | null
  activeCombatantId: string | null
  availableActions: { id: string; label: string; resolutionMode: string; kind: string }[]
  availableActionTargets: { id: string; label: string }[]
  selectedActionId: string
  onSelectedActionIdChange: (value: string) => void
  selectedActionTargetId: string
  onSelectedActionTargetIdChange: (value: string) => void
  onResolveAction: () => void
  onPassTurn: () => void
  onPartySelectionChange: (ids: string[]) => void
  onResolvedCombatant: (runtimeId: string, combatant: CombatantInstance | null) => void
  onRemovePartyCombatant: (characterId: string) => void
}

export function PartyRosterLane({
  partyOptions,
  selectedPartyOptions,
  selectedPartyIds,
  loadingParty,
  encounterState,
  activeCombatantId,
  availableActions,
  availableActionTargets,
  selectedActionId,
  onSelectedActionIdChange,
  selectedActionTargetId,
  onSelectedActionTargetIdChange,
  onResolveAction,
  onPassTurn,
  onPartySelectionChange,
  onResolvedCombatant,
  onRemovePartyCombatant,
}: PartyLaneProps) {
  return (
    <CombatLane
      title="Party"
      description="Choose approved party members to append PC combatant cards with initiative, AC, HP, attacks, and surfaced active effects."
    >
      <Autocomplete<PartyOption, true, false, false>
        multiple
        options={partyOptions}
        value={selectedPartyOptions}
        loading={loadingParty}
        onChange={(_, nextValue) => onPartySelectionChange(nextValue.map((option) => option.id))}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionLabel={(option) => option.label}
        noOptionsText="No approved party members found."
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
          <TextField {...params} label="Approved Party Members" placeholder="Search party members" />
        )}
      />

      <Stack spacing={2}>
        {selectedPartyIds.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No party combatants selected yet.
          </Typography>
        ) : (
          selectedPartyIds.map((characterId) => (
            <CharacterCombatantCard
              key={characterId}
              runtimeId={characterId}
              characterId={characterId}
              side="party"
              sourceKind="pc"
              runtimeCombatant={encounterState?.combatantsById[characterId]}
              onResolved={(combatant) => onResolvedCombatant(characterId, combatant)}
              onRemove={() => onRemovePartyCombatant(characterId)}
              onPassTurn={onPassTurn}
              isActive={activeCombatantId === characterId}
              activeActionControls={
                activeCombatantId === characterId
                  ? {
                      availableActions,
                      availableTargets: availableActionTargets,
                      selectedActionId,
                      onSelectedActionIdChange,
                      selectedTargetId: selectedActionTargetId,
                      onSelectedTargetIdChange: onSelectedActionTargetIdChange,
                      onResolveAction,
                    }
                  : undefined
              }
            />
          ))
        )}
      </Stack>
    </CombatLane>
  )
}

type EnemyLaneProps = {
  enemyOptions: EnemyOption[]
  selectedEnemyOptions: EnemyOption[]
  enemyRoster: EnemyRosterEntry[]
  loadingEnemies: boolean
  monstersById: Record<string, Monster>
  encounterState: { combatantsById: Record<string, CombatantInstance> } | null
  activeCombatantId: string | null
  availableActions: { id: string; label: string; resolutionMode: string; kind: string }[]
  availableActionTargets: { id: string; label: string }[]
  selectedActionId: string
  onSelectedActionIdChange: (value: string) => void
  selectedActionTargetId: string
  onSelectedActionTargetIdChange: (value: string) => void
  onResolveAction: () => void
  onPassTurn: () => void
  environmentContext: ManualEnvironmentContext
  monsterFormsById: Record<string, MonsterFormContext>
  monsterManualTriggersById: Record<string, ManualMonsterTriggerContext>
  enemySourceCounts: Record<string, number>
  onEnemySelectionChange: (nextValue: EnemyOption[]) => void
  onResolvedCombatant: (runtimeId: string, combatant: CombatantInstance | null) => void
  onRemoveEnemyCombatant: (runtimeId: string) => void
  onAddEnemyCopy: (entry: EnemyRosterEntry) => void
  onMonsterFormChange: (runtimeId: string, form: MonsterFormContext) => void
  onMonsterManualTriggerChange: (runtimeId: string, trigger: keyof ManualMonsterTriggerContext, active: boolean) => void
}

export function EnemyRosterLane({
  enemyOptions,
  selectedEnemyOptions,
  enemyRoster,
  loadingEnemies,
  monstersById,
  encounterState,
  activeCombatantId,
  availableActions,
  availableActionTargets,
  selectedActionId,
  onSelectedActionIdChange,
  selectedActionTargetId,
  onSelectedActionTargetIdChange,
  onResolveAction,
  onPassTurn,
  environmentContext,
  monsterFormsById,
  monsterManualTriggersById,
  enemySourceCounts,
  onEnemySelectionChange,
  onResolvedCombatant,
  onRemoveEnemyCombatant,
  onAddEnemyCopy,
  onMonsterFormChange,
  onMonsterManualTriggerChange,
}: EnemyLaneProps) {
  return (
    <CombatLane
      title="Enemies"
      description="Choose NPC or monster sources. Removing a source from the multiselect clears every copy, while selected monster cards can add duplicate runtime instances."
    >
      <Autocomplete<EnemyOption, true, false, false>
        multiple
        options={enemyOptions}
        value={selectedEnemyOptions}
        loading={loadingEnemies}
        onChange={(_, nextValue) => onEnemySelectionChange(nextValue)}
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
                  <Chip label={option.kind === 'npc' ? 'NPC' : 'Monster'} size="small" />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {option.subtitle}
                </Typography>
              </Stack>
            </Box>
          )
        }}
        renderInput={(params) => (
          <TextField {...params} label="Enemy Sources" placeholder="Search NPCs and monsters" />
        )}
      />

      <Stack spacing={2}>
        {enemyRoster.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No enemy combatants selected yet.
          </Typography>
        ) : (
          enemyRoster.map((entry) => {
            if (entry.kind === 'npc') {
              return (
                <CharacterCombatantCard
                  key={entry.runtimeId}
                  runtimeId={entry.runtimeId}
                  characterId={entry.sourceId}
                  side="enemies"
                  sourceKind="npc"
                  runtimeCombatant={encounterState?.combatantsById[entry.runtimeId]}
                  onResolved={(combatant) => onResolvedCombatant(entry.runtimeId, combatant)}
                  onRemove={() => onRemoveEnemyCombatant(entry.runtimeId)}
                  onPassTurn={onPassTurn}
                  isActive={activeCombatantId === entry.runtimeId}
                  activeActionControls={
                    activeCombatantId === entry.runtimeId
                      ? {
                          availableActions,
                          availableTargets: availableActionTargets,
                          selectedActionId,
                          onSelectedActionIdChange,
                          selectedTargetId: selectedActionTargetId,
                          onSelectedTargetIdChange: onSelectedActionTargetIdChange,
                          onResolveAction,
                        }
                      : undefined
                  }
                />
              )
            }

            const monster = monstersById[entry.sourceId]
            if (!monster) {
              return (
                <Paper key={entry.runtimeId} sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="error">
                      Monster `{entry.sourceId}` could not be resolved.
                    </Typography>
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => onRemoveEnemyCombatant(entry.runtimeId)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </Button>
                  </Stack>
                </Paper>
              )
            }

            return (
              <MonsterCombatantCard
                key={entry.runtimeId}
                monster={monster}
                runtimeId={entry.runtimeId}
                runtimeCombatant={encounterState?.combatantsById[entry.runtimeId]}
                environmentContext={environmentContext}
                currentForm={monsterFormsById[entry.runtimeId] ?? 'true-form'}
                manualTriggerContext={
                  monsterManualTriggersById[entry.runtimeId] ?? DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT
                }
                onFormChange={(form) => onMonsterFormChange(entry.runtimeId, form)}
                onManualTriggerChange={(trigger, active) =>
                  onMonsterManualTriggerChange(entry.runtimeId, trigger, active)
                }
                onResolved={(combatant) => onResolvedCombatant(entry.runtimeId, combatant)}
                onAddCopy={() => onAddEnemyCopy(entry)}
                onRemove={() => onRemoveEnemyCombatant(entry.runtimeId)}
                onPassTurn={onPassTurn}
                isActive={activeCombatantId === entry.runtimeId}
                activeActionControls={
                  activeCombatantId === entry.runtimeId
                    ? {
                        availableActions,
                        availableTargets: availableActionTargets,
                        selectedActionId,
                        onSelectedActionIdChange,
                        selectedTargetId: selectedActionTargetId,
                        onSelectedTargetIdChange: onSelectedActionTargetIdChange,
                        onResolveAction,
                      }
                    : undefined
                }
              />
            )
          })
        )}
      </Stack>

      {selectedEnemyOptions.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {selectedEnemyOptions.map((option) => (
            <Chip
              key={option.key}
              label={`${option.label} × ${enemySourceCounts[option.key] ?? 0}`}
              size="small"
              variant="outlined"
            />
          ))}
        </Stack>
      )}
    </CombatLane>
  )
}
