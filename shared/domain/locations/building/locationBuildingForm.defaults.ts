import type { LocationBuildingFormClassId } from './locationBuilding.types';

/**
 * Default first-floor grid dimensions for each **structural form class** at building scale.
 *
 * These are **bootstrap defaults** for new maps only — not lore, not persisted as authoritative topology.
 * Cell size is assumed to be **5 ft** per cell, matching {@link ../scale/locationScaleField.policy.ts}
 * `building` / `floor` / `room` fixed cell unit (`5ft`) and the floor-map cell unit for interior maps.
 */
export const LOCATION_BUILDING_FORM_DEFAULT_GRID_SIZES: Record<
  LocationBuildingFormClassId,
  { columns: number; rows: number }
> = {
  /** 20′×20′ @ 5′ cells */
  compact_small: { columns: 4, rows: 4 },
  compact_medium: { columns: 6, rows: 6 },
  wide_medium: { columns: 8, rows: 6 },
  wide_large: { columns: 10, rows: 8 },
};
