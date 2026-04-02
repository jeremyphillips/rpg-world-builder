import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/mapContent/locationPlacedObject.types';
import { resolveLocationPlacedObjectKindRuntimeDefaults } from '@/features/content/locations/domain/mapContent/locationPlacedObject.runtime';

import type { GridObject } from '../space.types';

/**
 * Hydrates a {@link GridObject} from authored map placement: sets `authoredPlaceKindId` and applies
 * combat/runtime fields via {@link resolveLocationPlacedObjectKindRuntimeDefaults} only.
 *
 * **Bridge contract:** UI labels, icons, and `linkedScale` remain in `LOCATION_PLACED_OBJECT_KIND_META` only;
 * do not copy them onto `GridObject`. Procedural-only props use `defaultsForProceduralKind` and `proceduralPlacementKind`.
 */
export function buildGridObjectFromAuthoredPlacedObject(input: {
  id: string;
  cellId: string;
  authoredPlaceKindId: LocationPlacedObjectKindId;
}): GridObject {
  const runtime = resolveLocationPlacedObjectKindRuntimeDefaults(input.authoredPlaceKindId);
  return {
    id: input.id,
    cellId: input.cellId,
    authoredPlaceKindId: input.authoredPlaceKindId,
    ...runtime,
  };
}
