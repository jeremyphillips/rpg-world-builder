import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

type EncounterSetupViewProps = {
  environmentSetup: React.ReactNode
  gridSetup?: React.ReactNode
  allyLane: React.ReactNode
  opponentLane: React.ReactNode
}

export function EncounterSetupView({
  environmentSetup,
  gridSetup,
  allyLane,
  opponentLane,
}: EncounterSetupViewProps) {
  return (
    <Stack spacing={3}>
      {environmentSetup}
      {gridSetup}

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
    </Stack>
  )
}
