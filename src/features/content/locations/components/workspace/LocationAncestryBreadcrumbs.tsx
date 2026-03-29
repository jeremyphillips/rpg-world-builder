import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import MuiBreadcrumbs from '@mui/material/Breadcrumbs'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import type { Location } from '@/features/content/locations/domain/types'

type LocationAncestryBreadcrumbsProps = {
  locations: Location[]
  campaignId?: string
  /** The location being edited. Omit on create. */
  currentLocationId?: string
  /** Direct parent id — used to walk the chain. */
  parentId?: string
}

/**
 * Walks the parentId chain to build an ancestor breadcrumb trail.
 * Each ancestor links to its detail route; the current location (if editing) is plain text.
 */
export function LocationAncestryBreadcrumbs({
  locations,
  campaignId,
  currentLocationId,
  parentId,
}: LocationAncestryBreadcrumbsProps) {
  const trail = useMemo(() => {
    if (!parentId || locations.length === 0) return []
    const byId = new Map(locations.map((l) => [l.id, l]))
    const segments: Location[] = []
    let pid: string | undefined = parentId
    let guard = 0
    while (pid && guard++ < 24) {
      const loc = byId.get(pid)
      if (!loc) break
      segments.unshift(loc)
      pid = loc.parentId
    }
    return segments
  }, [locations, parentId])

  if (trail.length === 0) return null

  return (
    <MuiBreadcrumbs
      separator="›"
      sx={{ '& .MuiBreadcrumbs-separator': { mx: 0.5 }, lineHeight: 1 }}
    >
      {trail.map((loc) => (
        <MuiLink
          key={loc.id}
          component={Link}
          to={campaignId ? `/campaigns/${campaignId}/world/locations/${loc.id}` : '#'}
          underline="hover"
          variant="caption"
          color="text.secondary"
        >
          {loc.name}
        </MuiLink>
      ))}
      {currentLocationId && (
        <Typography variant="caption" color="text.secondary">
          {locations.find((l) => l.id === currentLocationId)?.name ?? ''}
        </Typography>
      )}
    </MuiBreadcrumbs>
  )
}
