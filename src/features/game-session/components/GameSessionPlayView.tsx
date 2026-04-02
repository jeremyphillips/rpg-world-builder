import type { GameSession } from '../domain/game-session.types'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { ActivePlayPageShell } from '@/ui/patterns'

import { GameSessionEncounterPlaySurface } from './GameSessionEncounterPlaySurface'

type GameSessionPlayViewProps = {
  session: GameSession
}

/**
 * Live session play: route-owned session copy and ActivePlayPageShell framing; shared combat UI
 * comes from GameSessionEncounterPlaySurface → useEncounterActivePlaySurface → CombatPlayView.
 */
export function GameSessionPlayView({ session }: GameSessionPlayViewProps) {
  return (
    <ActivePlayPageShell
      metadata={
        <Stack spacing={0.5}>
          <Typography variant="h5" component="h1">
            {session.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Session play — combat state is loaded from the linked encounter record.
          </Typography>
        </Stack>
      }
    >
      <GameSessionEncounterPlaySurface session={session} />
    </ActivePlayPageShell>
  )
}
