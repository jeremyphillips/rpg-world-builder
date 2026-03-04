import { useState, useMemo, useCallback } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'

import type { Visibility } from '@/shared/types/visibility'
import type { Location } from '@/data/locations'
import { useAuth } from '@/app/providers/AuthProvider'
import { ROUTES } from '@/app/routes'
import { apiFetch } from '@/app/api'
import { useBreadcrumbs } from '@/hooks'
import { useCampaignMembers } from '@/features/campaign/hooks/useCampaignMembers'
import { useCampaigns } from '@/features/campaign/hooks/useCampaigns'
import {
  AppHero,
  Breadcrumbs,
  EditableTextField,
  EditableSelect,
  VisibilityField
} from '@/ui/patterns'


import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOCATION_TYPE_OPTIONS: { id: string; label: string }[] = [
  { id: 'region', label: 'Region' },
  { id: 'city', label: 'City' },
  { id: 'town', label: 'Town' },
  { id: 'dungeon', label: 'Dungeon' },
  { id: 'landmark', label: 'Landmark' },
  { id: 'other', label: 'Other' },
]

const TYPE_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  region: 'primary',
  city: 'secondary',
  town: 'success',
  dungeon: 'error',
  landmark: 'warning',
  other: 'info',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// function getSettingLocations(settingId: string): Location[] {
//   const setting = settings.find((s) => s.id === settingId)
//   return setting?.locations ?? []
// }

interface LocationOverride {
  name?: string
  type?: string
  description?: string
  imageUrl?: string | null
  visibility?: Visibility
}

async function fetchSettingData(settingId: string): Promise<{
  worldMapUrl?: string | null
  locations?: Location[]
  customLocations?: Location[]
  locationOverrides?: Record<string, LocationOverride>
} | null> {
  try {
    return await apiFetch(`/api/setting-data/${settingId}`)
  } catch {
    return null
  }
}

async function apiUpdateLocation(settingId: string, locationId: string, updates: Record<string, unknown>) {
  await apiFetch(`/api/setting-data/${settingId}/locations/${locationId}`, {
    method: 'PATCH',
    body: updates,
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LocationRoute() {
  const { id: campaignId, locationId } = useParams<{ id: string; locationId: string }>()
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'superadmin'
  const { campaigns } = useCampaigns({ campaignId })
  const { approvedCharacters } = useCampaignMembers()
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<Location | null>(null)
  const [allLocations, setAllLocations] = useState<Location[]>([])
  const breadcrumbs = useBreadcrumbs()
  const campaign = campaigns?.[0] ?? null
  const activeSetting = campaign?.identity.setting ?? ''

  // ── Load location data ───────────────────────────────────────────────
  // useEffect(() => {
  //   if (!activeSetting || !locationId) return
  //   let cancelled = false

  //   async function load() {
  //     const data = await fetchSettingData(activeSetting)
  //     if (cancelled || !data) {
  //       setLoading(false)
  //       return
  //     }

  //     const dataLocations = getSettingLocations(activeSetting)
  //     const overrides = data.locationOverrides ?? {}
  //     const merged = dataLocations.map((loc) => {
  //       const o = overrides[loc.id]
  //       if (!o) return loc
  //       return {
  //         ...loc,
  //         name: o.name ?? loc.name,
  //         type: (o.type as LocationType) ?? loc.type,
  //         description: o.description ?? loc.description,
  //         imageUrl: o.imageUrl === null ? undefined : (o.imageUrl ?? loc.imageUrl),
  //         visibility: o.visibility ?? loc.visibility,
  //       }
  //     })
  //     const customs = data.customLocations ?? []
  //     const all = [...merged, ...customs]
  //     setAllLocations(all)

  //     const found = all.find((l) => l.id === locationId) ?? null
  //     setLocation(found)
  //     setLoading(false)
  //   }

  //   load()
  //   return () => { cancelled = true }
  // }, [activeSetting, locationId])

  // ── Save field ───────────────────────────────────────────────────────
  const saveField = useCallback(
    async (field: string, value: unknown) => {
      if (!location) return
      const updates: Record<string, unknown> = {
        [field]: value,
        isCustom: !!location.isCustom,
      }
      await apiUpdateLocation(activeSetting, location.id, updates)
      setLocation((prev) => (prev ? { ...prev, [field]: value } : prev))
    },
    [location, activeSetting],
  )

  // ── Derived ──────────────────────────────────────────────────────────
  const parentName = useMemo(() => {
    if (!location?.parentLocationId) return undefined
    return allLocations.find((l) => l.id === location.parentLocationId)?.name ?? location.parentLocationId
  }, [location, allLocations])

  const backLink = campaignId
    ? ROUTES.WORLD_LOCATIONS.replace(':id', campaignId)
    : '#'

  // ── Render ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!location) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Location not found.</Typography>
        <Button component={RouterLink} to={backLink} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to Locations
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Breadcrumbs items={breadcrumbs} />

      {/* Hero — location image (leave as-is for now, inline editing refactored later) */}
      <AppHero
        headline={location.name}
        subheadline={location.type.charAt(0).toUpperCase() + location.type.slice(1)}
        image={location.imageUrl}
      />

      {/* Badges */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2, mb: 3 }}>
        <Chip
          label={location.type}
          size="small"
          color={TYPE_COLORS[location.type] ?? 'primary'}
          variant="outlined"
          sx={{ textTransform: 'capitalize' }}
        />
        {location.isCustom && (
          <Chip label="Custom" size="small" variant="outlined" color="info" />
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Editable fields */}
      <Stack spacing={3}>
        <EditableTextField
          label="Name"
          value={location.name}
          onSave={(v) => saveField('name', v)}
          disabled={!canEdit}
        />

        <EditableSelect
          label="Type"
          value={location.type}
          options={LOCATION_TYPE_OPTIONS}
          onSave={(v) => saveField('type', v)}
          disabled={!canEdit}
        />

        <EditableTextField
          label="Description"
          value={location.description ?? ''}
          onSave={(v) => saveField('description', v)}
          disabled={!canEdit}
          multiline
          minRows={3}
        />

        {parentName && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Parent Location
            </Typography>
            <Typography variant="body1">{parentName}</Typography>
          </Box>
        )}

        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem', mb: 1, display: 'block' }}>
            Visibility
          </Typography>
          <VisibilityField
            value={location.visibility}
            onChange={(v) => saveField('visibility', v)}
            disabled={!canEdit}
            characters={approvedCharacters}
          />
        </Box>
      </Stack>
    </Box>
  )
}
