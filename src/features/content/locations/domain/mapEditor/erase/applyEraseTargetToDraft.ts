import { removePathChainSegment } from '@/shared/domain/locations/map/locationMapPathAuthoring.helpers';
import type { LocationMapPathAuthoringEntry } from '@/shared/domain/locations';

import type { EraseTarget } from './resolveEraseTarget';

/**
 * Draft fields mutated by erase / “remove this feature” operations.
 * Compatible with {@link LocationGridDraftState} from the location editor.
 */
export type ErasableMapDraft = {
  pathEntries: readonly LocationMapPathAuthoringEntry[];
  edgeEntries: ReadonlyArray<{ edgeId: string }>;
  objectsByCellId: Record<string, { id: string }[] | undefined>;
  linkedLocationByCellId: Record<string, string | undefined>;
  cellFillByCellId: Record<string, string | undefined>;
  regionIdByCellId: Record<string, string | undefined>;
};

/**
 * Applies a resolved {@link EraseTarget} (same semantics as Erase tool on a cell).
 *
 * @param pathSegmentAnchorCellId — Cell id passed to {@link removePathChainSegment} for `path`
 *   targets (the clicked cell in erase mode).
 */
export function applyEraseTargetToDraft<D extends ErasableMapDraft>(
  prev: D,
  target: Exclude<EraseTarget, null>,
  pathSegmentAnchorCellId: string,
  newUuid: () => string,
): D {
  if (target.type === 'edge') {
    return {
      ...prev,
      edgeEntries: prev.edgeEntries.filter((e) => e.edgeId !== target.edgeId),
    };
  }
  if (target.type === 'object') {
    const objs = prev.objectsByCellId[target.cellId] ?? [];
    const nextObjs = objs.filter((o) => o.id !== target.objectId);
    const nextMap = { ...prev.objectsByCellId };
    if (nextObjs.length === 0) delete nextMap[target.cellId];
    else nextMap[target.cellId] = nextObjs;
    return { ...prev, objectsByCellId: nextMap };
  }
  if (target.type === 'path') {
    return {
      ...prev,
      pathEntries: removePathChainSegment(
        prev.pathEntries,
        target.pathId,
        pathSegmentAnchorCellId,
        target.neighborCellId,
        newUuid,
      ),
    };
  }
  if (target.type === 'fill') {
    const cellId = target.cellId;
    const nextFill = { ...prev.cellFillByCellId };
    delete nextFill[cellId];
    return { ...prev, cellFillByCellId: nextFill };
  }
  if (target.type === 'region') {
    const cellId = target.cellId;
    const nextRegion = { ...prev.regionIdByCellId };
    delete nextRegion[cellId];
    return { ...prev, regionIdByCellId: nextRegion };
  }
  const nextLinks = { ...prev.linkedLocationByCellId };
  delete nextLinks[target.cellId];
  return { ...prev, linkedLocationByCellId: nextLinks };
}
