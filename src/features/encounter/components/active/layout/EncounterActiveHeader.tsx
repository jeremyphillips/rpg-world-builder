import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { encounterActiveBarSx } from '@/ui/primitives'

type EncounterActiveHeaderProps = {
  roundNumber: number
  turnIndex: number
  turnCount: number
  activeCombatantLabel: string | null
  nextCombatantLabel: string | null
  onEditEncounter: () => void
  onResetEncounter: () => void
}

export function EncounterActiveHeader({
  roundNumber,
  turnIndex,
  turnCount,
  activeCombatantLabel,
  nextCombatantLabel,
  onEditEncounter,
  onResetEncounter,
}: EncounterActiveHeaderProps) {
  return (
    <Paper
      square
      elevation={1}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        ...encounterActiveBarSx,
      }}
    >
      <Stack spacing={0.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              Current combatant: {activeCombatantLabel ?? 'None'}
            </Typography>
            {nextCombatantLabel && (
              <Typography variant="body2" color="text.secondary">
                Next Up: {nextCombatantLabel}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button variant="outlined" size="small" onClick={onEditEncounter}>
              Edit Encounter
            </Button>
            <Button variant="outlined" size="small" color="inherit" onClick={onResetEncounter}>
              Reset Encounter
            </Button>
          </Stack>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Round {roundNumber} &bull; Turn {turnIndex + 1}/{turnCount}
        </Typography>
      </Stack>
    </Paper>
  )
}
