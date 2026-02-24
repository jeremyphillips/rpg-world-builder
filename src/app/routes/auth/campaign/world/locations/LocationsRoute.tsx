import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { settings, worlds } from '@/data'
import type { Location, LocationType, Visibility } from '@/data/types'
import { useAuth } from '@/app/providers/AuthProvider'
import { ROUTES } from '@/app/routes'
import { Hero, Breadcrumbs } from '@/ui/elements'
import { FormModal } from '@/ui/modals'
import { FilterableCardGroup } from '@/ui/components'
import type { FilterOption } from '@/ui/components/FilterableCardGroup/FilterableCardGroup'
import { LocationHorizontalCard } from '@/features/location/components'
import { useBreadcrumbs } from '@/hooks'
import { apiFetch } from '@/app/api'
import { resolveImageUrl } from '@/utils/image'
import type { FieldConfig } from '@/ui/components/form/form.types'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { useCampaignParty } from '@/features/campaign/hooks/useCampaignParty'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'

import AddIcon from '@mui/icons-material/Add'

const LOCATION_TYPE_OPTIONS: { value: LocationType; label: string }[] = [
  { value: 'region', label: 'Region' },
  { value: 'city', label: 'City' },
  { value: 'town', label: 'Town' },
  { value: 'dungeon', label: 'Dungeon' },
  { value: 'landmark', label: 'Landmark' },
  { value: 'other', label: 'Other' },
]

const FILTER_OPTIONS: { value: LocationType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  ...LOCATION_TYPE_OPTIONS,
]

const TYPE_COLORS: Record<LocationType, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  region: 'primary',
  city: 'secondary',
  town: 'success',
  dungeon: 'error',
  landmark: 'warning',
  other: 'info',
}

const DEFAULT_VISIBILITY: Visibility = { allCharacters: false, characterIds: [] }

interface LocationOverride {
  name?: string
  type?: string
  description?: string
  imageUrl?: string | null
  visibility?: Visibility
}

function getWorldForSetting(settingId: string) {
  const setting = settings.find((s) => s.id === settingId)
  if (!setting) return null
  const worldId = setting.worldIds?.[0] ?? setting.worldId?.[0] ?? setting.worlds?.[0]
  if (!worldId) return null
  return worlds.find((w: { id: string; name: string }) => w.id === worldId) ?? null
}

function getSettingLocations(settingId: string): Location[] {
  const setting = settings.find((s) => s.id === settingId)
  return setting?.locations ?? []
}

function applyOverrides(
  dataLocations: Location[],
  overrides: Record<string, LocationOverride>
): Location[] {
  return dataLocations.map((loc) => {
    const o = overrides[loc.id]
    if (!o) return loc
    return {
      ...loc,
      name: o.name ?? loc.name,
      type: (o.type as LocationType) ?? loc.type,
      description: o.description ?? loc.description,
      imageUrl: o.imageUrl === null ? undefined : (o.imageUrl ?? loc.imageUrl),
      visibility: o.visibility ?? loc.visibility,
    }
  })
}

