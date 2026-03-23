import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

type EncounterSetupHeaderProps = {
  allyCount: number
  opponentCount: number
  environmentSummary?: string
  canStartEncounter: boolean
  onStartEncounter: () => void
}

export function EncounterSetupHeader({
  allyCount,
  opponentCount,
  environmentSummary,
  canStartEncounter,
  onStartEncounter,
}: EncounterSetupHeaderProps) {
  const subtitleParts = [
    `Allies: ${allyCount}`,
    `Opponents: ${opponentCount}`,
  ]
  if (environmentSummary) {
    subtitleParts.push(`Environment: ${environmentSummary}`)
  }

  return (
    <Paper
      square
      elevation={1}
      sx={{ px: 4, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <div>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Encounter Setup
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitleParts.join('\u2003')}
          </Typography>
        </div>

        <Button variant="contained" onClick={onStartEncounter} disabled={!canStartEncounter}>
          Start Encounter
        </Button>
      </Stack>
    </Paper>
  )
}
