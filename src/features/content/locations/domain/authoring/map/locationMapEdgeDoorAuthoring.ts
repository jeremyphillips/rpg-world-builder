import type { LocationMapEdgeAuthoringEntry } from '@/shared/domain/locations';
import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry';
import { parseLocationPlacedObjectKindId } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.selectors.core';

/**
 * True when this edge row resolves to a **door** instance (same rules as {@link resolveAuthoredEdgeInstance}).
 */
export function isLocationMapEdgeEntryDoorInstance(entry: LocationMapEdgeAuthoringEntry): boolean {
  const parsedAuthored = parseLocationPlacedObjectKindId(entry.authoredPlaceKindId);
  const fromKind: LocationPlacedObjectKindId | null =
    entry.kind === 'door' || entry.kind === 'window' ? entry.kind : null;
  const placedKind: LocationPlacedObjectKindId | null = parsedAuthored ?? fromKind;
  return placedKind === 'door';
}
