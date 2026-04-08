import type { PlacedObjectFootprintFeet } from './placedObjectFootprint.types';

export type PlacedObjectFootprintLayoutPx = {
  widthPx: number;
  heightPx: number;
};

/**
 * Converts registry footprint (feet) + **feet per cell** + **cell pixel size** → axis-aligned layout box (pixels).
 * **Square grid only**; hex is out of scope (caller should not pass hex-derived `cellPx` as authoritative span).
 *
 * - Rect: width along local X, depth along local Y (map to screen consistently — both axes use same px/ft scale).
 * - Circle: bounding square of **diameter** × **diameter** in px.
 *
 * When the footprint would exceed the cell, scales **uniformly** so the larger axis fits `maxExtentPx`
 * (typically `cellPx`), preserving aspect ratio.
 */
export function resolvePlacedObjectFootprintLayoutPx(args: {
  footprint: PlacedObjectFootprintFeet;
  feetPerCell: number;
  cellPx: number;
  /** Cap so sprites do not overflow the cell box (Phase 3 simple policy). */
  maxExtentPx: number;
}): PlacedObjectFootprintLayoutPx {
  const { footprint, feetPerCell, cellPx, maxExtentPx } = args;
  if (!(feetPerCell > 0) || !(cellPx > 0) || !(maxExtentPx > 0)) {
    return { widthPx: 0, heightPx: 0 };
  }
  let widthPx: number;
  let heightPx: number;
  if (footprint.kind === 'rect') {
    widthPx = (footprint.widthFt / feetPerCell) * cellPx;
    heightPx = (footprint.depthFt / feetPerCell) * cellPx;
  } else {
    const d = (footprint.diameterFt / feetPerCell) * cellPx;
    widthPx = d;
    heightPx = d;
  }
  const maxDim = Math.max(widthPx, heightPx, 1);
  if (maxDim <= maxExtentPx) {
    return { widthPx, heightPx };
  }
  const s = maxExtentPx / maxDim;
  return { widthPx: widthPx * s, heightPx: heightPx * s };
}
