/**
 * Rollup manual chunk ids for stable vendor bundles (long-term cache).
 * Used from vite.config.ts — keep paths aligned with package.json dependencies.
 */
export const VENDOR_CHUNK = {
  react: 'vendor-react',
  mui: 'vendor-mui',
  muiIcons: 'vendor-mui-icons',
  muiDataGrid: 'vendor-mui-x-data-grid',
  muiDatePickers: 'vendor-mui-x-date-pickers',
} as const

export const APP_CHUNK = {
  /** SRD catalog core (classes, races, equipment) — loaded with loadSystemCatalog(). */
  systemCatalog: 'system-catalog',
  /** Spell data shard — dynamic import from catalog.ts. */
  systemCatalogSpells: 'system-catalog-spells',
  /** Monster data shard — dynamic import from catalog.ts. */
  systemCatalogMonsters: 'system-catalog-monsters',
} as const

/** Rollup manualChunks: vendors + deferred SRD catalog graph. */
export function resolveManualChunk(id: string): string | undefined {
  const normalized = id.replace(/\\/g, '/')

  if (normalized.includes('/rulesets/system/spells')) {
    return APP_CHUNK.systemCatalogSpells
  }

  if (normalized.includes('/rulesets/system/monsters')) {
    return APP_CHUNK.systemCatalogMonsters
  }

  if (
    normalized.includes('/rulesets/system/') &&
    !normalized.includes('/rulesets/system/systemRulesets') &&
    !normalized.includes('/rulesets/system/emptyCampaignCatalog') &&
    !normalized.includes('/rulesets/system/catalog.sync')
  ) {
    return APP_CHUNK.systemCatalog
  }

  return resolveVendorManualChunk(normalized)
}

/** Assign node_modules imports to vendor chunks; app code stays in route/async chunks. */
export function resolveVendorManualChunk(id: string): string | undefined {
  const normalized = id.replace(/\\/g, '/')
  if (!normalized.includes('node_modules/')) return undefined

  if (
    normalized.includes('node_modules/react-dom/') ||
    normalized.includes('node_modules/react/') ||
    normalized.includes('node_modules/scheduler/')
  ) {
    return VENDOR_CHUNK.react
  }

  if (normalized.includes('@mui/x-data-grid')) {
    return VENDOR_CHUNK.muiDataGrid
  }

  if (normalized.includes('@mui/x-date-pickers')) {
    return VENDOR_CHUNK.muiDatePickers
  }

  if (normalized.includes('@mui/icons-material')) {
    return VENDOR_CHUNK.muiIcons
  }

  if (
    normalized.includes('@mui/material') ||
    normalized.includes('@mui/system') ||
    normalized.includes('@mui/utils') ||
    normalized.includes('@mui/base') ||
    normalized.includes('@emotion/')
  ) {
    return VENDOR_CHUNK.mui
  }

  return undefined
}
