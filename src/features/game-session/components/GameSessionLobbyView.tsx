import type { GameSession } from '../domain/game-session.types'
import { formatSessionDateTime } from '@/features/session/dates'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

const STATUS_LABEL: Record<GameSession['status'], string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  lobby: 'In lobby',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

type GameSessionLobbyViewProps = {
  session: GameSession
}

export function GameSessionLobbyView({ session }: GameSessionLobbyViewProps) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5" component="h1" gutterBottom>
          {session.title}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip size="small" label={STATUS_LABEL[session.status]} color="primary" variant="outlined" />
          {session.scheduledFor && (
            <Typography variant="body2" color="text.secondary">
              Scheduled: {formatSessionDateTime(session.scheduledFor)}
            </Typography>
          )}
        </Stack>
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Where
          </Typography>
          <Typography variant="body1">
            {session.location.label ?? session.location.locationId ?? '—'}
          </Typography>
          {session.location.floorId && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {/^\d+$/.test(session.location.floorId)
                ? `Floor ${session.location.floorId}`
                : session.location.floorId}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Participants
          </Typography>
          <List dense disablePadding>
            {session.participants.map((p) => (
              <ListItem key={`${p.userId}-${p.role}`} disableGutters>
                <ListItemText
                  primary={p.role === 'dm' ? 'Dungeon Master' : p.role === 'observer' ? 'Observer' : 'Player'}
                  secondary={
                    p.characterId
                      ? `User ${p.userId} · Character ${p.characterId}`
                      : `User ${p.userId}`
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {session.activeEncounterId && (
        <Typography variant="body2" color="text.secondary">
          Active encounter: {session.activeEncounterId} (integration later)
        </Typography>
      )}
    </Stack>
  )
}
