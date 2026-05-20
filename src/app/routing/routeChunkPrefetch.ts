/**
 * Prefetch loaders for hot auth/campaign nav targets.
 * Must use the same dynamic import() paths as lazyRoute() in router.tsx so Vite
 * resolves the same async chunks.
 */
const prefetched = new Set<string>()

export function prefetchRouteChunk(key: string, loader: () => Promise<unknown>): void {
  if (prefetched.has(key)) return
  prefetched.add(key)
  void loader().catch(() => {
    prefetched.delete(key)
  })
}

const loaders = {
  authLayout: () => import('@/app/layouts/auth/AuthLayout'),
  characterProviders: () => import('@/app/providers/CharacterProvidersLayout'),
  dashboard: () => import('@/features/campaign/routes/DashboardRoute'),
  characters: () => import('@/features/character/routes/CharactersRoute'),
  campaigns: () => import('@/features/campaign/routes/CampaignsRoute'),
  campaignHub: () => import('@/features/campaign/routes/CampaignHubRoute'),
  campaignLayout: () => import('@/features/campaign/routes/CampaignLayoutRoute'),
  worldLayout: () => import('@/features/campaign/routes/world/WorldLayout'),
  worldEquipment: () => import('@/features/content/equipment/routes/EquipmentHubRoute'),
  worldLocations: () => import('@/features/content/locations/routes'),
  worldClasses: () => import('@/features/content/classes/routes'),
  messaging: () => import('@/features/campaign/routes/messaging/MessagingRoute'),
  gameSessions: () => import('@/features/game-session/routes/GameSessionListRoute'),
} as const

/** Pointer-intent prefetch from a resolved nav path (e.g. NavLink `to`). */
export function prefetchRouteChunkForPath(path: string): void {
  if (path.includes('/world/equipment')) {
    prefetchRouteChunk('worldEquipment', loaders.worldEquipment)
    prefetchRouteChunk('worldLayout', loaders.worldLayout)
    return
  }

  if (path.includes('/world/')) {
    prefetchRouteChunk('worldLayout', loaders.worldLayout)
    if (path.includes('/locations')) prefetchRouteChunk('worldLocations', loaders.worldLocations)
    if (path.includes('/classes')) prefetchRouteChunk('worldClasses', loaders.worldClasses)
    return
  }

  if (path.includes('/game-sessions')) {
    prefetchRouteChunk('gameSessions', loaders.gameSessions)
    return
  }

  if (path.includes('/messages')) {
    prefetchRouteChunk('messaging', loaders.messaging)
    return
  }

  if (/^\/campaigns\/[^/]+$/.test(path)) {
    prefetchRouteChunk('campaignHub', loaders.campaignHub)
    prefetchRouteChunk('campaignLayout', loaders.campaignLayout)
    return
  }

  if (path.startsWith('/campaigns')) {
    prefetchRouteChunk('campaigns', loaders.campaigns)
    return
  }

  if (path.startsWith('/characters')) {
    prefetchRouteChunk('authLayout', loaders.authLayout)
    prefetchRouteChunk('characterProviders', loaders.characterProviders)
    prefetchRouteChunk('characters', loaders.characters)
    return
  }

  if (path === '/dashboard') {
    prefetchRouteChunk('authLayout', loaders.authLayout)
    prefetchRouteChunk('dashboard', loaders.dashboard)
  }
}
