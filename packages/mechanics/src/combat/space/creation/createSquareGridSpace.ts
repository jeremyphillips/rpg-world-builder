import type { EncounterSpace, EncounterCell } from '../space.types'

import { ENCOUNTER_TACTICAL_CELL_FEET } from '@/shared/domain/locations/map/locationMapCombat.constants'

/**
 * Builds a square tactical {@link EncounterSpace}. Tactical scale is always
 * {@link ENCOUNTER_TACTICAL_CELL_FEET} ft per cell; there is no alternate cell size.
 */
export function createSquareGridSpace(opts: {
  id: string
  name: string
  columns: number
  rows: number
  locationId?: string | null
}): EncounterSpace {
  const cells: EncounterCell[] = []

  for (let y = 0; y < opts.rows; y++) {
    for (let x = 0; x < opts.columns; x++) {
      cells.push({
        id: `c-${x}-${y}`,
        x,
        y,
        kind: 'open',
        movementCost: 1,
        blocksMovement: false,
        blocksSight: false,
        blocksProjectiles: false,
        terrainTags: [],
        featureIds: [],
      })
    }
  }

  return {
    id: opts.id,
    locationId: opts.locationId ?? null,
    name: opts.name,
    mode: 'square-grid',
    width: opts.columns,
    height: opts.rows,
    cells,
    features: [],
    scale: { kind: 'grid', cellFeet: ENCOUNTER_TACTICAL_CELL_FEET },
  }
}
