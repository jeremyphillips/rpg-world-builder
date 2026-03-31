import type { LocationMapPathAuthoringEntry } from './locationMap.types';
import type { LocationMapPathKindId } from './locationMapPathFeature.constants';

/** Pixel-space point along an authored path centerline (not SVG). */
export type PathCenterlinePoint = { cx: number; cy: number };

export type PathCenterlineChain = {
  kind: LocationMapPathKindId;
  points: PathCenterlinePoint[];
};

/**
 * Resolve cell centers for one path entry. Skips cells `centerFn` returns null for.
 */
export function pathEntryToCenterlinePoints(
  entry: LocationMapPathAuthoringEntry,
  centerFn: (cellId: string) => PathCenterlinePoint | null,
): PathCenterlinePoint[] {
  const points: PathCenterlinePoint[] = [];
  for (const cellId of entry.cellIds) {
    const pt = centerFn(cellId);
    if (pt) points.push(pt);
  }
  return points;
}

/**
 * Per authored path chain, ordered cell-center points in pixel space (no SVG / smoothing).
 * Chains with fewer than two resolved points are omitted.
 */
export function pathEntriesToCenterlinePoints(
  pathEntries: readonly LocationMapPathAuthoringEntry[],
  centerFn: (cellId: string) => PathCenterlinePoint | null,
): PathCenterlineChain[] {
  const out: PathCenterlineChain[] = [];
  for (const entry of pathEntries) {
    const points = pathEntryToCenterlinePoints(entry, centerFn);
    if (points.length >= 2) {
      out.push({ kind: entry.kind, points });
    }
  }
  return out;
}
