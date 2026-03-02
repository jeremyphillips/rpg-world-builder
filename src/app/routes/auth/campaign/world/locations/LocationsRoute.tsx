import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { locations as locationData } from '@/data/locations'
import type { Location } from '@/data/locations'
import { useAuth } from '@/app/providers/AuthProvider'
import { ROUTES } from '@/app/routes'
import { Breadcrumbs } from '@/ui/patterns'
import { FilterableCardGroup } from '@/ui/patterns'
import type { FilterOption } from '@/ui/patterns'
import { LocationHorizontalCard } from '@/features/location/components'
import { useBreadcrumbs } from '@/hooks'
import { getLegacyType, sortLocations, getIndentLevel } from '@/utils/locationLegacy'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

const LOCATION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'world', label: 'World' },
  { value: 'region', label: 'Region' },
  { value: 'city', label: 'City / Settlement' },
  { value: 'district', label: 'District' },
  { value: 'landmark', label: 'Landmark / Site' },
  { value: 'building', label: 'Building' },
  { value: 'room', label: 'Room' },
  { value: 'other', label: 'Other' },
]

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Types' },
  ...LOCATION_TYPE_OPTIONS,
]

const TYPE_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  world: 'primary',
  region: 'primary',
  city: 'secondary',
  district: 'secondary',
  landmark: 'warning',
  building: 'success',
  room: 'info',
  other: 'info',
}

export default function LocationsRoute() {
  const { id: campaignId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const _canEdit = user?.role === 'admin' || user?.role === 'superadmin'
  const breadcrumbs = useBreadcrumbs()

  const sortedLocations = useMemo(() => {
    const campaignLocations = (locationData as readonly Location[]).filter(
      (loc) => loc.campaignId === campaignId,
    )
    return [...campaignLocations].sort(sortLocations)
  }, [campaignId])

  if (!campaignId) {
    return (
      <Typography color="text.secondary">No campaign selected.</Typography>
    )
  }

  /* TODO: Restore location creation and editing UI
  const canEdit = _canEdit

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
      name,
      type: data.type ?? 'other',
      description: (data.description as string) || undefined,
      imageKey,
      isCustom: true,
    }
    await apiFetch(`/api/locations`, { method: 'POST', body: apiBody })
  }

  {canEdit && (
    <Box sx={{ mb: 3 }}>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateForm(true)}>
        New Location
      </Button>
    </Box>
  )}

  <FormModal
    open={showCreateForm}
    onClose={() => setShowCreateForm(false)}
    onSubmit={handleCreateSubmit}
    headline="New Location"
    fields={createFormFields}
    defaultValues={createFormDefaults}
    submitLabel="Create"
  />
  */

  return (
    <Box>
      <Breadcrumbs items={breadcrumbs} />

      <Divider sx={{ mb: 3 }} />

      <FilterableCardGroup<Location>
        items={sortedLocations}
        getSearchValue={(loc) => loc.name}
        getFilterValue={(loc) => getLegacyType(loc)}
        filterOptions={FILTER_OPTIONS as FilterOption[]}
        searchPlaceholder="Search locations…"
        emptyMessage="No locations found."
        renderCard={(loc) => {
          const parentName = loc.parentId
            ? sortedLocations.find((l) => l.id === loc.parentId)?.name ?? loc.parentId
            : undefined
          const locationLink = ROUTES.WORLD_LOCATION
            .replace(':id', campaignId!)
            .replace(':locationId', loc.id)
          const legacyType = getLegacyType(loc)
          return (
            <Box sx={{ pl: `${getIndentLevel(loc) * 12}px` }}>
              <LocationHorizontalCard
                key={loc.id}
                link={locationLink}
                name={loc.name}
                type={legacyType}
                description={loc.description}
                parentName={parentName}
                typeColor={TYPE_COLORS[legacyType] ?? 'info'}
              />
            </Box>
          )
        }}
      />
    </Box>
  )
}
