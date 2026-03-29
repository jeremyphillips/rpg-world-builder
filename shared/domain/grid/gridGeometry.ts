/**
 * Grid geometry vocabulary.
 *
 * Square is the established geometry for encounters and interior tactical maps.
 * Hex is introduced here at the shared grid-domain level for world, region,
 * subregion, and city-overview scales. First-pass hex uses bounded x/y
 * coordinates with an odd-q offset interpretation; advanced hex rendering,
 * editor support, and encounter integration are intentionally deferred.
 */

export const GRID_GEOMETRY_IDS = ['square', 'hex'] as const;

export type GridGeometryId = (typeof GRID_GEOMETRY_IDS)[number];
