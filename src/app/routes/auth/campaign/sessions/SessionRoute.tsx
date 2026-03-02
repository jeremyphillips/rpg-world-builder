import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useNotifications } from '@/app/providers/NotificationProvider'
import { apiFetch } from '@/app/api'
import type { Session } from '@/features/session'
import { formatSessionDateTime } from '@/features/session'
import {
  EditableField,
  EditableTextField,
  EditableSelect,
} from '@/ui/patterns'
import { Breadcrumbs } from '@/ui/patterns'
import { useBreadcrumbs } from '@/hooks'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import { ConfirmModal } from '@/ui/patterns'
import Stack from '@mui/material/Stack'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import dayjs, { type Dayjs } from 'dayjs'
import SaveIcon from '@mui/icons-material/Save'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import DeleteIcon from '@mui/icons-material/Delete'
import { AppAlert } from '@/ui/primitives'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SessionInvite = {
  id: string
  sessionId: string
  campaignId: string
  userId: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  createdAt: string
  respondedAt: string | null
}

// ---------------------------------------------------------------------------
// Date editor sub-component
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

function SessionDateEdit({
  value,
  onSave,
  onClose,
  saving,
}: {
  value: string
  onSave: (v: string) => void
  onClose: () => void
  saving: boolean
}) {
  const [local, setLocal] = useState<Dayjs | null>(() => dayjs(value))
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flexWrap: 'wrap', width: '100%' }}>
        <DateTimePicker
          value={local}
          onChange={setLocal}
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />
        <Button
          size="small"
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => local && onSave(local.toISOString())}
          disabled={saving}
        >
          {saving ? '...' : 'Save'}
        </Button>
        <Button size="small" onClick={onClose}>
          Cancel
        </Button>
      </Box>
    </LocalizationProvider>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SessionRoute() {
  const { id: campaignId, sessionId } = useParams<{ id: string; sessionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refresh: refreshNotifications } = useNotifications()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<SessionInvite | null>(null)
  const [responding, setResponding] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const breadcrumbs = useBreadcrumbs()

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  // Load session
  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    apiFetch<{ session: Session }>(`/api/sessions/${sessionId}`)
      .then((data) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setLoading(false))
  }, [sessionId])

  // Load current user's session invite
  useEffect(() => {
    if (!sessionId) return
    apiFetch<{ invite: SessionInvite | null }>(`/api/session-invites/session/${sessionId}/mine`)
      .then((data) => setInvite(data.invite))
      .catch(() => setInvite(null))
  }, [sessionId])

  const saveSession = async (partial: Partial<Session>) => {
    if (!sessionId) return
    const data = await apiFetch<{ session: Session }>(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      body: partial,
    })
    setSession(data.session)
  }

  const handleRsvp = async (accept: boolean) => {
    if (!invite) return
    setResponding(true)
    try {
      const data = await apiFetch<{ invite: SessionInvite }>(
        `/api/session-invites/${invite.id}/respond`,
        { method: 'POST', body: { accept } },
      )
      setInvite(data.invite)
      await refreshNotifications()
    } catch (err) {
      console.error('RSVP failed:', err)
    } finally {
      setResponding(false)
    }
  }

  const handleDelete = async () => {
    if (!sessionId) return
    setDeleting(true)
    try {
      await apiFetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      navigate(`/campaigns/${campaignId}/sessions`)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!session) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">Session not found.</Typography>
      </Box>
    )
  }

  const dateLabel = formatSessionDateTime(session.date)

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Breadcrumbs items={breadcrumbs} />

      {/* ── RSVP Alert ──────────────────────────────────────────────── */}
      {invite?.status === 'pending' && (
        <AppAlert 
          tone="info"
          sx={{ mb: 3 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                color="success"
                variant="contained"
                startIcon={<EventAvailableIcon />}
                onClick={() => handleRsvp(true)}
                disabled={responding}
              >
                RSVP
              </Button>
              <Button
                size="small"
                color="error"
                variant="outlined"
                startIcon={<EventBusyIcon />}
                onClick={() => handleRsvp(false)}
                disabled={responding}
              >
                Decline
              </Button>
            </Stack>
          }
        >
          You have been invited to this session on <strong>{dateLabel}</strong>. RSVP requested.
        </AppAlert>
      )}

      {invite?.status === 'accepted' && (
        <AppAlert tone="success" sx={{ mb: 3 }}>
          You accepted this session invitation.
        </AppAlert>
      )}

      {invite?.status === 'declined' && (
        <AppAlert tone="warning" sx={{ mb: 3 }}>
          You declined this session invitation.
        </AppAlert>
      )}

      {/* ── Session details ─────────────────────────────────────────── */}
      <Typography variant="h1" fontWeight={700} sx={{ mb: 3 }}>
        {session.title || 'Untitled Session'}
      </Typography>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {isAdmin && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                color="error"
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </Box>
          )}

          <EditableTextField
            label="Title"
            value={session.title ?? ''}
            onSave={(v: string) => saveSession({ title: v })}
            disabled={!isAdmin}
          />

          <EditableTextField
            label="Notes"
            value={session.notes ?? ''}
            onSave={(v: string) => saveSession({ notes: v })}
            disabled={!isAdmin}
            multiline
            minRows={3}
          />

          {isAdmin ? (
            <EditableField<string>
              label="Date & time"
              value={session.date}
              onSave={async (v) => saveSession({ date: v })}
              renderDisplay={() => dateLabel}
              renderEdit={({ value, onSave, onClose, saving }) => (
                <SessionDateEdit
                  value={value}
                  onSave={onSave}
                  onClose={onClose}
                  saving={saving}
                />
              )}
            />
          ) : (
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Date & time
              </Typography>
              <Typography variant="body1">{dateLabel}</Typography>
            </Box>
          )}

          <EditableSelect
            label="Status"
            value={session.status}
            onSave={(v: string) => saveSession({ status: v as Session['status'] })}
            options={STATUS_OPTIONS}
            disabled={!isAdmin}
          />
        </CardContent>
      </Card>

      {/* ── Delete confirmation ────────────────────────────────────── */}
      <ConfirmModal
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        headline="Delete session?"
        description="This will permanently delete the session and notify all invited members that it has been cancelled."
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleting}
      />
    </Box>
  )
}
