import type { LocationMapBase } from '@/shared/domain/locations/map/locationMap.types'
import type { EncounterSpace } from '@/features/mechanics/domain/combat/space'
import { createSquareGridSpace } from '@/features/mechanics/domain/combat/space/creation/createSquareGridSpace'

import type { Location } from '@/features/content/locations/domain/model/location'

/**
 * Picks the encounter-grid map to use for tactical combat: default map when marked, else first
 * encounter-grid map. Matches server {@link resolveEncounterSpaceForGameSessionStart} precedence.
 */
export function pickEncounterGridMap(maps: LocationMapBase[]): LocationMapBase | null {
  const encounterMaps = maps.filter((m) => m.kind === 'encounter-grid')
  if (encounterMaps.length === 0) return null
  return encounterMaps.find((m) => m.isDefault) ?? encounterMaps[0] ?? null
}

/**
 * Prefer the encounter-grid map whose id matches the persisted tactical {@link EncounterSpace.id}
 * (the map used to hydrate combat grid objects). Falls back to {@link pickEncounterGridMap} when
 * the id is missing or no longer exists (e.g. stale session, generated fallback space).
 */
export function pickEncounterGridMapForSpace(maps: LocationMapBase[], spaceId: string): LocationMapBase | null {
  const encounterMaps = maps.filter((m) => m.kind === 'encounter-grid')
  if (encounterMaps.length === 0) return null
  const aligned = encounterMaps.find((m) => m.id === spaceId)
  if (aligned) return aligned
  return encounterMaps.find((m) => m.isDefault) ?? encounterMaps[0] ?? null
}

/** Same dimensions as server fallback when no authored encounter-grid map exists. */
export function buildFallbackEncounterSpace(opts: {
  id: string
  name: string
  locationId: string | null
}): EncounterSpace {
  return createSquareGridSpace({
    id: opts.id,
    name: opts.name,
    columns: 10,
    rows: 10,
    locationId: opts.locationId,
  })
}

/**
 * Fallback tactical space large enough to include a destination stair cell when that floor has no
 * encounter-grid map to hydrate (matches server “fallback grid” behavior for session start).
 */
export function buildFallbackEncounterSpaceContainingCell(opts: {
  id: string
  name: string
  locationId: string | null
  /** Combat cell id (`c-x-y`). */
  combatCellId: string
}): EncounterSpace {
  const m = /^c-(\d+)-(\d+)$/.exec(opts.combatCellId.trim())
  const x = m ? Number.parseInt(m[1]!, 10) : 0
  const y = m ? Number.parseInt(m[2]!, 10) : 0
  const columns = Math.max(10, x + 1)
  const rows = Math.max(10, y + 1)
  return createSquareGridSpace({
    id: opts.id,
    name: opts.name,
    columns,
    rows,
    locationId: opts.locationId,
  })
}

function sortFloorsForHost(floors: Location[]): Location[] {
  return [...floors].sort((a, b) => {
    const ao = a.sortOrder ?? 0
    const bo = b.sortOrder ?? 0
    if (ao !== bo) return ao - bo
    return String(a.name).localeCompare(String(b.name))
  })
}

/** First floor under a building (by sort order + name), or null. */
export function getFirstFloorLocationIdForBuilding(
  buildingLocationId: string,
  locations: Location[],
): string | null {
  const floors = locations.filter((l) => l.scale === 'floor' && l.parentId === buildingLocationId)
  if (floors.length === 0) return null
  return sortFloorsForHost(floors)[0]?.id ?? null
}

/**
 * Map host for simulator: first floor of the selected building. No building selected → null
 * (caller may default-select a building once locations load).
 */
export function resolveSimulatorMapHostLocationId(opts: {
  locations: Location[]
  buildingLocationIds: string[]
}): string | null {
  const buildingId = opts.buildingLocationIds[0]
  if (!buildingId) return null
  return getFirstFloorLocationIdForBuilding(buildingId, opts.locations)
}
