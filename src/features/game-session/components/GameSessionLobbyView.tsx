import { useMemo } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import type { CharacterRosterSummary } from '@/features/character/read-model'
import { CharacterMediaTopCard } from '@/features/character/components'
import type { GameSession } from '../domain/game-session.types'
import { formatSessionDateTime } from '@/features/session/dates'
import { getLobbyStatusBanner } from '../utils/lobbyStatusPresentation'
import { getPresentPlayerCharacterIdsForSessionLobby } from '../utils/presentPlayerCharactersForSessionLobby'
import { resolveExpectedSessionCharacterIds } from '../utils/resolveExpectedSessionCharacterIds'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

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
  campaignCharacters: CharacterRosterSummary[]
  campaignPartyLoading: boolean
  presentUserIdSet: ReadonlySet<string>
  onStartSession?: () => void | Promise<void>
  startSessionLoading?: boolean
  startSessionError?: string | null
}

export function GameSessionLobbyView({
  session,
  campaignCharacters,
  campaignPartyLoading,
  presentUserIdSet,
  onStartSession,
  startSessionLoading,
  startSessionError,
}: GameSessionLobbyViewProps) {
  const { user } = useAuth()
  const banner = getLobbyStatusBanner(session)

  const dmIsYou = user?.id === session.dmUserId
  const canStartSession = dmIsYou && session.status === 'lobby' && typeof onStartSession === 'function'

  const expectedCharacterRows = useMemo(() => {
    const expectedIds = new Set(resolveExpectedSessionCharacterIds(session, campaignCharacters))
    return campaignCharacters.filter((c) => expectedIds.has(c.id))
  }, [session, campaignCharacters])

  const presentPlayerCharacterIds = useMemo(
    () => getPresentPlayerCharacterIdsForSessionLobby(session, campaignCharacters, presentUserIdSet),
    [session, campaignCharacters, presentUserIdSet],
  )

  const hasPresentPlayerCharacters = presentPlayerCharacterIds.length > 0

  const startSessionDisabled =
    Boolean(startSessionLoading) || campaignPartyLoading || !hasPresentPlayerCharacters

  const showStartBlockedByPresence =
    canStartSession && !campaignPartyLoading && !hasPresentPlayerCharacters

  return (
    <Stack spacing={2}>
      <Alert severity={banner.severity}>
        <Typography variant="subtitle2" component="div" fontWeight={600}>
          {banner.title}
        </Typography>
        {banner.body && (
          <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
            {banner.body}
          </Typography>
        )}
      </Alert>

      <Box>
        <Typography variant="h5" component="h1" gutterBottom>
          {session.title}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip size="small" label={STATUS_LABEL[session.status]} color="primary" variant="outlined" />
          {session.scheduledFor && (
            <Typography variant="body2" color="text.secondary">
              Planned start: {formatSessionDateTime(session.scheduledFor)}
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
            Host
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" label="Dungeon Master" color="secondary" variant="outlined" />
            <Typography variant="body2" color="text.secondary">
              {dmIsYou
                ? 'You are running this session (not shown as a player character).'
                : 'Session host is not listed with the party cards below.'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {canStartSession && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Start live play
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              When you are ready, start the session to create the active encounter. Only party characters
              whose players have this lobby open (so they appear as present below) are placed in the
              encounter; opponents you configured in setup are still added as usual.
            </Typography>
            {startSessionError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {startSessionError}
              </Alert>
            )}
            {showStartBlockedByPresence && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                At least one player character must be present in the lobby (this page open) to start the
                session.
              </Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              disabled={startSessionDisabled}
              onClick={() => void onStartSession?.()}
            >
              {startSessionLoading ? 'Starting…' : 'Start session'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Expected party
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Live presence is ephemeral. Who is here updates while this lobby is open; it is not saved on
          the session record.
        </Typography>

        {campaignPartyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : expectedCharacterRows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No campaign characters to show yet.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {expectedCharacterRows.map((char) => {
              const isPresent = presentUserIdSet.has(char.ownerUserId)
              return (
                <Box
                  key={char.id}
                  sx={{
                    opacity: isPresent ? 1 : 0.45,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  <CharacterMediaTopCard
                    characterId={char.id}
                    name={char.name}
                    race={char.race?.name ?? '—'}
                    classes={char.classes}
                    imageUrl={char.imageUrl ?? undefined}
                    status={char.status}
                    isPresent={isPresent}
                    attribution={{ name: char.ownerName, imageUrl: char.ownerAvatarUrl ?? undefined }}
                    link={`/characters/${char.id}`}
                  />
                </Box>
              )
            })}
          </Box>
        )}
      </Box>

    </Stack>
  )
}
