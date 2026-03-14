import { useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { CombatantInstance, EncounterState, ManualEnvironmentContext } from '@/features/mechanics/domain/encounter'
import { formatSigned } from '../helpers'

type EncounterControlsPanelProps = {
  selectedCombatantCount: number
  resolvedCombatantCount: number
  unresolvedCombatantCount: number
  encounterState: EncounterState | null
  activeCombatant: CombatantInstance | null
  canStartEncounter: boolean
  onStartEncounter: () => void
  onNextTurn: () => void
  onResetEncounter: () => void
  environmentContext: ManualEnvironmentContext
  onEnvironmentContextChange: (value: ManualEnvironmentContext) => void
  controlTargetId: string
  onControlTargetIdChange: (value: string) => void
  damageAmount: string
  onDamageAmountChange: (value: string) => void
  damageTypeInput: string
  onDamageTypeInputChange: (value: string) => void
  onApplyDamage: () => void
  healingAmount: string
  onHealingAmountChange: (value: string) => void
  onApplyHealing: () => void
  controlTargetHasReducedToZeroSave: boolean
  reducedToZeroSaveOutcome: 'success' | 'fail'
  onReducedToZeroSaveOutcomeChange: (value: 'success' | 'fail') => void
  onTriggerReducedToZeroHook: () => void
  canTriggerReducedToZeroHook: boolean
  conditionInput: string
  onConditionInputChange: (value: string) => void
  onAddCondition: () => void
  onRemoveCondition: () => void
  stateInput: string
  onStateInputChange: (value: string) => void
  onAddState: () => void
  onRemoveState: () => void
  markerDurationTurns: string
  onMarkerDurationTurnsChange: (value: string) => void
  markerDurationBoundary: 'start' | 'end'
  onMarkerDurationBoundaryChange: (value: 'start' | 'end') => void
}

export function EncounterControlsPanel({
  selectedCombatantCount,
  resolvedCombatantCount,
  unresolvedCombatantCount,
  encounterState,
  activeCombatant,
  canStartEncounter,
  onStartEncounter,
  onNextTurn,
  onResetEncounter,
  environmentContext,
  onEnvironmentContextChange,
  controlTargetId,
  onControlTargetIdChange,
  damageAmount,
  onDamageAmountChange,
  damageTypeInput,
  onDamageTypeInputChange,
  onApplyDamage,
  healingAmount,
  onHealingAmountChange,
  onApplyHealing,
  controlTargetHasReducedToZeroSave,
  reducedToZeroSaveOutcome,
  onReducedToZeroSaveOutcomeChange,
  onTriggerReducedToZeroHook,
  canTriggerReducedToZeroHook,
  conditionInput,
  onConditionInputChange,
  onAddCondition,
  onRemoveCondition,
  stateInput,
  onStateInputChange,
  onAddState,
  onRemoveState,
  markerDurationTurns,
  onMarkerDurationTurnsChange,
  markerDurationBoundary,
  onMarkerDurationBoundaryChange,
}: EncounterControlsPanelProps) {
  const hasEncounter = Boolean(encounterState)
  const controlOptions = encounterState?.initiative ?? []
  const [manualToolsOpen, setManualToolsOpen] = useState(false)

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
          <Box>
            <Typography variant="h5">Encounter Controls</Typography>
            <Typography variant="body2" color="text.secondary">
              Start from the current lineup, step turn order, or reset to adjust the roster.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="contained" onClick={onStartEncounter} disabled={!canStartEncounter}>
              Start Encounter
            </Button>
            <Button variant="outlined" onClick={onNextTurn} disabled={!hasEncounter}>
              Next Turn
            </Button>
            <Button variant="text" color="inherit" onClick={onResetEncounter} disabled={!hasEncounter}>
              Reset
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`Selected: ${selectedCombatantCount}`} size="small" variant="outlined" />
          <Chip label={`Resolved: ${resolvedCombatantCount}`} size="small" variant="outlined" />
          <Chip
            label={
              encounterState
                ? `Round ${encounterState.roundNumber} • Turn ${encounterState.turnIndex + 1}`
                : 'Encounter not started'
            }
            size="small"
            color={encounterState ? 'success' : 'default'}
          />
        </Stack>

        {unresolvedCombatantCount > 0 && (
          <Typography variant="body2" color="text.secondary">
            Waiting on {unresolvedCombatantCount} combatant{unresolvedCombatantCount === 1 ? '' : 's'} to finish loading before the encounter can start.
          </Typography>
        )}

        {encounterState?.activeCombatantId && (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Active combatant: {activeCombatant?.source.label ?? encounterState.activeCombatantId}
            </Typography>
            {activeCombatant && (
              <>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {activeCombatant.turnHooks.length > 0 ? (
                    activeCombatant.turnHooks.map((hook) => (
                      <Chip
                        key={hook.id}
                        label={`${hook.boundary === 'start' ? 'Start' : 'End'} hook: ${hook.label}`}
                        size="small"
                        variant="outlined"
                      />
                    ))
                  ) : (
                    <Chip label="No turn hooks" size="small" variant="outlined" />
                  )}
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={`Action: ${activeCombatant.turnResources?.actionAvailable ? 'ready' : 'spent'}`}
                    size="small"
                    color={activeCombatant.turnResources?.actionAvailable ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip
                    label={`Bonus: ${activeCombatant.turnResources?.bonusActionAvailable ? 'ready' : 'spent'}`}
                    size="small"
                    color={activeCombatant.turnResources?.bonusActionAvailable ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip
                    label={`Reaction: ${activeCombatant.turnResources?.reactionAvailable ? 'ready' : 'spent'}`}
                    size="small"
                    color={activeCombatant.turnResources?.reactionAvailable ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip
                    label={`Move: ${activeCombatant.turnResources?.movementRemaining ?? 0} ft`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </>
            )}
          </Stack>
        )}

        <Divider />

        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="subtitle2">Manual Trigger Context And Test Actions</Typography>
              <Typography variant="body2" color="text.secondary">
                Manual sandbox controls for environment, damage, healing, and runtime markers.
              </Typography>
            </Box>
            <Button variant="text" color="inherit" onClick={() => setManualToolsOpen((open) => !open)}>
              {manualToolsOpen ? 'Hide' : 'Show'}
            </Button>
          </Stack>

          <Collapse in={manualToolsOpen}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="subtitle2">Manual Trigger Context</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  select
                  label="Environment"
                  value={environmentContext}
                  onChange={(event) => onEnvironmentContextChange(event.target.value as ManualEnvironmentContext)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="none">Normal</MenuItem>
                  <MenuItem value="sunlight">Sunlight</MenuItem>
                </TextField>
              </Stack>

              <Divider />

              <Typography variant="subtitle2">Test Actions</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Target Combatant"
                  value={controlTargetId}
                  onChange={(event) => onControlTargetIdChange(event.target.value)}
                  disabled={!hasEncounter}
                >
                  {controlOptions.map((option) => (
                    <MenuItem key={option.combatantId} value={option.combatantId}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flex={1}>
                  <TextField
                    label="Damage"
                    type="number"
                    value={damageAmount}
                    onChange={(event) => onDamageAmountChange(event.target.value)}
                    disabled={!hasEncounter}
                    sx={{ minWidth: 110 }}
                  />
                  <TextField
                    label="Damage Type"
                    value={damageTypeInput}
                    onChange={(event) => onDamageTypeInputChange(event.target.value)}
                    disabled={!hasEncounter}
                    sx={{ minWidth: 130 }}
                  />
                  <Button variant="outlined" onClick={onApplyDamage} disabled={!hasEncounter || !controlTargetId}>
                    Apply Damage
                  </Button>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flex={1}>
                  <TextField
                    label="Healing"
                    type="number"
                    value={healingAmount}
                    onChange={(event) => onHealingAmountChange(event.target.value)}
                    disabled={!hasEncounter}
                    sx={{ minWidth: 110 }}
                  />
                  <Button variant="outlined" onClick={onApplyHealing} disabled={!hasEncounter || !controlTargetId}>
                    Apply Healing
                  </Button>
                  {controlTargetHasReducedToZeroSave && (
                    <TextField
                      select
                      label="0 HP Save"
                      value={reducedToZeroSaveOutcome}
                      onChange={(event) => onReducedToZeroSaveOutcomeChange(event.target.value as 'success' | 'fail')}
                      disabled={!hasEncounter || !controlTargetId}
                      sx={{ minWidth: 140 }}
                    >
                      <MenuItem value="success">Success</MenuItem>
                      <MenuItem value="fail">Fail</MenuItem>
                    </TextField>
                  )}
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={onTriggerReducedToZeroHook}
                    disabled={!canTriggerReducedToZeroHook}
                  >
                    Trigger 0 HP Hook
                  </Button>
                </Stack>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flex={1}>
                  <TextField
                    fullWidth
                    label="Condition"
                    value={conditionInput}
                    onChange={(event) => onConditionInputChange(event.target.value)}
                    disabled={!hasEncounter}
                  />
                  <Button variant="outlined" onClick={onAddCondition} disabled={!hasEncounter || !controlTargetId}>
                    Add
                  </Button>
                  <Button variant="text" color="inherit" onClick={onRemoveCondition} disabled={!hasEncounter || !controlTargetId}>
                    Remove
                  </Button>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flex={1}>
                  <TextField
                    fullWidth
                    label="State Marker"
                    value={stateInput}
                    onChange={(event) => onStateInputChange(event.target.value)}
                    disabled={!hasEncounter}
                  />
                  <Button variant="outlined" onClick={onAddState} disabled={!hasEncounter || !controlTargetId}>
                    Add
                  </Button>
                  <Button variant="text" color="inherit" onClick={onRemoveState} disabled={!hasEncounter || !controlTargetId}>
                    Remove
                  </Button>
                </Stack>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Marker Duration Turns"
                  type="number"
                  value={markerDurationTurns}
                  onChange={(event) => onMarkerDurationTurnsChange(event.target.value)}
                  disabled={!hasEncounter}
                  helperText="Leave blank for persistent markers."
                  sx={{ minWidth: 200 }}
                />
                <TextField
                  select
                  label="Tick On"
                  value={markerDurationBoundary}
                  onChange={(event) => onMarkerDurationBoundaryChange(event.target.value as 'start' | 'end')}
                  disabled={!hasEncounter}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="start">Turn Start</MenuItem>
                  <MenuItem value="end">Turn End</MenuItem>
                </TextField>
              </Stack>
            </Stack>
          </Collapse>
        </Stack>
      </Stack>
    </Paper>
  )
}

type CombatLogPanelProps = {
  encounterState: EncounterState | null
  selectedPartyCount: number
  enemyCombatantCount: number
}

export function CombatLogPanel({ encounterState, selectedPartyCount, enemyCombatantCount }: CombatLogPanelProps) {
  return (
    <Paper sx={{ p: 3, minHeight: 220 }}>
      <Stack spacing={2}>
        <Typography variant="h5">Combat Log</Typography>
        <Typography variant="body2" color="text.secondary">
          Current setup: {selectedPartyCount} party combatant{selectedPartyCount === 1 ? '' : 's'} and {enemyCombatantCount} enemy combatant{enemyCombatantCount === 1 ? '' : 's'}.
        </Typography>

        {encounterState ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr)' },
              gap: 3,
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Initiative
              </Typography>
              <Stack spacing={1}>
                {encounterState.initiative.map((entry, index) => (
                  <Paper
                    key={entry.combatantId}
                    variant="outlined"
                    sx={{
                      p: 1.25,
                      borderColor:
                        entry.combatantId === encounterState.activeCombatantId ? 'primary.main' : 'divider',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography variant="body2" fontWeight={600}>
                        {index + 1}. {entry.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {entry.total}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      d20 {entry.roll} {formatSigned(entry.modifier)}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Events
              </Typography>
              <Stack spacing={1}>
                {encounterState.log.map((entry) => (
                  <Paper key={entry.id} variant="outlined" sx={{ p: 1.25 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1} flexWrap="wrap" useFlexGap>
                      <Typography variant="body2" fontWeight={600}>
                        {entry.summary}
                      </Typography>
                      <Chip label={`R${entry.round} T${entry.turn}`} size="small" variant="outlined" />
                    </Stack>
                    {entry.details && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {entry.details}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Start the encounter to see initiative order and turn-by-turn log events.
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}
