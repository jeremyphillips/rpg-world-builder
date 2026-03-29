/**
 * Geometry-aware bounded grid definition.
 *
 * Both square and hex grids use rectangular column/row bounds.
 * For hex, coordinates use an odd-q offset model within the same bounds
 * (odd-numbered columns shift down by half a row).
 *
 * This is a first-pass shared type for locations and world-scale work;
 * encounter/interior systems continue using their own square-specific APIs
 * (e.g. `createSquareGridSpace`, `GridViewModel`).
 */

import type { GridGeometryId } from './gridGeometry';

export type GridDefinition = {
  geometry: GridGeometryId;
  columns: number;
  rows: number;
};
