import { listLocationMaps } from '@/features/content/locations/domain/repo/locationMapRepo'

import { buildEncounterSpaceFromLocationMap } from './buildEncounterSpaceFromLocationMap'
import {
  buildFallbackEncounterSpace,
  pickEncounterGridMap,
  resolveSimulatorMapHostLocationId,
} from './encounterSpaceResolution'

import type { EncounterSpace } from '@/features/mechanics/domain/combat/space'
import type { Location } from '@/features/content/locations/domain/model/location'

export type SimulatorEncounterSpaceResolution = {
  space: EncounterSpace
  debug: {
    mapHostLocationId: string | null
    mapId: string | null
    mapName: string | null
    source: 'authored-floor-map' | 'fallback-grid' | 'fallback-no-host'
  }
}

/**
 * Async resolver for Encounter Simulator **Start combat**: map host → `listLocationMaps` →
 * {@link pickEncounterGridMap} → {@link buildEncounterSpaceFromLocationMap}, else
 * {@link buildFallbackEncounterSpace} (parity with server game-session combat space).
 */
export async function resolveEncounterSpaceForSimulatorStart(opts: {
  campaignId: string
  locations: Location[]
  buildingLocationIds: string[]
}): Promise<SimulatorEncounterSpaceResolution> {
  const { campaignId, locations, buildingLocationIds } = opts
  const mapHostLocationId = resolveSimulatorMapHostLocationId({ locations, buildingLocationIds })

  if (!mapHostLocationId) {
    const space = buildFallbackEncounterSpace({
      id: 'simulator-fallback-no-host',
      name: 'Battlefield',
      locationId: null,
    })
    return {
      space,
      debug: {
        mapHostLocationId: null,
        mapId: null,
        mapName: null,
        source: 'fallback-no-host',
      },
    }
  }

  const maps = await listLocationMaps(campaignId, mapHostLocationId)
  const chosen = pickEncounterGridMap(maps)
  if (chosen) {
    const space = buildEncounterSpaceFromLocationMap({
      mapHostLocationId,
      map: chosen,
    })
    return {
      space,
      debug: {
        mapHostLocationId,
        mapId: chosen.id,
        mapName: chosen.name,
        source: 'authored-floor-map',
      },
    }
  }

  const space = buildFallbackEncounterSpace({
    id: `simulator-fallback-${mapHostLocationId}`,
    name: 'Battlefield',
    locationId: mapHostLocationId,
  })
  return {
    space,
    debug: {
      mapHostLocationId,
      mapId: null,
      mapName: null,
      source: 'fallback-grid',
    },
  }
}
