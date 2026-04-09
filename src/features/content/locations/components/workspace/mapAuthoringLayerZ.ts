/**
 * Single source of truth for location map authoring overlay z-indices (square + hex).
 *
 * Paint order (low → high): terrain fills → square paths/edges → cell grid chrome →
 * hex path splines (above cells) → global placed-object glyphs → hex region hull outlines.
 *
 * Square reserves {@link MAP_AUTHORING_LAYER_Z.hexPathsOverGrid} as an empty slot so
 * {@link MAP_AUTHORING_LAYER_Z.globalPlacedObjects} matches hex without duplicating constants.
 */
export const MAP_AUTHORING_LAYER_Z = {
  /** Square terrain-only CSS grid (cell swatches); pointer-events none. */
  terrain: 0,
  /** Square: committed paths + edges + boundary-paint preview SVG. */
  squarePathsAndEdges: 1,
  /** Interactive `GridEditor` / `HexGridEditor` (square: chrome without terrain fill when split). */
  cellGrid: 2,
  /** Hex: Catmull-Rom path splines above tessellated cells (would be hidden if drawn under the grid). */
  hexPathsOverGrid: 3,
  /** Global placed-object + place-preview glyphs (square + hex). */
  globalPlacedObjects: 4,
  /** Hex: region hull outlines for selection UX. */
  hexRegionOutlines: 5,
} as const;
