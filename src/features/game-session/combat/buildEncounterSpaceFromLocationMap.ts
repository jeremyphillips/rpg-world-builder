import type { LocationMapBase } from '@/shared/domain/locations/map/locationMap.types'

import { buildEncounterAuthoringPresentationFromLocationMap } from './buildEncounterAuthoringPresentation'
import type { LocationMapEdgeKindId } from '@/shared/domain/locations/map/locationMapEdgeFeature.constants'
import { createSquareGridSpace } from '@/features/mechanics/domain/combat/space/creation/createSquareGridSpace'
import type { EncounterEdge, EncounterSpace } from '@/features/mechanics/domain/combat/space'

const BETWEEN_EDGE_RE = /^between:([^|]+)\|([^|]+)$/

/** Location authoring uses `x,y`; combat square grids use `c-x-y` (see {@link createSquareGridSpace}). */
export function authorCellIdToCombatCellId(authorCellId: string): string {
  const t = authorCellId.trim()
  const m = /^(\d+),(\d+)$/.exec(t)
  if (m) return `c-${m[1]}-${m[2]}`
  return t
}

function parseBetweenEdgeKey(edgeId: string): [string, string] | null {
  const m = BETWEEN_EDGE_RE.exec(edgeId.trim())
  if (!m) return null
  return [m[1]!.trim(), m[2]!.trim()]
}

function cellUnitToCombatCellFeet(cellUnit: unknown): 5 | 10 {
  const s = String(cellUnit ?? '')
    .toLowerCase()
    .trim()
  if (s.includes('25') || s === '25ft') return 10
  return 5
}

function edgeToEncounterEdge(
  fromCombat: string,
  toCombat: string,
  kind: LocationMapEdgeKindId,
): EncounterEdge {
  switch (kind) {
    case 'door':
      return {
        fromCellId: fromCombat,
        toCellId: toCombat,
        kind: 'door',
        bidirectional: true,
        blocksMovement: false,
        blocksSight: false,
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

  const base = createSquareGridSpace({
    id: map.id,
    name: map.name,
    columns,
    rows,
    cellFeet: cellUnitToCombatCellFeet(cellUnit),
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
  for (const e of map.edgeEntries ?? []) {
    const ends = parseBetweenEdgeKey(e.edgeId)
    if (!ends) continue
    const [a, b] = ends
    const fromCombat = authorCellIdToCombatCellId(a)
    const toCombat = authorCellIdToCombatCellId(b)
    if (!byId.has(fromCombat) || !byId.has(toCombat)) continue
    edges.push(edgeToEncounterEdge(fromCombat, toCombat, e.kind))
  }

  return {
    ...base,
    cells: [...byId.values()],
    edges: edges.length > 0 ? edges : undefined,
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
