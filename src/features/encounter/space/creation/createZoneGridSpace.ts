import type { EncounterSpace, EncounterCell } from '../space.types'

export function createZoneGridSpace(opts: {
  id: string;
  name: string;
  width: number;
  height: number;
  locationId?: string | null;
}): EncounterSpace {
  const cells: EncounterCell[] = [];

  for (let y = 0; y < opts.height; y++) {
    for (let x = 0; x < opts.width; x++) {
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
      });
    }
  }

  return {
    id: opts.id,
    locationId: opts.locationId ?? null,
    name: opts.name,
    mode: 'zone-grid',
    width: opts.width,
    height: opts.height,
    cells,
    features: [],
    scale: { kind: 'zone' },
  };
}