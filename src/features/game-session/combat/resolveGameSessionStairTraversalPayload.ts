import type { Location } from '@/features/content/locations/domain/types';
import { listLocationMaps } from '@/features/content/locations/domain/repo/locationMapRepo';
import type { EncounterState } from '@/features/mechanics/domain/combat';
import type { StairTraversalIntent } from '@/features/mechanics/domain/combat';
import { getCellForCombatant } from '@/features/mechanics/domain/combat/space/space.helpers';
import { authorCellIdToCombatCellId, combatCellIdToAuthorCellId } from '@/shared/domain/locations/map/locationMapCombatCellIds';
import { resolveStairPlayTraversalFromCellObjects } from '@/shared/domain/locations/building/locationBuildingStairTraversalPlay.helpers';
import { STAIR_TRAVERSAL_MOVEMENT_COST_FT } from '@/shared/domain/locations/transitions/stairTraversal.constants';
import type { GameSession } from '../domain/game-session.types';
import { buildEncounterSpaceFromLocationMap } from './buildEncounterSpaceFromLocationMap';
import { pickEncounterGridMap } from './encounterSpaceResolution';

/**
 * Assembles a {@link StairTraversalIntent} from session + encounter state using canonical stair links.
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

  const buildingId = session.location.buildingId ?? session.location.locationId;
  if (!buildingId) {
    return { ok: false, reason: 'no building context' };
  }

  const building = locations.find((l) => l.id === buildingId && l.scale === 'building');
  const connections = building?.buildingProfile?.stairConnections;
  if (!connections?.length) {
    return { ok: false, reason: 'no stair connections' };
  }

  const floorLocationId = encounterState.space.locationId;
  if (!floorLocationId) {
    return { ok: false, reason: 'no floor location on tactical space' };
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
  const chosen = pickEncounterGridMap(maps);
  if (!chosen) {
    return { ok: false, reason: 'no encounter map for current floor' };
  }

  const cellEntry = chosen.cellEntries?.find((e) => e.cellId === authorCellId);
  const resolution = resolveStairPlayTraversalFromCellObjects(
    connections,
    floorLocationId,
    authorCellId,
    cellEntry?.objects,
  );

  if (resolution.kind !== 'ok') {
    return { ok: false, reason: 'stair not linked or not on stair cell' };
  }

  const { counterpart } = resolution;
  const destFloorId = counterpart.floorLocationId;

  const destMaps = await listLocationMaps(campaignId, destFloorId);
  const destMap = pickEncounterGridMap(destMaps);
  if (!destMap) {
    return { ok: false, reason: 'no encounter map for destination floor' };
  }

  const destinationEncounterSpace = buildEncounterSpaceFromLocationMap({
    mapHostLocationId: destFloorId,
    map: destMap,
  });

  const destinationCellId = authorCellIdToCombatCellId(counterpart.cellId);

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
