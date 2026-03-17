import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

type EncounterActiveViewProps = {
  focusedCard: React.ReactNode
  actionPreview: React.ReactNode
  targetPreview: React.ReactNode
  environmentSummary: React.ReactNode
  allyLane: React.ReactNode
  opponentLane: React.ReactNode
  combatLog: React.ReactNode
}

export function EncounterActiveView({
  focusedCard,
  actionPreview,
  targetPreview,
  environmentSummary,
  allyLane,
  opponentLane,
  combatLog,
}: EncounterActiveViewProps) {
  return (
    <Stack spacing={3}>
      {focusedCard}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Box sx={{ flex: 1 }}>{actionPreview}</Box>
        <Box sx={{ flex: 1 }}>{targetPreview}</Box>
      </Stack>

      {environmentSummary}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
          gap: 3,
        }}
      >
        {allyLane}
        {opponentLane}
      </Box>

      {combatLog}
    </Stack>
  )
}
