import type { EncounterSpace } from '@/features/mechanics/domain/combat/space'
import { createSquareGridSpace } from '@/features/mechanics/domain/combat/space/creation/createSquareGridSpace'

import {
  buildEncounterSpaceFromLocationMap,
  summarizeEncounterSpaceForLog,
} from '@/features/game-session/combat/buildEncounterSpaceFromLocationMap'
import { CampaignLocation } from '../../../shared/models/CampaignLocation.model'
import { listMapsForLocation } from '../../content/locations/services/locationMaps.service'
import type { GameSessionApi } from './gameSession.service'

export type GameSessionCombatSpaceSource = 'authored-floor-map' | 'fallback-grid' | 'fallback-no-session-location'

export type GameSessionCombatSpaceResolution = {
  space: EncounterSpace
  debug: {
    encounterLocationId: string | null
    buildingLocationId: string | null
    sessionFloorIndex: number | null
    mapHostLocationId: string | null
    mapId: string | null
    mapName: string | null
    source: GameSessionCombatSpaceSource
    resolvedFloorCount: number | null
  }
}

const isDevDiagnostics =
  process.env.NODE_ENV !== 'production' || process.env.GAME_SESSION_COMBAT_SPACE_LOG === '1'

function logResolution(debug: GameSessionCombatSpaceResolution['debug'], spaceSummary: ReturnType<typeof summarizeEncounterSpaceForLog>): void {
  if (!isDevDiagnostics) return
  console.info(
    '[game-session combat space]',
    JSON.stringify({
      ...debug,
      derivedSpace: spaceSummary,
    }),
  )
}

function fallbackSpace(opts: { id: string; name: string; locationId: string | null }) {
  return createSquareGridSpace({
    id: opts.id,
    name: opts.name,
    columns: 10,
    rows: 10,
    cellFeet: 5,
    locationId: opts.locationId,
  })
}

/**
 * Resolves tactical space for starting a persisted combat from a game session.
 *
 * Precedence:
 * 1. Default (or first) encounter-grid map for the resolved floor / location host, converted to {@link EncounterSpace}.
 * 2. Otherwise a square fallback grid (still tied to `mapHostLocationId` when known).
 * 3. If the session has no location, a generic fallback grid with no `locationId`.
 */
export async function resolveEncounterSpaceForGameSessionStart(
  campaignId: string,
  session: GameSessionApi,
): Promise<GameSessionCombatSpaceResolution> {
  const encounterLocationId = session.location?.locationId ?? null
  const sessionFloorIndexRaw = session.location?.floorId
  const sessionFloorIndex =
    sessionFloorIndexRaw && /^\d+$/.test(sessionFloorIndexRaw)
      ? Number.parseInt(sessionFloorIndexRaw, 10)
      : null

  if (!encounterLocationId) {
    const space = fallbackSpace({
      id: 'game-session-fallback-no-location',
      name: 'Battlefield',
      locationId: null,
    })
    const debug = {
      encounterLocationId,
      buildingLocationId: null,
      sessionFloorIndex,
      mapHostLocationId: null,
      mapId: null,
      mapName: null,
      source: 'fallback-no-session-location' as const,
      resolvedFloorCount: null,
    }
    logResolution(debug, summarizeEncounterSpaceForLog(space))
    return { space, debug }
  }

  const hostDoc = await CampaignLocation.findOne({ campaignId, locationId: encounterLocationId }).lean()
  const hostScale = hostDoc ? String((hostDoc as { scale?: string }).scale ?? '') : ''

  let mapHostLocationId: string | null = encounterLocationId
  let buildingLocationId: string | null = null
  let resolvedFloorCount: number | null = null

  if (hostScale === 'building' && sessionFloorIndex !== null && sessionFloorIndex >= 1) {
    buildingLocationId = encounterLocationId
    const floors = await CampaignLocation.find({
      campaignId,
      parentId: encounterLocationId,
      scale: 'floor',
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean()
    resolvedFloorCount = floors.length
    const idx = sessionFloorIndex - 1
    const floorDoc = floors[idx] as { locationId?: string } | undefined
    if (floorDoc?.locationId) {
      mapHostLocationId = floorDoc.locationId
    } else {
      mapHostLocationId = null
    }
  }

  if (!mapHostLocationId) {
    const space = fallbackSpace({
      id: `game-session-fallback-missing-floor-${encounterLocationId}`,
      name: 'Battlefield',
      locationId: encounterLocationId,
    })
    const debug = {
      encounterLocationId,
      buildingLocationId,
      sessionFloorIndex,
      mapHostLocationId: null,
      mapId: null,
      mapName: null,
      source: 'fallback-grid' as const,
      resolvedFloorCount,
    }
    logResolution(debug, summarizeEncounterSpaceForLog(space))
    return { space, debug }
  }

  const maps = await listMapsForLocation(campaignId, mapHostLocationId)
  const encounterMaps = maps.filter((m) => m.kind === 'encounter-grid')
  const chosen = encounterMaps.find((m) => m.isDefault) ?? encounterMaps[0]

  if (chosen) {
    const space = buildEncounterSpaceFromLocationMap({
      mapHostLocationId,
      map: chosen,
    })
    const debug = {
      encounterLocationId,
      buildingLocationId,
      sessionFloorIndex,
      mapHostLocationId,
      mapId: chosen.id,
      mapName: chosen.name,
      source: 'authored-floor-map' as const,
      resolvedFloorCount,
    }
    logResolution(debug, summarizeEncounterSpaceForLog(space))
    return { space, debug }
  }

  const space = fallbackSpace({
    id: `game-session-fallback-${mapHostLocationId}`,
    name: 'Battlefield',
    locationId: mapHostLocationId,
  })
  const debug = {
    encounterLocationId,
    buildingLocationId,
    sessionFloorIndex,
    mapHostLocationId,
    mapId: null,
    mapName: null,
    source: 'fallback-grid' as const,
    resolvedFloorCount,
  }
  logResolution(debug, summarizeEncounterSpaceForLog(space))
  return { space, debug }
}
