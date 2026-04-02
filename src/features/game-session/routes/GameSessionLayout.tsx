import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useParams, useLocation, Link as RouterLink } from 'react-router-dom'
import { ApiError } from '@/app/api'
import { Breadcrumbs } from '@/ui/patterns'
import { useBreadcrumbs } from '@/app/navigation'
import { fetchGameSession } from '../api/gameSessionApi'
import { GameSessionRecordProvider } from './GameSessionRecordContext'
import { GameSessionSyncProvider } from './GameSessionSyncContext'
import {
  campaignGameSessionLobbyPath,
  campaignGameSessionPlayPath,
  campaignGameSessionSetupPath,
  campaignGameSessionsListPath,
} from './gameSessionPaths'
import type { GameSession } from '../domain/game-session.types'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import MuiLink from '@mui/material/Link'
import CircularProgress from '@mui/material/CircularProgress'

/** Campaign game session shell: loads canonical `GameSession`, owns `GameSessionSyncProvider`
 * (socket `game_session_sync` at layout scope for lobby/setup/play), and wraps outlet. Route
 * guards derive encounter phase via `deriveGameSessionCanonicalPhase` after refetch.
 */
export default function GameSessionLayout() {
  const { id: campaignId, gameSessionId } = useParams<{ id: string; gameSessionId: string }>()
  const { pathname } = useLocation()
  const breadcrumbs = useBreadcrumbs()

  const [session, setSession] = useState<GameSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!campaignId || !gameSessionId) return
    setLoadError(null)
    try {
      const s = await fetchGameSession(campaignId, gameSessionId)
      setSession(s)
    } catch (e) {
      setSession(null)
      if (e instanceof ApiError) {
        setLoadError(e.message)
      } else {
        setLoadError('Failed to load session')
      }
    }
  }, [campaignId, gameSessionId])

  useEffect(() => {
    if (!campaignId || !gameSessionId) return

    let cancelled = false
    setLoading(true)
    setLoadError(null)

    fetchGameSession(campaignId, gameSessionId)
      .then((s) => {
        if (!cancelled) setSession(s)
      })
      .catch((e) => {
        if (!cancelled) {
          setSession(null)
          if (e instanceof ApiError) {
            setLoadError(e.message)
          } else {
            setLoadError('Failed to load session')
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [campaignId, gameSessionId])

  if (!campaignId || !gameSessionId) {
    return null
  }

  const inPlay = pathname.endsWith('/play') || pathname.endsWith('/play/')

  if (loading) {
    if (inPlay) {
      return (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <CircularProgress size={28} aria-label="Loading game session" />
        </Box>
      )
    }
    return (
      <Box>
        <Breadcrumbs items={breadcrumbs} />
        <CircularProgress size={28} sx={{ mt: 2 }} />
      </Box>
    )
  }

  if (!session || loadError) {
    if (inPlay) {
      return (
        <Box sx={{ flex: 1, minHeight: 0, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Game session not found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {loadError ?? 'This session does not exist or you do not have access.'}
          </Typography>
          <MuiLink component={RouterLink} to={campaignGameSessionsListPath(campaignId)}>
            Back to live play
          </MuiLink>
        </Box>
      )
    }
    return (
      <Box>
        <Breadcrumbs items={breadcrumbs} />
        <Typography variant="h6" gutterBottom>
          Game session not found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {loadError ?? 'This session does not exist or you do not have access.'}
        </Typography>
        <MuiLink component={RouterLink} to={campaignGameSessionsListPath(campaignId)}>
          Back to live play
        </MuiLink>
      </Box>
    )
  }

  const lobbyPath = campaignGameSessionLobbyPath(campaignId, gameSessionId)
  const setupPath = campaignGameSessionSetupPath(campaignId, gameSessionId)
  const playPath = campaignGameSessionPlayPath(campaignId, gameSessionId)
  const inLobby = pathname.endsWith('/lobby')
  const inSetup = pathname.endsWith('/setup')
  const showPlayTab = session.status === 'active'

  return (
    <GameSessionRecordProvider session={session} refetch={refetch}>
      <GameSessionSyncProvider
        campaignId={campaignId}
        gameSessionId={gameSessionId}
        refetchSession={refetch}
      >
        {inPlay ? (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <Outlet />
          </Box>
        ) : (
          <Box>
            <Breadcrumbs items={breadcrumbs} />
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button
                component={NavLink}
                to={lobbyPath}
                variant={inLobby ? 'contained' : 'outlined'}
                size="small"
              >
                Lobby
              </Button>
              <Button
                component={NavLink}
                to={setupPath}
                variant={inSetup ? 'contained' : 'outlined'}
                size="small"
              >
                Setup
              </Button>
              {showPlayTab && (
                <Button
                  component={NavLink}
                  to={playPath}
                  variant="outlined"
                  size="small"
                >
                  Play
                </Button>
              )}
            </Stack>
            <Outlet />
          </Box>
        )}
      </GameSessionSyncProvider>
    </GameSessionRecordProvider>
  )
}
