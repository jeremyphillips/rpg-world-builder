import type { Location } from '@/features/content/locations/domain/types';
import { listLocationMaps } from '@/features/content/locations/domain/repo/locationMapRepo';
import type { EncounterState } from '@/features/mechanics/domain/combat';
import type { StairTraversalIntent } from '@/features/mechanics/domain/combat';
import type { GridObject } from '@/features/mechanics/domain/combat/space/space.types';
import { getCellForCombatant } from '@/features/mechanics/domain/combat/space/space.helpers';
import type { LocationMapBase, LocationMapCellObjectEntry } from '@/shared/domain/locations/map/locationMap.types';
import type { LocationVerticalStairConnection } from '@/shared/domain/locations/building/locationBuildingStairConnection.types';
import { authorCellIdToCombatCellId, combatCellIdToAuthorCellId } from '@/shared/domain/locations/map/locationMapCombatCellIds';
import { resolveStairPlayTraversalFromCellObjects } from '@/shared/domain/locations/building/locationBuildingStairTraversalPlay.helpers';
import { STAIR_TRAVERSAL_MOVEMENT_COST_FT } from '@/shared/domain/locations/transitions/stairTraversal.constants';
import type { GameSession } from '../domain/game-session.types';
import { buildEncounterSpaceFromLocationMap } from './buildEncounterSpaceFromLocationMap';
import {
  buildFallbackEncounterSpaceContainingCell,
  pickEncounterGridMap,
  pickEncounterGridMapForSpace,
} from './encounterSpaceResolution';

/**
 * Composite id from {@link buildGridObjectsFromLocationMapCellEntries}: `go-{mapId}-{combatCellId}-{objectId}`.
 * Map id may contain dashes; locate the authored object id by the combat cell segment.
 */
function parseAuthoredObjectIdFromGridObjectId(gridObjectId: string, combatCellId: string): string | null {
  const needle = `-${combatCellId}-`;
  const idx = gridObjectId.indexOf(needle);
  if (idx === -1) return null;
  const rest = gridObjectId.slice(idx + needle.length);
  return rest.length > 0 ? rest : null;
}

function resolveBuildingStairConnections(
  locations: Location[],
  session: GameSession,
  encounterFloorLocationId: string | undefined,
): readonly LocationVerticalStairConnection[] | undefined {
  const findBuilding = (id: string | undefined | null): Location | undefined => {
    if (!id?.trim()) return undefined;
    return locations.find((l) => l.id === id && l.scale === 'building');
  };

  let building =
    findBuilding(session.location.buildingId) ?? findBuilding(session.location.locationId ?? null);

  if (!building && session.location.locationId) {
    const loc = locations.find((l) => l.id === session.location.locationId);
    if (loc?.scale === 'floor' && loc.parentId) {
      building = findBuilding(loc.parentId);
    }
  }
  if (!building && encounterFloorLocationId) {
    const floor = locations.find((l) => l.id === encounterFloorLocationId && l.scale === 'floor');
    if (floor?.parentId) {
      building = findBuilding(floor.parentId);
    }
  }

  return building?.buildingProfile?.stairConnections;
}

function objectsOnCellForAuthorCell(
  map: LocationMapBase,
  authorCellId: string,
): LocationMapCellObjectEntry[] | undefined {
  const key = authorCellId.trim();
  const row = map.cellEntries?.find((e) => e.cellId.trim() === key);
  return row?.objects;
}

function isGridObjectStairs(g: GridObject): boolean {
  if (g.authoredPlaceKindId === 'stairs') return true;
  return g.interaction?.role === 'transition' && g.interaction.transitionKind === 'stairs';
}

function resolveStairsObjectsOnCell(
  map: LocationMapBase | undefined,
  authorCellId: string,
  combatCellId: string,
  encounterGridObjects: GridObject[] | undefined,
): readonly LocationMapCellObjectEntry[] | undefined {
  const fromEntries = map ? objectsOnCellForAuthorCell(map, authorCellId) : undefined;
  if (fromEntries?.some((o) => o.kind === 'stairs')) {
    return fromEntries;
  }
  const gridStair = encounterGridObjects?.find((g) => g.cellId === combatCellId && isGridObjectStairs(g));
  if (!gridStair) return fromEntries;
  const oid = parseAuthoredObjectIdFromGridObjectId(gridStair.id, combatCellId);
  if (!oid) return fromEntries;
  return [{ id: oid, kind: 'stairs' as const }];
}

