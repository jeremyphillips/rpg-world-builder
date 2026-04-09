/**
 * Authored map cell objects → encounter {@link GridObject} hydration.
 *
 * **Stairs:** Registry defaults make stairs **non-blocking** so tokens can occupy the stair cell;
 * vertical traversal is driven by session/orchestration + canonical stair links, not by blocking props.
 * Optional `stairEndpoint` on {@link LocationMapCellObjectEntry} is for authoring/linking only here.
 *
 * **Cell blocking:** When any grid object on a cell has `blocksMovement`, the cell may be aligned to
 * blocking flags for movement / AoE checks. Long-term, blocking/LoS may be derived from grid objects +
 * edges + terrain in a dedicated pass — do not treat this merge as the final source of truth.
 */

import { buildGridObjectFromAuthoredPlacedObject } from '@/features/mechanics/domain/combat/space/gridObject/gridObject.fromAuthored';
import type { EncounterCell, GridObject } from '@/features/mechanics/domain/combat/space/space.types';
import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry';
import { parseLocationPlacedObjectKindId } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.selectors.core';
import type { LocationMapBase, LocationMapCellObjectEntry } from '@/shared/domain/locations/map/locationMap.types';

import { authorCellIdToCombatCellId } from './encounterMapCellIds';

/**
 * Resolves palette / runtime kind from persisted map cell object data.
 * Prefer stored `authoredPlaceKindId`; otherwise infer only from non-ambiguous persisted `kind` (see switch).
 */
export function inferAuthoredPlaceKindFromMapCellObject(o: LocationMapCellObjectEntry): LocationPlacedObjectKindId | null {
  const stored = parseLocationPlacedObjectKindId(o.authoredPlaceKindId);
  if (stored) return stored;

  switch (o.kind) {
    case 'stairs':
      return 'stairs';
    case 'treasure':
      return 'treasure';
    case 'table':
      return 'table';
    case 'door':
    case 'marker':
      return null;
    default:
      return null;
  }
}

/**
 * Builds {@link GridObject} rows from `map.cellEntries` using {@link buildGridObjectFromAuthoredPlacedObject}.
 */
export function buildGridObjectsFromLocationMapCellEntries(map: LocationMapBase): GridObject[] {
  const out: GridObject[] = [];
  const seenIds = new Set<string>();

  for (const row of map.cellEntries ?? []) {
    const combatCellId = authorCellIdToCombatCellId(row.cellId);
    for (const obj of row.objects ?? []) {
      const authoredPlaceKindId = inferAuthoredPlaceKindFromMapCellObject(obj);
      if (!authoredPlaceKindId) continue;

      const id = `go-${map.id}-${combatCellId}-${obj.id}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      out.push(
        buildGridObjectFromAuthoredPlacedObject({
          id,
          cellId: combatCellId,
          authoredPlaceKindId,
        }),
      );
    }
  }

  return out;
}

/**
 * **Transitional:** For each cell that hosts at least one grid object with `blocksMovement`, align
 * {@link EncounterCell} flags so movement / AoE
 * origin checks stay consistent. Does not downgrade cells already marked blocking for other reasons.
 */
export function applyEncounterCellBlockingFlagsForAuthoredGridObjects(
  cells: EncounterCell[],
  gridObjects: GridObject[],
): EncounterCell[] {
  const blockMovementByCell = new Map<string, boolean>();
  for (const o of gridObjects) {
    if (!o.blocksMovement) continue;
    blockMovementByCell.set(o.cellId, true);
  }

  return cells.map((cell) => {
    if (!blockMovementByCell.get(cell.id)) return cell;
    if (cell.kind === 'blocking') return cell;
    return {
      ...cell,
      kind: 'blocking',
      blocksMovement: true,
      blocksSight: true,
      blocksProjectiles: true,
    };
  });
}