async function fetchSettingData(
  settingId: string
): Promise<{
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

async function apiCreateLocation(settingId: string, location: Location) {
  await apiFetch(`/api/setting-data/${settingId}/locations`, {
    method: 'POST',
    body: location,
  })
}

export default function LocationsRoute() {
  const { id: campaignId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'superadmin'
  const {
    loading: activeCampaignLoading,
    campaignId: activeCampaignId,
    campaign: activeCampaign,
  } = useActiveCampaign()
  const activeSettingId = activeCampaign?.identity?.setting ?? null
  const { party: partyMembers } = useCampaignParty('approved')
  const world = getWorldForSetting(activeSettingId ?? '')

  const [loading, setLoading] = useState(true)
  const [worldMapUrl, setWorldMapUrl] = useState<string | null>(null)
  const [customLocations, setCustomLocations] = useState<Location[]>([])
  const [locationOverrides, setLocationOverrides] = useState<Record<string, LocationOverride>>({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const breadcrumbs = useBreadcrumbs()

  useEffect(() => {
    if (!campaignId || !activeSettingId) {
      setLoading(true)
      return
    }
    let cancelled = false
    async function load() {
      try {
        const data = await fetchSettingData(activeSettingId ?? '')
        if (cancelled || !data) return
        setWorldMapUrl(data.worldMapUrl ?? null)
        setCustomLocations(data.customLocations ?? [])
        setLocationOverrides(data.locationOverrides ?? {})
      } catch (err) {
        console.error('Failed to load setting data:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [campaignId, activeSettingId])

  const dataLocations = useMemo(() => getSettingLocations(activeSettingId ?? ''), [activeSettingId])
  const mergedDataLocations = useMemo(
    () => applyOverrides(dataLocations, locationOverrides),
    [dataLocations, locationOverrides]
  )
  const allLocations = useMemo(
    () => [...mergedDataLocations, ...customLocations],
    [mergedDataLocations, customLocations]
  )

  const createFormDefaults = useMemo(() => ({
    imageKey: '',
    name: '',
    type: 'other' as LocationType,
    description: '',
    visibility: DEFAULT_VISIBILITY,
  }), [])

  function openCreate() {
    setShowCreateForm(true)
  }

  if (!campaignId) {
    return (
      <Typography color="text.secondary">No campaign selected.</Typography>
    )
  }

  if (activeCampaignLoading || (!activeCampaignId && loading)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!activeSettingId) {
    return (
      <Typography color="text.secondary">Campaign has no setting configured.</Typography>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  // ── Form fields for Create Location modal ──────────────────────────
  const createFormFields: FieldConfig[] = [
    { type: 'imageUpload', name: 'imageKey', label: 'Image', maxHeight: 200 },
    { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Location name' },
    {
      type: 'select',
      name: 'type',
      label: 'Type',
      options: LOCATION_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label })),
    },
    { type: 'textarea', name: 'description', label: 'Description', rows: 3, placeholder: 'Describe this location…' },
    { type: 'visibility', name: 'visibility', label: 'Visibility', characters: partyMembers },
  ]

  async function handleCreateSubmit(data: Record<string, unknown>) {
    const name = data.name as string
    if (!name) return
    const imageKey = (data.imageKey as string) || undefined
    const locId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const apiBody = {
      id: locId,
      settingId: activeSettingId,
      name,
      type: (data.type as LocationType) ?? 'other',
      description: (data.description as string) || undefined,
      imageKey,
      visibility: (data.visibility as Visibility) ?? DEFAULT_VISIBILITY,
      isCustom: true,
    }
    await apiCreateLocation(activeSettingId ?? '', apiBody as unknown as Location)
    // Add to local state with resolved imageUrl for display
    const displayLoc: Location = {
      ...apiBody,
      imageUrl: resolveImageUrl(imageKey),
    }
    setCustomLocations((prev) => [...prev, displayLoc])
  }

  return (
    <Box>
      <Breadcrumbs items={breadcrumbs} />

      {/* Hero — world map */}
      <Box sx={{ mb: 3 }}>
        <Hero
          headline={world?.name ?? 'Unknown World'}
          subheadline="World Map"
          image={worldMapUrl ?? undefined}
        />
      </Box>

      {/* New Location button — below hero */}
      {canEdit && (
        <Box sx={{ mb: 3 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New Location
          </Button>
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      <FilterableCardGroup<Location>
        items={allLocations}
        getSearchValue={(loc) => loc.name}
        getFilterValue={(loc) => loc.type}
        filterOptions={FILTER_OPTIONS as FilterOption[]}
        searchPlaceholder="Search locations…"
        emptyMessage="No locations found."
        renderCard={(loc) => {
          const parentName = loc.parentLocationId
            ? allLocations.find((l) => l.id === loc.parentLocationId)?.name ?? loc.parentLocationId
            : undefined
          const locationLink = ROUTES.WORLD_LOCATION
            .replace(':id', campaignId!)
            .replace(':locationId', loc.id)
          return (
            <LocationHorizontalCard
              key={loc.id}
              link={locationLink}
              name={loc.name}
              type={loc.type}
              description={loc.description}
              imageUrl={loc.imageUrl}
              isCustom={loc.isCustom}
              parentName={parentName}
              typeColor={TYPE_COLORS[loc.type]}
            />
          )
        }}
      />

      <FormModal
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateSubmit}
        headline="New Location"
        fields={createFormFields}
        defaultValues={createFormDefaults}
        submitLabel="Create"
      />
    </Box>
  )
}
