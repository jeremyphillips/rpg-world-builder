import type { PlacedObjectFootprintFeet } from './placedObjectFootprint.types';

export type PlacedObjectFootprintLayoutPx = {
  widthPx: number;
  heightPx: number;
};

/**
 * Upper bound on how many **cell widths** the footprint layout box may span on its **major axis**
 * (longer of width/depth for rects, diameter for circles). Prevents absurd sizes from bad registry data.
 */
export const PLACED_OBJECT_FOOTPRINT_MAX_EXTENT_CELLS = 6;

/**
 * World-units → “how many cells” the major axis spans (fractional allowed). Used for layout cap only.
 */
export function footprintMajorAxisSpanInCells(
  footprint: PlacedObjectFootprintFeet,
  feetPerCell: number,
): number {
  if (!(feetPerCell > 0)) return 1;
  if (footprint.kind === 'rect') {
    return Math.max(footprint.widthFt, footprint.depthFt) / feetPerCell;
  }
  return footprint.diameterFt / feetPerCell;
}

/**
 * Maximum pixel size allowed for the **larger** side of the axis-aligned footprint layout box.
 *
 * **Policy:** `maxExtentPx` scales with registry feet so a 10 ft-wide object on a 5 ft/cell grid can use
 * **two cells** of width (~`2 * cellPx`) instead of shrinking everything to a single `cellPx`. Values are
 * clamped by {@link PLACED_OBJECT_FOOTPRINT_MAX_EXTENT_CELLS}.
 *
 * **Interactive / UX caveat (callers):** larger layout boxes draw **raster overflow** into neighboring
 * cells (DOM still lives under the anchor cell). Hit-testing, selection, and z-order remain **cell-centric**;
 * overlapping art can make clicks ambiguous or obscure adjacent content. See `placed-objects-flow.md`.
 */
export function computePlacedObjectFootprintMaxExtentPx(args: {
  footprint: PlacedObjectFootprintFeet;
  feetPerCell: number;
  cellPx: number;
}): number {
  const { footprint, feetPerCell, cellPx } = args;
  if (!(feetPerCell > 0) || !(cellPx > 0)) return cellPx;
  const spanCells = footprintMajorAxisSpanInCells(footprint, feetPerCell);
  const capped = Math.min(
    PLACED_OBJECT_FOOTPRINT_MAX_EXTENT_CELLS,
    Math.max(1, spanCells),
  );
  return cellPx * capped;
}

/**
 * Converts registry footprint (feet) + **feet per cell** + **cell pixel size** → axis-aligned layout box (pixels).
 * **Square grid only**; hex is out of scope (caller should not pass hex-derived `cellPx` as authoritative span).
 *
 * - Rect: width along local X, depth along local Y (map to screen consistently — both axes use same px/ft scale).
 * - Circle: bounding square of **diameter** × **diameter** in px.
 *
 * When the footprint’s **larger** pixel axis exceeds `maxExtentPx`, scales **uniformly** so that axis fits
 * `maxExtentPx`, preserving aspect ratio. Authoring typically passes
 * {@link computePlacedObjectFootprintMaxExtentPx} for `maxExtentPx` so multi-cell footprints are not
 * over-shrunk; tests may pass a fixed `maxExtentPx` to exercise scaling.
 */
export function resolvePlacedObjectFootprintLayoutPx(args: {
  footprint: PlacedObjectFootprintFeet;
  feetPerCell: number;
  cellPx: number;
  /**
   * Cap on the layout box’s **larger** axis (px). Prefer {@link computePlacedObjectFootprintMaxExtentPx}
   * for production so extent grows with footprint span in cells.
   */
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
