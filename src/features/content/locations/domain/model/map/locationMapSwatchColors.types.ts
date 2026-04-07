/**
 * Keys for map cell-fill swatch colors. Values live in `src/app/theme/mapColors.ts`.
 * Aligned with {@link AUTHORED_CELL_FILL_SWATCH_KEYS} in the cell-fill registry.
 */
import type { AuthoredCellFillSwatchColorKey } from '@/shared/domain/locations/map/authoredCellFillDefinitions';
import { AUTHORED_CELL_FILL_SWATCH_KEYS } from '@/shared/domain/locations/map/authoredCellFillDefinitions';

export type LocationMapSwatchColorKey = AuthoredCellFillSwatchColorKey;

/** Same order as {@link AUTHORED_CELL_FILL_SWATCH_KEYS}. */
export const LOCATION_MAP_SWATCH_COLOR_KEYS = AUTHORED_CELL_FILL_SWATCH_KEYS;
