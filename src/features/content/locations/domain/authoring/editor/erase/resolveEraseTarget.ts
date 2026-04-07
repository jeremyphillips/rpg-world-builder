/**
 * Single-cell erase target. Priority: edge → object → path segment → linked location → cell fill → region.
 */
import { makeUndirectedSquareEdgeKey } from '@/shared/domain/grid/gridEdgeIds';
import { parseGridCellId } from '@/shared/domain/grid/gridCellIds';
import type { LocationMapCellFillSelection } from '@/shared/domain/locations';

export type EraseDraftLike = {
  pathEntries: ReadonlyArray<{ id: string; cellIds: readonly string[] }>;
  edgeEntries: ReadonlyArray<{ edgeId: string }>;
  objectsByCellId: Record<string, { id: string }[] | undefined>;
  linkedLocationByCellId: Record<string, string | undefined>;
  /** Sparse cell terrain fill; cleared in Erase mode when no higher-priority target. */
  cellFillByCellId?: Record<string, LocationMapCellFillSelection | undefined>;
  /** Sparse cell → region id (overlay). */
  regionIdByCellId?: Record<string, string | undefined>;
};

export type EraseTarget =
  | { type: 'edge'; edgeId: string }
  | { type: 'object'; cellId: string; objectId: string }
  | { type: 'path'; pathId: string; neighborCellId: string }
  | { type: 'link'; cellId: string }
  | { type: 'fill'; cellId: string }
  | { type: 'region'; cellId: string }
  | null;

function pathSegmentTouchingCell(
  draft: EraseDraftLike,
  cellId: string,
): { pathId: string; neighborCellId: string }[] {
  const c = cellId.trim();
  const out: { pathId: string; neighborCellId: string }[] = [];
  for (const p of draft.pathEntries) {
    const ids = p.cellIds;
    for (let i = 0; i < ids.length - 1; i++) {
      const a = ids[i].trim();
      const b = ids[i + 1].trim();
      if (a === c) out.push({ pathId: p.id, neighborCellId: b });
      else if (b === c) out.push({ pathId: p.id, neighborCellId: a });
    }
  }
  return out;
}

function edgeEntriesOnCellEdges(
  draft: EraseDraftLike,
  cellId: string,
  columns: number,
  rows: number,
): { edgeId: string }[] {
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
  return draft.edgeEntries.filter((e) => keys.has(e.edgeId));
}

/**
 * Resolve an erase target for a specific canonical edgeId.
 */
export function resolveEraseEdgeByEdgeId(
  edgeId: string,
  draft: Pick<EraseDraftLike, 'edgeEntries'>,
): EraseTarget {
  const hit = draft.edgeEntries.find((e) => e.edgeId === edgeId);
  if (hit) return { type: 'edge', edgeId };
  return null;
}

export type ResolveEraseTargetAtCellOptions = {
  /**
   * When true (e.g. hex maps), do not prioritize boundary edges — they are not rendered/selectable
   * on hex yet; avoids silently erasing stored `edgeEntries` without user-visible feedback.
   */
  skipEdgeTargets?: boolean;
};

export function resolveEraseTargetAtCell(
  cellId: string,
  draft: EraseDraftLike,
  gridColumns: number,
  gridRows: number,
  options?: ResolveEraseTargetAtCellOptions,
): EraseTarget {
  const edgesHere =
    options?.skipEdgeTargets === true
      ? []
      : edgeEntriesOnCellEdges(draft, cellId, gridColumns, gridRows);
  if (edgesHere.length > 0) {
    return { type: 'edge', edgeId: edgesHere[0].edgeId };
  }
  const objs = draft.objectsByCellId[cellId];
  if (objs && objs.length > 0) {
    return { type: 'object', cellId, objectId: objs[objs.length - 1].id };
  }
  const paths = pathSegmentTouchingCell(draft, cellId);
  if (paths.length > 0) {
    const last = paths[paths.length - 1];
    return { type: 'path', pathId: last.pathId, neighborCellId: last.neighborCellId };
  }
  const linked = draft.linkedLocationByCellId[cellId]?.trim();
  if (linked) {
    return { type: 'link', cellId };
  }
  const fill = draft.cellFillByCellId?.[cellId];
  if (
    fill != null &&
    typeof fill.familyId === 'string' &&
    fill.familyId.trim() !== '' &&
    typeof fill.variantId === 'string' &&
    fill.variantId.trim() !== ''
  ) {
    return { type: 'fill', cellId };
  }
  const regionId = draft.regionIdByCellId?.[cellId];
  if (regionId != null && String(regionId).trim() !== '') {
    return { type: 'region', cellId };
  }
  return null;
}