/**
 * Assembles a {@link StairTraversalIntent} from session + encounter state using canonical stair links.
 * Requires the active combatant to **stand on the stair endpoint cell** (not an adjacent interaction).
 * Does not apply mechanics — caller dispatches via `applyCombatIntent`.
 *
 * TODO: Multi-floor pathfinding and automatic route preview across floors are not implemented (Phase 4).
 */
export async function resolveGameSessionStairTraversalPayload(args: {
  campaignId: string;
  session: GameSession;
  locations: Location[];
  encounterState: EncounterState | null;
}): Promise<
  | { ok: true; intent: StairTraversalIntent; destinationFloorLabel: string }
  | { ok: false; reason: string }
> {
  const { campaignId, session, locations, encounterState } = args;

  if (!encounterState?.space || !encounterState.placements?.length || !encounterState.activeCombatantId) {
    return { ok: false, reason: 'no encounter' };
  }

  const floorLocationId = encounterState.space.locationId;
  if (!floorLocationId) {
    return { ok: false, reason: 'no floor location on tactical space' };
  }

  const connections = resolveBuildingStairConnections(locations, session, floorLocationId);
  if (!connections?.length) {
    return { ok: false, reason: 'no stair connections' };
  }

  const combatCellId = getCellForCombatant(
    encounterState.placements,
    encounterState.activeCombatantId,
    encounterState.space,
  );
  if (!combatCellId) {
    return { ok: false, reason: 'combatant not on grid' };
  }

  const authorCellId = combatCellIdToAuthorCellId(combatCellId);
  if (!authorCellId) {
    return { ok: false, reason: 'invalid combat cell' };
  }

  const maps = await listLocationMaps(campaignId, floorLocationId);
  const chosen =
    pickEncounterGridMapForSpace(maps, encounterState.space.id) ?? pickEncounterGridMap(maps);
  /** Without a map we can still detect stairs from persisted {@link EncounterState.space.gridObjects}. */
  if (!chosen && !(encounterState.space.gridObjects?.length)) {
    return { ok: false, reason: 'no encounter map for current floor' };
  }

  const objectsOnCell = resolveStairsObjectsOnCell(
    chosen ?? undefined,
    authorCellId,
    combatCellId,
    encounterState.space.gridObjects,
  );
  const resolution = resolveStairPlayTraversalFromCellObjects(
    connections,
    floorLocationId,
    authorCellId,
    objectsOnCell,
  );

  if (resolution.kind !== 'ok') {
    return { ok: false, reason: 'stair not linked or not on stair cell' };
  }

  const { counterpart } = resolution;
  const destFloorId = counterpart.floorLocationId;

  const destinationCellId = authorCellIdToCombatCellId(counterpart.cellId);
  if (!destinationCellId) {
    return { ok: false, reason: 'invalid destination stair cell' };
  }

  const destMaps = await listLocationMaps(campaignId, destFloorId);
  const destMap = pickEncounterGridMap(destMaps);
  const destinationEncounterSpace = destMap
    ? buildEncounterSpaceFromLocationMap({
        mapHostLocationId: destFloorId,
        map: destMap,
      })
    : buildFallbackEncounterSpaceContainingCell({
        id: `stair-dest-fallback-${destFloorId}`,
        name: 'Destination floor',
        locationId: destFloorId,
        combatCellId: destinationCellId,
      });

  const intent: StairTraversalIntent = {
    kind: 'stair-traversal',
    combatantId: encounterState.activeCombatantId,
    connectionId: resolution.connectionId,
    sourceFloorLocationId: floorLocationId,
    destinationFloorLocationId: destFloorId,
    destinationCellId,
    movementCostFt: STAIR_TRAVERSAL_MOVEMENT_COST_FT,
    destinationEncounterSpace,
  };

  const destinationFloorLabel = locations.find((l) => l.id === destFloorId)?.name ?? 'Destination floor';

  return { ok: true, intent, destinationFloorLabel };
}
