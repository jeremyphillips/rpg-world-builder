import type { LocationMapBase } from '@/shared/domain/locations/map/locationMap.types'

import { isLocationMapEdgeEntryDoorInstance } from '@/features/content/locations/domain/authoring/map/locationMapEdgeDoorAuthoring'
import {
  resolveDoorRuntimeFromState,
  resolveLocationPlacedObjectKindRuntimeDefaults,
} from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.runtime'
import { buildEncounterAuthoringPresentationFromLocationMap } from './buildEncounterAuthoringPresentation'
import type { LocationMapEdgeKindId } from '@/shared/domain/locations/map/locationMapEdgeFeature.constants'
import type { LocationMapEdgeAuthoringEntry } from '@/shared/domain/locations'
import { createSquareGridSpace } from '@/features/mechanics/domain/combat/space/creation/createSquareGridSpace'
import type { EncounterEdge, EncounterSpace } from '@/features/mechanics/domain/combat/space'

import { authorCellIdToCombatCellId } from './encounterMapCellIds'
import {
  applyEncounterCellBlockingFlagsForAuthoredGridObjects,
  buildGridObjectsFromLocationMapCellEntries,
} from './hydrateGridObjectsFromLocationMap'
import { parseSquareEdgeId } from '@/shared/domain/grid/gridEdgeIds'
import { sanitizeAuthoredDoorState } from '@/shared/domain/locations/map/locationMapDoorAuthoring.helpers'
import { cellUnitToCombatCellFeet } from '@/shared/domain/locations/map/locationCellUnitCombat'

export { authorCellIdToCombatCellId } from './encounterMapCellIds'

const DOOR_BASE_RUNTIME = resolveLocationPlacedObjectKindRuntimeDefaults('door')

function edgeToEncounterEdge(
  fromCombat: string,
  toCombat: string,
  kind: LocationMapEdgeKindId,
  mapEntry?: LocationMapEdgeAuthoringEntry,
): EncounterEdge {
  switch (kind) {
    case 'door': {
      const doorState = sanitizeAuthoredDoorState(
        mapEntry != null && isLocationMapEdgeEntryDoorInstance(mapEntry) ? mapEntry.doorState : undefined,
      )
      const rt = resolveDoorRuntimeFromState(DOOR_BASE_RUNTIME, {
        openState: doorState.openState,
        lockState: doorState.lockState,
      })
      return {
        fromCellId: fromCombat,
        toCellId: toCombat,
        kind: 'door',
        bidirectional: true,
        blocksMovement: rt.blocksMovement,
        blocksSight: rt.blocksLineOfSight,
        mapEdgeId: mapEntry?.edgeId,
        doorState,
      }
    }
    case 'window':
      return {
        fromCellId: fromCombat,
        toCellId: toCombat,
        bidirectional: true,
        blocksMovement: true,
        blocksSight: false,
      }
    case 'wall':
      return {
        fromCellId: fromCombat,
        toCellId: toCombat,
        bidirectional: true,
        blocksMovement: true,
        blocksSight: true,
      }
  }
}

export type BuildEncounterSpaceFromLocationMapOptions = {
  /** Floor (or direct) location id for `EncounterSpace.locationId`. */
  mapHostLocationId: string
  map: LocationMapBase
}

/**
 * Builds a tactical {@link EncounterSpace} from an authored encounter-grid location map.
 * Precedence for callers: use this when an encounter-grid map exists; otherwise use a generated grid.
 */
export function buildEncounterSpaceFromLocationMap(
  opts: BuildEncounterSpaceFromLocationMapOptions,
): EncounterSpace {
  const { mapHostLocationId, map } = opts
  const { width: columns, height: rows, cellUnit } = map.grid

  void cellUnitToCombatCellFeet(cellUnit)

  const base = createSquareGridSpace({
    id: map.id,
    name: map.name,
    columns,
    rows,
    locationId: mapHostLocationId,
  })

  const byId = new Map(base.cells.map((c) => [c.id, { ...c }]))

  for (const raw of map.layout?.excludedCellIds ?? []) {
    const id = authorCellIdToCombatCellId(raw)
    const cell = byId.get(id)
    if (!cell) continue
    cell.kind = 'blocking'
    cell.blocksMovement = true
    cell.blocksSight = true
    cell.blocksProjectiles = true
  }

  const edges: EncounterEdge[] = []
  /** Coarse `kind` only for tactical edges — see `locationMapEdgeAuthoring.policy.md` (no variant/state). */
  for (const e of map.edgeEntries ?? []) {
    const parsed = parseSquareEdgeId(e.edgeId)
    // Encounter edges are pairwise cell adjacency; outer-boundary (perimeter) segments are UI-only here.
    if (!parsed || parsed.kind !== 'between') continue
    const [a, b] = [parsed.cellA, parsed.cellB]
    const fromCombat = authorCellIdToCombatCellId(a)
    const toCombat = authorCellIdToCombatCellId(b)
    if (!byId.has(fromCombat) || !byId.has(toCombat)) continue
    edges.push(edgeToEncounterEdge(fromCombat, toCombat, e.kind, e))
  }

  const gridObjects = buildGridObjectsFromLocationMapCellEntries(map)
  let cells = [...byId.values()]
  if (gridObjects.length > 0) {
    cells = applyEncounterCellBlockingFlagsForAuthoredGridObjects(cells, gridObjects)
  }

  return {
    ...base,
    cells,
    edges: edges.length > 0 ? edges : undefined,
    gridObjects: gridObjects.length > 0 ? gridObjects : undefined,
    authoringPresentation: buildEncounterAuthoringPresentationFromLocationMap(map),
  }
}

export function summarizeEncounterSpaceForLog(space: EncounterSpace): {
  id: string
  mode: EncounterSpace['mode']
  width: number
  height: number
  cellCount: number
  locationId: string | null | undefined
  edgeCount: number
} {
  return {
    id: space.id,
    mode: space.mode,
    width: space.width,
    height: space.height,
    cellCount: space.cells.length,
    locationId: space.locationId,
    edgeCount: space.edges?.length ?? 0,
  }
}
