/**
 * Renderer adapter only: authored `pathEntries` → SVG `<path d="...">` strings.
 * Canonical geometry lives in `@/shared/domain/locations/map/locationMapPathPolyline.helpers`
 * (`pathEntriesToPolylineGeometry`); this module applies Catmull-Rom smoothing for display.
 * Do not add grid math, persistence, or hex policy here.
 */
import type { Point2D } from '@/shared/domain/locations/map/locationMapGeometry.types';
import { pathEntriesToPolylineGeometry } from '@/shared/domain/locations/map/locationMapPathPolyline.helpers';
import type { LocationMapPathAuthoringEntry } from '@/shared/domain/locations/map/locationMap.types';
import type { LocationMapPathKindId } from '@/shared/domain/locations/map/locationMapPathFeature.constants';

type Point = { cx: number; cy: number };
type CenterFn = (cellId: string) => Point | null;

/** Map shared polyline points (x/y) to the cx/cy points expected by `chainToSmoothSvgPath`. */
export function polylinePoint2DToSmoothSvgPath(points: readonly Point2D[]): string {
  return chainToSmoothSvgPath(points.map((p) => ({ cx: p.x, cy: p.y })));
}

/**
 * Non-canonical adapter: polylines from `pathEntriesToPolylineGeometry` → SVG `d` attributes.
 */
export function pathEntriesToSvgPaths(
  pathEntries: readonly LocationMapPathAuthoringEntry[],
  centerFn: CenterFn,
): { kind: LocationMapPathKindId; d: string }[] {
  const polylines = pathEntriesToPolylineGeometry(pathEntries, centerFn);
  return polylines.map(({ kind, points }) => ({
    kind,
    d: polylinePoint2DToSmoothSvgPath(points),
  }));
}

/**
 * Convert a sequence of pixel points into an SVG path `d` attribute using
 * Catmull-Rom to cubic Bezier conversion for smooth curves.
 *
 * - 0-1 points: returns empty string
 * - 2 points: straight line (M ... L ...)
 * - 3+ points: smooth Catmull-Rom spline (M ... C ...)
 *
 * @param alpha Catmull-Rom tension (0 = uniform, 0.5 = centripetal, 1 = chordal). Default 0.5.
 */
