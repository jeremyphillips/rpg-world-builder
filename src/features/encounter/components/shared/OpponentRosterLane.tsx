import { AppBadge } from '@/ui/primitives'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

import type { Monster } from '@/features/content/monsters/domain/types'
import {
  DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT,
  type CombatantInstance,
  type ManualEnvironmentContext,
  type ManualMonsterTriggerContext,
  type MonsterFormContext,
} from '@/features/mechanics/domain/encounter'
import type { OpponentOption, OpponentRosterEntry } from '../../types'
import { CombatLane } from './CombatLane'
import { AllyCombatantSetupPreviewCard } from '../setup/AllyCombatantSetupPreviewCard'
import { OpponentCombatantSetupPreviewCard } from '../setup/OpponentCombatantSetupPreviewCard'

type OpponentRosterLaneProps = {
  opponentRoster: OpponentRosterEntry[]
  monstersById: Record<string, Monster>
  environmentContext: ManualEnvironmentContext
  monsterFormsById: Record<string, MonsterFormContext>
  monsterManualTriggersById: Record<string, ManualMonsterTriggerContext>
  opponentSourceCounts: Record<string, number>
  selectedOpponentOptions: OpponentOption[]
  onOpenModal: () => void
  onResolvedCombatant: (runtimeId: string, combatant: CombatantInstance | null) => void
  onRemoveOpponentCombatant: (runtimeId: string) => void
  onAddOpponentCopy: (entry: OpponentRosterEntry) => void
}

export function OpponentRosterLane({
  opponentRoster,
  monstersById,
  environmentContext,
  monsterFormsById,
  monsterManualTriggersById,
  opponentSourceCounts,
  selectedOpponentOptions,
  onOpenModal,
  onResolvedCombatant,
  onRemoveOpponentCombatant,
  onAddOpponentCopy,
}: OpponentRosterLaneProps) {
  return (
    <CombatLane
      title="Opponents"
      description="Choose NPC or monster sources. Use the button below to add opponents."
    >
      <Button
        variant="outlined"
        fullWidth
        startIcon={<AddIcon />}
        onClick={onOpenModal}
      >
        Add Opponents
      </Button>

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
