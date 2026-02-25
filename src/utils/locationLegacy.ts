import type { Location } from '@/data/locations'

/**
 * Maps the new `scale` field back to legacy location type strings
 * used by the existing filter UI. Temporary bridge during migration.
 */
export function getLegacyType(location: { scale?: string }): string {
  if (location.scale === 'world') return 'world'
  if (location.scale === 'region') return 'region'
  if (location.scale === 'settlement') return 'city'
  if (location.scale === 'district') return 'district'
  if (location.scale === 'site') return 'landmark'
  if (location.scale === 'building') return 'building'
  if (location.scale === 'room') return 'room'

  return 'other'
}

const SCALE_ORDER = [
  'world',
  'region',
  'settlement',
  'district',
  'site',
  'building',
  'room',
]

export function sortLocations(a: Location, b: Location): number {
  const scaleDiff =
    SCALE_ORDER.indexOf(a.scale ?? '') - SCALE_ORDER.indexOf(b.scale ?? '')

  if (scaleDiff !== 0) return scaleDiff

  return a.name.localeCompare(b.name)
}

const INDENT_MAP: Record<string, number> = {
  world: 0,
  region: 1,
  settlement: 2,
  district: 3,
  site: 4,
  building: 5,
  room: 6,
}

export function getIndentLevel(location: { scale?: string }): number {
  return INDENT_MAP[location.scale ?? ''] ?? 0
}