export function chainToSmoothSvgPath(
  points: readonly Point[],
  alpha = 0.5,
): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M${r(points[0].cx)},${r(points[0].cy)} L${r(points[1].cx)},${r(points[1].cy)}`;
  }

  const pts = [
    mirrorPoint(points[0], points[1]),
    ...points,
    mirrorPoint(points[points.length - 1], points[points.length - 2]),
  ];

  const parts: string[] = [`M${r(points[0].cx)},${r(points[0].cy)}`];

  for (let i = 0; i < pts.length - 3; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const p2 = pts[i + 2];
    const p3 = pts[i + 3];
    const cp = catmullRomToBezier(p0, p1, p2, p3, alpha);
    parts.push(
      `C${r(cp.cp1x)},${r(cp.cp1y)} ${r(cp.cp2x)},${r(cp.cp2y)} ${r(p2.cx)},${r(p2.cy)}`,
    );
  }

  return parts.join(' ');
}

/**
 * Cubic Bézier (four control points P0–P3) at parameter t ∈ [0, 1].
 * Matches SVG cubic segment from P0 to P3 with off-curve P1, P2.
 */
function cubicBezierPoint(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number,
): Point2D {
  const u = 1 - t;
  const u2 = u * u;
  const u3 = u2 * u;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
  };
}

export type SampleSmoothPathForPickingOptions = {
  /** Catmull-Rom tension; must match {@link chainToSmoothSvgPath} (default 0.5). */
  alpha?: number;
  /** Samples per cubic segment (inclusive of endpoints); higher = tighter pick curve. */
  samplesPerBezierSegment?: number;
};

/**
 * Dense polyline that approximates the same smooth Catmull-Rom curve as {@link chainToSmoothSvgPath}.
 * Used for map picking so distance-to-stroke aligns with the visible SVG stroke, not the raw centerline.
 * Canonical authored data is unchanged; this is render-aware pick geometry only.
 */
export function sampleSmoothPathCenterlineForPicking(
  points: readonly Point2D[],
  options?: SampleSmoothPathForPickingOptions,
): Point2D[] {
  const alpha = options?.alpha ?? 0.5;
  const n = Math.max(2, Math.floor(options?.samplesPerBezierSegment ?? 10));
  if (points.length < 2) {
    return [];
  }
  if (points.length === 2) {
    return [points[0], points[1]];
  }
  const pts = points.map((p) => ({ cx: p.x, cy: p.y }));
  const extended = [
    mirrorPoint(pts[0], pts[1]),
    ...pts,
    mirrorPoint(pts[pts.length - 1], pts[pts.length - 2]),
  ];
  const out: Point2D[] = [];
  const eps = 1e-9;
  const pushPoint = (p: Point2D) => {
    const last = out[out.length - 1];
    if (!last || (last.x - p.x) ** 2 + (last.y - p.y) ** 2 > eps) {
      out.push(p);
    }
  };
  for (let i = 0; i < extended.length - 3; i++) {
    const p0 = extended[i];
    const p1 = extended[i + 1];
    const p2 = extended[i + 2];
    const p3 = extended[i + 3];
    const cp = catmullRomToBezier(p0, p1, p2, p3, alpha);
    const start = { x: p1.cx, y: p1.cy };
    const c1 = { x: cp.cp1x, y: cp.cp1y };
    const c2 = { x: cp.cp2x, y: cp.cp2y };
    const end = { x: p2.cx, y: p2.cy };
    for (let s = 0; s <= n; s++) {
      const t = s / n;
      const pt = cubicBezierPoint(start, c1, c2, end, t);
      pushPoint(pt);
    }
  }
  return out;
}

function mirrorPoint(anchor: Point, other: Point): Point {
  return { cx: 2 * anchor.cx - other.cx, cy: 2 * anchor.cy - other.cy };
}

function catmullRomToBezier(
  p0: Point, p1: Point, p2: Point, p3: Point, alpha: number,
): { cp1x: number; cp1y: number; cp2x: number; cp2y: number } {
  const d1 = Math.hypot(p1.cx - p0.cx, p1.cy - p0.cy);
  const d2 = Math.hypot(p2.cx - p1.cx, p2.cy - p1.cy);
  const d3 = Math.hypot(p3.cx - p2.cx, p3.cy - p2.cy);

  const d1a = Math.pow(d1, alpha);
  const d2a = Math.pow(d2, alpha);
  const d3a = Math.pow(d3, alpha);
  const d1_2a = Math.pow(d1, 2 * alpha);
  const d2_2a = Math.pow(d2, 2 * alpha);
  const d3_2a = Math.pow(d3, 2 * alpha);

  const denom1 = 3 * d1a * (d1a + d2a);
  const denom2 = 3 * d3a * (d3a + d2a);

  const cp1x = denom1 > 0
    ? (d1_2a * p2.cx - d2_2a * p0.cx + (2 * d1_2a + 3 * d1a * d2a + d2_2a) * p1.cx) / denom1
    : p1.cx;
  const cp1y = denom1 > 0
    ? (d1_2a * p2.cy - d2_2a * p0.cy + (2 * d1_2a + 3 * d1a * d2a + d2_2a) * p1.cy) / denom1
    : p1.cy;

  const cp2x = denom2 > 0
    ? (d3_2a * p1.cx - d2_2a * p3.cx + (2 * d3_2a + 3 * d3a * d2a + d2_2a) * p2.cx) / denom2
    : p2.cx;
  const cp2y = denom2 > 0
    ? (d3_2a * p1.cy - d2_2a * p3.cy + (2 * d3_2a + 3 * d3a * d2a + d2_2a) * p2.cy) / denom2
    : p2.cy;

  return { cp1x, cp1y, cp2x, cp2y };
}

function r(n: number): string {
  return Number(n.toFixed(2)).toString();
}
