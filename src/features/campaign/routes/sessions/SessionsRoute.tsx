import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { apiFetch } from '@/app/api'
import { ROUTES } from '@/app/routes'
import { useCampaignMembers } from '@/features/campaign/hooks/useCampaignMembers'
import type { Session } from '@/features/session/session.types'
import { formatSessionDateTime } from '@/features/session/dates'
import { Breadcrumbs } from '@/ui/patterns'
import { useBreadcrumbs } from '@/app/navigation'
import { FormModal } from '@/ui/patterns'
import { AppDataGrid } from '@/ui/patterns'
import type { AppDataGridColumn, AppDataGridFilter, FilterOption } from '@/ui/patterns'
import type { FieldConfig } from '@/ui/patterns'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import dayjs from 'dayjs'
import AddIcon from '@mui/icons-material/Add'

export default function SessionsRoute() {
  const { id: campaignId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const { approvedCharacters } = useCampaignMembers()
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const breadcrumbs = useBreadcrumbs()

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  useEffect(() => {
    async function load() {
      try {
        const sessionsRes = await apiFetch<{ sessions: Session[] }>('/api/sessions')
        // Filter to sessions belonging to this campaign
        const campaignSessions = (sessionsRes.sessions ?? []).filter(
          (s) => s.campaignId === campaignId,
        )
        setSessions(campaignSessions)
      } catch {
        setSessions([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [campaignId])

  const openModal = () => setModalOpen(true)

  const formFields: FieldConfig[] = useMemo(() => [
    { type: 'text', name: 'title', label: 'Name' },
    { type: 'textarea', name: 'notes', label: 'Notes', rows: 3 },
    { type: 'datetime', name: 'date', label: 'Date & time', required: true },
    { type: 'visibility', name: 'visibility', label: 'Visibility', characters: approvedCharacters, allowHidden: false },
  ], [approvedCharacters])

  const defaultValues = {
    title: '',
    notes: '',
    date: dayjs().toISOString(),
    visibility: { allCharacters: true, characterIds: [] },
  }

  const handleCreate = async (data: Record<string, unknown>) => {
    if (!campaignId) return
    await apiFetch('/api/sessions', {
      method: 'POST',
      body: {
        campaignId,
        date: data.date,
        title: (data.title as string) || undefined,
        notes: (data.notes as string) || undefined,
        visibility: data.visibility,
      },
    })
    const res = await apiFetch<{ sessions: Session[] }>('/api/sessions')
    const campaignSessions = (res.sessions ?? []).filter(
      (s) => s.campaignId === campaignId,
    )
    setSessions(campaignSessions)
  }

  const columns: AppDataGridColumn<Session>[] = [
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 120, linkColumn: true },
    {
      field: 'date',
      headerName: 'Date & time',
      width: 180,
      valueFormatter: (value) => (value ? formatSessionDateTime(value as string) : '—'),
    },
    { field: 'status', headerName: 'Status', width: 120 },
  ]

  const statusFilterOptions: FilterOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  const statusFilters: AppDataGridFilter<Session>[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: statusFilterOptions,
      accessor: (row) => String(row.status ?? ''),
      defaultValue: statusFilterOptions[0]?.value,
    },
  ]

  return (
    <Box>
      <Breadcrumbs items={breadcrumbs} />

      <AppDataGrid<Session>
        rows={sessions}
        columns={columns}
        getRowId={(row) => row.id}
        getDetailLink={(row) =>
          ROUTES.SESSION.replace(':id', campaignId!).replace(':sessionId', row.id)
        }
        toolbarConfig={{
          filters: { definitions: statusFilters },
          search: {
            enabled: true,
            placeholder: 'Search sessions…',
            columns: ['title'],
          },
          actions: isAdmin ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openModal}>
              Create session
            </Button>
          ) : undefined,
        }}
        presentation={{
          loading,
          emptyMessage: 'No sessions yet.',
        }}
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        headline="Create session"
        fields={formFields}
        defaultValues={defaultValues}
        submitLabel="Create session"
        size="standard"
      />
    </Box>
  )
}
