import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { locations as locationData } from '@/data/locations'
import type { Location } from '@/data/locations'
import { ROUTES } from '@/app/routes'
import { AppPageHeader, Breadcrumbs } from '@/ui/patterns'
import { FilterableCardGroup } from '@/ui/patterns'
import type { FilterOption } from '@/ui/patterns'
import { LocationHorizontalCard } from '@/features/content/locations/components'
import { useBreadcrumbs } from '@/app/navigation'
import { getLegacyType, sortLocations, getIndentLevel } from '@/features/content/locations/locationLegacy'
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

const LocationsRoute = () => {
  const { id: campaignId } = useParams<{ id: string }>()
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

  return (
    <Box>
      <AppPageHeader
        headline="Locations"
        breadcrumbData={breadcrumbs}
      />
      
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
              />
            </Box>
          )
        }}
      />
    </Box>
  )
}

export default LocationsRoute
