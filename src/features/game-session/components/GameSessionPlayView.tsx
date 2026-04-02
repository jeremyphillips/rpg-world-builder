import type { GameSession } from '../domain/game-session.types'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

type GameSessionPlayViewProps = {
  session: GameSession
}

/**
 * First live-play shell for an active session: shows authoritative session + encounter linkage.
 * Full persisted-combat UI remains on the Encounter Simulator until that surface is wired here.
 */
export function GameSessionPlayView({ session }: GameSessionPlayViewProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1" gutterBottom>
        {session.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This session is active. Combat state for this table lives in the linked encounter record below.
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Active encounter
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {session.activeEncounterId ?? '—'}
          </Typography>
        </CardContent>
      </Card>

      <Alert severity="info">
        The Encounter Simulator (`Campaign → Encounter`) remains the dev/testing surface for full grid
        and intent flow. This route is the live session shell; wiring it to the same persisted combat
        session is a follow-up.
      </Alert>

      <Box sx={{ display: 'none' }} aria-hidden>
        {/* Anchor for future embedded combat surface */}
      </Box>
    </Stack>
  )
}
