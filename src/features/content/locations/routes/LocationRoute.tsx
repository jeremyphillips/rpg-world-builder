import { useState, useMemo, useCallback } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'

import type { Visibility } from '@/shared/types/visibility'
import type { Location } from '@/data/locations'
import { locations as locationData } from '@/data/locations'
import { resolveImageUrl } from '@/shared/lib/media'
import { useAuth } from '@/app/providers/AuthProvider'
import { ROUTES } from '@/app/routes'
import { apiFetch } from '@/app/api'
import { useBreadcrumbs } from '@/app/navigation'
import { useCampaignMembers } from '@/features/campaign/hooks/useCampaignMembers'
import { useCampaigns } from '@/features/campaign/hooks/useCampaigns'
import { getLegacyType } from '@/features/content/locations/locationLegacy'
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

interface LocationOverride {
  name?: string
  type?: string
  description?: string
  imageUrl?: string | null
  visibility?: Visibility
}

async function apiUpdateLocation(campaignId: string, locationId: string, updates: Record<string, unknown>) {
  await apiFetch(`/api/campaigns/${campaignId}/setting-data/locations/${locationId}`, {
    method: 'PATCH',
    body: updates,
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LocationRoute = () => {
  const { id: campaignId, locationId } = useParams<{ id: string; locationId: string }>()
  const { user } = useAuth()
  const { campaigns } = useCampaigns({ campaignId })
  const { approvedCharacters } = useCampaignMembers()
  const [locationOverride, setLocationOverride] = useState<Partial<Location> | null>(null)
  const breadcrumbs = useBreadcrumbs()

  const campaign = campaigns?.find((c) => (c as { _id?: string })._id === campaignId) ?? null
  const canEdit =
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    (campaign?.membership as { ownerId?: string } | undefined)?.ownerId === user?.id

  const allLocations = useMemo(
    () =>
      campaignId
        ? (locationData as readonly Location[]).filter((l) => l.campaignId === campaignId)
        : [],
    [campaignId],
  )
  const location = useMemo(() => {
    const found = (locationData as readonly Location[]).find((l) => l.id === locationId)
    if (!found) return null
    return { ...found, ...locationOverride } as Location
  }, [locationId, locationOverride])

  // ── Save field ───────────────────────────────────────────────────────
  const saveField = useCallback(
    async (field: string, value: unknown) => {
      if (!location || !campaignId) return
      const updates: Record<string, unknown> = {
        [field]: value,
        isCustom: !!(location as { isCustom?: boolean }).isCustom,
      }
      await apiUpdateLocation(campaignId, location.id, updates)
      setLocationOverride((prev) => ({ ...prev, [field]: value }))
    },
    [location, campaignId],
  )

  // ── Derived ──────────────────────────────────────────────────────────
  const parentName = useMemo(() => {
    if (!location?.parentId) return undefined
    return allLocations.find((l) => l.id === location.parentId)?.name ?? location.parentId
  }, [location, allLocations])

  const backLink = campaignId
    ? ROUTES.WORLD_LOCATIONS.replace(':id', campaignId)
    : '#'

  // ── Render ───────────────────────────────────────────────────────────
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

  const locationType = getLegacyType(location)
  const locationVisibility = location.visibility

  return (
    <Box>
      <Breadcrumbs items={breadcrumbs} />

      {/* Hero — location image */}
      <AppHero
        headline={location.name}
        subheadline={locationType.charAt(0).toUpperCase() + locationType.slice(1)}
        image={resolveImageUrl(location.imageKey ?? undefined)}
      />

      {/* Badges */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2, mb: 3 }}>
        <Chip
          label={locationType}
          size="small"
          color={TYPE_COLORS[locationType] ?? 'primary'}
          variant="outlined"
          sx={{ textTransform: 'capitalize' }}
        />
        {(location as { isCustom?: boolean }).isCustom && (
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
          value={locationType}
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
            value={locationVisibility}
            onChange={(v) => saveField('visibility', v)}
            disabled={!canEdit}
            characters={approvedCharacters}
          />
        </Box>
      </Stack>
    </Box>
  )
}

export default LocationRoute
