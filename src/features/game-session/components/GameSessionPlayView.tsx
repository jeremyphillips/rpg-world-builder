import type { GameSession } from '../domain/game-session.types'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { GameSessionEncounterPlaySurface } from './GameSessionEncounterPlaySurface'

type GameSessionPlayViewProps = {
  session: GameSession
}

/**
 * Live session play: loads persisted combat for `session.activeEncounterId` and renders the shared
 * {@link CombatPlayView} shell (grid, sidebar, drawers) via {@link GameSessionEncounterPlaySurface}.
 */
export function GameSessionPlayView({ session }: GameSessionPlayViewProps) {
  return (
    <Stack spacing={2} sx={{ height: '100%', minHeight: 0 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {session.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Session play — combat state is loaded from the linked encounter record.
      </Typography>
      <GameSessionEncounterPlaySurface session={session} />
    </Stack>
  )
}
