import type { EdgeSegmentGeometry, LineSegment2D, PathPolylineGeometry, Point2D } from '@/shared/domain/locations/map/locationMapGeometry.types';
import { sampleSmoothPathCenterlineForPicking } from '@/features/content/locations/components/pathOverlayRendering';

/**
 * Squared distance from P to the closest point on segment AB (clamped to the segment).
 * Used for edge/path picking without sqrt until comparing candidates.
 */
export function distancePointToSegmentSquared(
  px: number,
  py: number,
  seg: LineSegment2D,
): number {
  const { x1, y1, x2, y2 } = seg;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) {
    const ddx = px - x1;
    const ddy = py - y1;
    return ddx * ddx + ddy * ddy;
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const qx = x1 + t * dx;
  const qy = y1 + t * dy;
  const ddx = px - qx;
  const ddy = py - qy;
  return ddx * ddx + ddy * ddy;
}

function distancePointToPolylineSquared(px: number, py: number, points: Point2D[]): number {
  if (points.length < 2) {
    return Number.POSITIVE_INFINITY;
  }
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const d = distancePointToSegmentSquared(px, py, { x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    if (d < best) {
      best = d;
    }
  }
  return best;
}

/** Default half-width of committed edge strokes in the map overlay (see LocationGridAuthoringSection). */
export const DEFAULT_EDGE_PICK_HALF_WIDTH_PX = 10;

/**
 * Max distance (px) from pointer to the **sampled smooth** stroke used for picking.
 * Kept moderate: wide enough for the visible stroke, not so wide that it steals object/cell hits.
 */
export const DEFAULT_PATH_PICK_TOLERANCE_PX = 12;

/**
 * Nearest authored edge to a pointer in grid-local pixel coordinates (square grid only).
 */
export function resolveNearestEdgeHit(
  localX: number,
  localY: number,
  edges: readonly EdgeSegmentGeometry[],
  maxDistancePx: number,
): { edgeId: string } | null {
  if (edges.length === 0) return null;
  const maxSq = maxDistancePx * maxDistancePx;
  let bestId: string | null = null;
  let bestD = maxSq;
  for (const e of edges) {
    const d = distancePointToSegmentSquared(localX, localY, e.segment);
    if (d <= bestD) {
      bestD = d;
      bestId = e.edgeId;
    }
  }
  return bestId != null ? { edgeId: bestId } : null;
}

/**
 * Nearest authored path chain to a pointer (grid-local pixel space).
 * Uses {@link sampleSmoothPathCenterlineForPicking} so distance matches the visible smoothed stroke,
 * not the raw centerline polyline alone.
 */
export function resolveNearestPathHit(
  localX: number,
  localY: number,
  paths: readonly PathPolylineGeometry[],
  maxDistancePx: number,
): { pathId: string } | null {
  if (paths.length === 0) {
    return null;
  }
  const maxSq = maxDistancePx * maxDistancePx;
  let bestId: string | null = null;
  let bestD = maxSq;
  for (const p of paths) {
    const pickPoints = sampleSmoothPathCenterlineForPicking(p.points);
    const d = distancePointToPolylineSquared(localX, localY, pickPoints);
    if (d <= bestD) {
      bestD = d;
      bestId = p.id;
    }
  }
  return bestId != null ? { pathId: bestId } : null;
}
