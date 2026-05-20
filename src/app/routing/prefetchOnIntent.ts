import type { MouseEventHandler } from 'react'
import { prefetchRouteChunkForPath } from './routeChunkPrefetch'

/** Attach to NavLink/ListItemButton for hover prefetch of the matching route chunk. */
export function prefetchOnIntent(to: string): { onMouseEnter: MouseEventHandler } {
  return {
    onMouseEnter: () => prefetchRouteChunkForPath(to),
  }
}
