/**
 * Phase 2 erase: single hit target per click. Priority: edge → object → path segment → linked location.
 * Does not consider cell fills (use clear-fill mode).
 */
import { makeUndirectedSquareEdgeKey } from '@/shared/domain/grid/gridEdgeIds';
import { parseGridCellId } from '@/shared/domain/grid/gridCellIds';

export type EraseDraftLike = {
  pathSegments: ReadonlyArray<{ id: string; startCellId: string; endCellId: string }>;
  edgeFeatures: ReadonlyArray<{ id: string; edgeId: string }>;
  objectsByCellId: Record<string, { id: string }[] | undefined>;
  linkedLocationByCellId: Record<string, string | undefined>;
};

export type EraseTarget =
  | { type: 'edge'; featureId: string }
  | { type: 'object'; cellId: string; objectId: string }
  | { type: 'path'; segmentId: string }
  | { type: 'link'; cellId: string }
  | null;

function pathSegmentsTouchingCell(draft: EraseDraftLike, cellId: string): { id: string }[] {
  const c = cellId.trim();
  return draft.pathSegments.filter((s) => s.startCellId === c || s.endCellId === c);
}

function edgeFeaturesOnCellEdges(
  draft: EraseDraftLike,
  cellId: string,
  columns: number,
  rows: number,
): { id: string; edgeId: string }[] {
  const p = parseGridCellId(cellId);
  if (!p) return [];
  const { x, y } = p;
  const neighbors: { ox: number; oy: number }[] = [
    { ox: x, oy: y - 1 },
    { ox: x + 1, oy: y },
    { ox: x, oy: y + 1 },
    { ox: x - 1, oy: y },
  ];
  const keys = new Set<string>();
  for (const { ox, oy } of neighbors) {
    if (ox < 0 || oy < 0 || ox >= columns || oy >= rows) continue;
    const oid = `${ox},${oy}`;
    keys.add(makeUndirectedSquareEdgeKey(cellId, oid));
  }
  return draft.edgeFeatures.filter((e) => keys.has(e.edgeId));
}

export function resolveEraseTargetAtCell(
  cellId: string,
  draft: EraseDraftLike,
  gridColumns: number,
  gridRows: number,
): EraseTarget {
  const edgesHere = edgeFeaturesOnCellEdges(draft, cellId, gridColumns, gridRows);
  if (edgesHere.length > 0) {
    return { type: 'edge', featureId: edgesHere[0].id };
  }
  const objs = draft.objectsByCellId[cellId];
  if (objs && objs.length > 0) {
    return { type: 'object', cellId, objectId: objs[objs.length - 1].id };
  }
  const paths = pathSegmentsTouchingCell(draft, cellId);
  if (paths.length > 0) {
    return { type: 'path', segmentId: paths[paths.length - 1].id };
  }
  const linked = draft.linkedLocationByCellId[cellId]?.trim();
  if (linked) {
    return { type: 'link', cellId };
  }
  return null;
}
