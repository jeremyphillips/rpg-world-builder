import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { Breadcrumbs } from '@/ui/patterns'
import { useBreadcrumbs } from '@/app/navigation'
import { formatSessionDateTime } from '@/features/session/dates'
import { createGameSession, fetchGameSessionsForCampaign } from '../api/gameSessionApi'
import { campaignGameSessionLobbyPath } from './gameSessionPaths'
import { canEditGameSessionSetup } from '../utils/canEditGameSessionSetup'
import type { GameSession } from '../domain/game-session.types'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'
import LiveTvIcon from '@mui/icons-material/LiveTv'

export default function GameSessionListRoute() {
  const { id: campaignId } = useParams<{ id: string }>()
  const { campaign } = useActiveCampaign()
  const breadcrumbs = useBreadcrumbs()
  const navigate = useNavigate()
  const [items, setItems] = useState<GameSession[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const canCreate = useMemo(() => canEditGameSessionSetup(campaign?.viewer), [campaign?.viewer])

  useEffect(() => {
    if (!campaignId) return
    let cancelled = false
    fetchGameSessionsForCampaign(campaignId)
      .then((rows) => {
        if (!cancelled) setItems(rows)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [campaignId])

  async function handleCreate() {
    if (!campaignId) return
    setCreating(true)
    try {
      const s = await createGameSession(campaignId, { title: 'New live session' })
      navigate(campaignGameSessionLobbyPath(campaignId, s.id))
    } finally {
      setCreating(false)
    }
  }

  if (!campaignId) return null

  return (
    <Box>
      <Breadcrumbs items={breadcrumbs} />
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <LiveTvIcon color="primary" />
        <Typography variant="h5" component="h1">
          Live play
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 640 }}>
        Game sessions are the player-facing live-play container for a campaign (lobby, scheduling,
        location). They are separate from{' '}
        <MuiLink component={RouterLink} to={ROUTES.SESSIONS.replace(':id', campaignId)}>
          calendar sessions
        </MuiLink>{' '}
        and from the{' '}
        <MuiLink component={RouterLink} to={ROUTES.CAMPAIGN_ENCOUNTER.replace(':id', campaignId)}>
          Encounter Simulator
        </MuiLink>
        , which remains a dev/testing combat sandbox.
      </Typography>

      {canCreate && (
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : 'New live session'}
          </Button>
        </Box>
      )}

      {loading ? (
        <CircularProgress size={28} />
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No live sessions yet.
          {canCreate && ' Use “New live session” to create one.'}
        </Typography>
      ) : (
        <List dense disablePadding>
          {items.map((row) => (
            <ListItemButton
              key={row.id}
              component={RouterLink}
              to={campaignGameSessionLobbyPath(campaignId, row.id)}
            >
              <ListItemText
                primary={row.title}
                secondary={
                  row.scheduledFor
                    ? formatSessionDateTime(row.scheduledFor)
                    : `${row.status} · no time set`
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  )
}
