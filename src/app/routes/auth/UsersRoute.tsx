import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import PersonAddIcon from '@mui/icons-material/PersonAdd'

import { apiFetch, ApiError } from '@/app/api'
import { FormModal } from '@/ui/patterns'
import { AppDataGrid } from '@/ui/patterns'
import type { AppDataGridColumn } from '@/ui/patterns'
import type { FilterOption } from '@/ui/patterns'
import type { FieldConfig } from '@/ui/patterns'
import { AppAlert } from '@/ui/primitives'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface UserRow {
  id: string
  username: string
  email: string
  role: string
  campaignCount: number
  characterCount: number
}

const ROLES = ['superadmin', 'admin', 'user'] as const

function roleColor(role: string): 'error' | 'warning' | 'default' {
  if (role === 'superadmin') return 'error'
  if (role === 'admin') return 'warning'
  return 'default'
}

// ---------------------------------------------------------------------------
// DataGrid columns & filters
// ---------------------------------------------------------------------------
const columns: AppDataGridColumn<UserRow>[] = [
  { field: 'username', headerName: 'Name', flex: 1, minWidth: 140 },
  { field: 'id', headerName: 'id', flex: 1, minWidth: 140 },
  { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 200 },
  {
    field: 'role',
    headerName: 'Role',
    width: 130,
    renderCell: (params) => (
      <Chip
        label={params.value}
        size="small"
        color={roleColor(params.value)}
        sx={{ textTransform: 'capitalize' }}
      />
    ),
  },
  { field: 'campaignCount', headerName: 'Campaigns', width: 110, type: 'number' },
  { field: 'characterCount', headerName: 'Characters', width: 110, type: 'number' },
]

const roleFilterOptions: FilterOption[] = [
  { value: '', label: 'All roles' },
  ...ROLES.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) })),
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function UsersRoute() {
  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create-user modal
  const [open, setOpen] = useState(false)

  // ── Fetch users ──────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{
        users: { _id?: string; id?: string; username: string; email: string; role: string; campaignCount?: number; characterCount?: number }[]
      }>('/api/users')
      setRows(
        (data.users ?? []).map((u) => ({
          id: u._id ?? u.id ?? '',
          username: u.username,
          email: u.email,
          role: u.role,
          campaignCount: u.campaignCount ?? 0,
          characterCount: u.characterCount ?? 0,
        })),
      )
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ── Create user ──────────────────────────────────────────────────────
  const createFormFields: FieldConfig[] = [
    { type: 'text', name: 'username', label: 'Username', required: true },
    { type: 'text', name: 'email', label: 'Email', required: true, inputType: 'email' },
    { type: 'text', name: 'password', label: 'Password', required: true, inputType: 'password' },
    {
      type: 'select',
      name: 'role',
      label: 'Role',
      options: ROLES.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) })),
    },
  ]

  const createFormDefaults = {
    username: '',
    email: '',
    password: '',
    role: 'user' as string,
  }

  async function handleCreate(data: Record<string, unknown>) {
    await apiFetch('/api/users', {
      method: 'POST',
      body: {
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
      },
    })
    fetchUsers()
  }

  return (
    <Box>
      {error && (
        <AppAlert tone="danger" sx={{ mb: 2 }}>
          {error}
        </AppAlert>
      )}

      <AppDataGrid<UserRow>
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        filterColumn="role"
        filterOptions={roleFilterOptions}
        filterLabel="Role"
        searchable
        searchPlaceholder="Search users…"
        searchColumns={['username', 'email']}
        loading={loading}
        pageSizeOptions={[10, 25, 50]}
        emptyMessage="No users found."
        toolbar={
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setOpen(true)}>
            Add User
          </Button>
        }
      />

      <FormModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleCreate}
        headline="Add New User"
        fields={createFormFields}
        defaultValues={createFormDefaults}
        submitLabel="Create"
        size="standard"
      />
    </Box>
  )
}
