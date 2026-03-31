/**
 * Square-grid only: derived "edge run" selection for Select mode.
 *
 * Persistence stays atomic per boundary; this module groups contiguous same-kind
 * segments on one straight boundary line for inspection. Hex edge-run grouping
 * is intentionally not implemented.
 */
import type { LocationMapEdgeAuthoringEntry } from '@/shared/domain/locations';

import {
  getSquareEdgeOrientationFromEdgeId,
  squareEdgeBoundaryIndex,
  squareEdgeRunningIndex,
  type EdgeOrientation,
} from './edgeAuthoring';

export type SquareEdgeRunSelectionPayload = {
  kind: LocationMapEdgeAuthoringEntry['kind'];
  edgeIds: string[];
  axis: EdgeOrientation;
  anchorEdgeId: string;
};

/**
 * From a clicked square boundary `edgeId`, walk along the same boundary line and
 * orientation as stroke authoring: same kind, same boundary index, contiguous
 * running index. Corners and kind changes break the run.
 *
 * Returns stable `edgeIds` ordered by running index (ascending along the line).
 */
export function deriveSquareEdgeRunSelection(
  anchorEdgeId: string,
  edgeEntries: readonly LocationMapEdgeAuthoringEntry[],
): SquareEdgeRunSelectionPayload | null {
  const anchorEntry = edgeEntries.find((e) => e.edgeId === anchorEdgeId);
  if (!anchorEntry) return null;

  const orientation = getSquareEdgeOrientationFromEdgeId(anchorEdgeId);
  if (!orientation) return null;

  const boundary = squareEdgeBoundaryIndex(anchorEdgeId, orientation);
  if (boundary == null) return null;

  const anchorRun = squareEdgeRunningIndex(anchorEdgeId, orientation);
  if (anchorRun == null) return null;

  const kind = anchorEntry.kind;

  const byRunIndex = new Map<number, string>();
  for (const e of edgeEntries) {
    if (e.kind !== kind) continue;
    const o = getSquareEdgeOrientationFromEdgeId(e.edgeId);
    if (o !== orientation) continue;
    if (squareEdgeBoundaryIndex(e.edgeId, orientation) !== boundary) continue;
    const r = squareEdgeRunningIndex(e.edgeId, orientation);
    if (r == null) continue;
    if (!byRunIndex.has(r)) {
      byRunIndex.set(r, e.edgeId);
    }
  }

  if (!byRunIndex.has(anchorRun)) return null;

  const leftRuns: number[] = [];
  let r = anchorRun - 1;
  while (byRunIndex.has(r)) {
    leftRuns.unshift(r);
    r -= 1;
  }

  const rightRuns: number[] = [];
  r = anchorRun + 1;
  while (byRunIndex.has(r)) {
    rightRuns.push(r);
    r += 1;
  }

  const orderedRuns = [...leftRuns, anchorRun, ...rightRuns];
  const edgeIds = orderedRuns.map((idx) => byRunIndex.get(idx)!);

  return {
    kind,
    edgeIds,
    axis: orientation,
    anchorEdgeId: anchorEdgeId,
  };
}
