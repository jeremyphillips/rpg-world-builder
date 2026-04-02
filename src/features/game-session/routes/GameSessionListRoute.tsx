import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom'
import type { GridRenderCellParams } from '@mui/x-data-grid'
import { ROUTES } from '@/app/routes'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { Breadcrumbs } from '@/ui/patterns'
import { useBreadcrumbs } from '@/app/navigation'
import { AppDataGrid } from '@/ui/patterns'
import type { AppDataGridColumn, AppDataGridFilter } from '@/ui/patterns'
import { formatSessionDateTime } from '@/features/session/dates'
import { createGameSession, fetchGameSessionsForCampaign } from '../api/gameSessionApi'
import {
  campaignGameSessionLobbyPath,
  campaignGameSessionSetupPath,
} from './gameSessionPaths'
import { canEditGameSessionSetup } from '../utils/canEditGameSessionSetup'
import type { GameSession, GameSessionStatus } from '../domain/game-session.types'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import LiveTvIcon from '@mui/icons-material/LiveTv'

const STATUS_LABEL: Record<GameSessionStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  lobby: 'Lobby',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function statusChipColor(
  status: GameSessionStatus,
): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' {
  switch (status) {
    case 'draft':
      return 'default'
    case 'scheduled':
      return 'info'
    case 'lobby':
      return 'primary'
    case 'active':
      return 'success'
    case 'completed':
      return 'secondary'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

function formatLocationCell(row: GameSession): string {
  const loc = row.location
  const primary =
    loc.label ?? loc.locationId ?? (loc.buildingId ? `Building ${loc.buildingId}` : null) ?? '—'
  if (loc.floorId && /^\d+$/.test(loc.floorId)) {
    return `${primary} · Fl. ${loc.floorId}`
  }
  if (loc.floorId) {
    return `${primary} · ${loc.floorId}`
  }
  return primary
}

export default function GameSessionListRoute() {
  const { id: campaignId } = useParams<{ id: string }>()
  const { campaign } = useActiveCampaign()
  const breadcrumbs = useBreadcrumbs()
  const navigate = useNavigate()
  const [items, setItems] = useState<GameSession[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const canManage = useMemo(() => canEditGameSessionSetup(campaign?.viewer), [campaign?.viewer])

  useEffect(() => {
    if (!campaignId) return
    setLoading(true)
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

  const handleCreate = async () => {
    if (!campaignId) return
    setCreating(true)
    try {
      const s = await createGameSession(campaignId, { title: 'New live session' })
      navigate(campaignGameSessionLobbyPath(campaignId, s.id))
    } finally {
      setCreating(false)
    }
  }

  const columns: AppDataGridColumn<GameSession>[] = useMemo(() => {
    if (!campaignId) return []
    return [
      {
        field: 'title',
        headerName: 'Session',
        flex: 1,
        minWidth: 160,
        linkColumn: true,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row as GameSession
          return (
            <Chip
              size="small"
              label={STATUS_LABEL[row.status]}
              color={statusChipColor(row.status)}
              variant={row.status === 'draft' ? 'outlined' : 'filled'}
            />
          )
        },
      },
      {
        field: 'scheduledFor',
        headerName: 'Scheduled',
        width: 180,
        valueFormatter: (value) =>
          value ? formatSessionDateTime(value as string) : '—',
      },
      {
        field: 'locationDisplay',
        headerName: 'Location',
        flex: 1,
        minWidth: 160,
        accessor: (row) => formatLocationCell(row),
        valueFormatter: (value) => String(value ?? '—'),
      },
      {
        field: 'participantCount',
        headerName: 'Participants',
        width: 120,
        type: 'number',
        accessor: (row) => row.participants.length,
      },
      {
        field: 'updatedAt',
        headerName: 'Updated',
        width: 180,
        valueFormatter: (_value, row) =>
          row.updatedAt ? formatSessionDateTime(row.updatedAt) : '—',
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 200,
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row as GameSession
          const lobby = campaignGameSessionLobbyPath(campaignId, row.id)
          const setup = campaignGameSessionSetupPath(campaignId, row.id)
          return (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <MuiLink component={RouterLink} to={lobby} underline="hover" variant="body2" fontWeight={600}>
                Open
              </MuiLink>
              {canManage && (
                <MuiLink component={RouterLink} to={setup} underline="hover" variant="body2">
                  Setup
                </MuiLink>
              )}
            </Stack>
          )
        },
      },
    ]
  }, [campaignId, canManage])

  const statusFilter: AppDataGridFilter<GameSession> = useMemo(
    () => ({
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All statuses' },
        { value: 'draft', label: 'Draft' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'lobby', label: 'Lobby' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
      accessor: (row) => row.status,
      defaultValue: '',
    }),
    [],
  )

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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
        Game sessions are the player-facing live-play container for this campaign (lobby, scheduling,
        location). Calendar-style events live under{' '}
        <MuiLink component={RouterLink} to={ROUTES.SESSIONS.replace(':id', campaignId)}>
          Sessions
        </MuiLink>
        . The{' '}
        <MuiLink component={RouterLink} to={ROUTES.CAMPAIGN_ENCOUNTER.replace(':id', campaignId)}>
          Encounter Simulator
        </MuiLink>{' '}
        is separate (dev/testing combat).
      </Typography>

      <AppDataGrid<GameSession>
        rows={items}
        columns={columns}
        getRowId={(row) => row.id}
        getDetailLink={(row) => campaignGameSessionLobbyPath(campaignId, row.id)}
        filters={[statusFilter]}
        searchable
        searchPlaceholder="Search sessions…"
        searchColumns={['title']}
        loading={loading}
        emptyMessage="No live sessions yet."
        height={480}
        density="standard"
        toolbar={
          canManage ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'New live session'}
            </Button>
          ) : undefined
        }
      />
    </Box>
  )
}
