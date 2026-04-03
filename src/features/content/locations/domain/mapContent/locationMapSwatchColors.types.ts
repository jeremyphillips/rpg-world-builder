/**
 * Keys for map swatch colors. Values live in `src/app/theme/mapColors.ts` so hex stays
 * centralized; keys are derived from {@link LOCATION_CELL_FILL_KIND_META} so they stay aligned
 * with the canonical fill registry.
 */
import {
  LOCATION_CELL_FILL_KIND_META,
  type LocationMapCellFillKindId,
} from '@/shared/domain/locations/map/locationMapCellFill.constants';
import { recordKeys } from '@/shared/domain/locations/map/locationMapRecordUtils';

export type LocationMapSwatchColorKey = (typeof LOCATION_CELL_FILL_KIND_META)[LocationMapCellFillKindId]['swatchColorKey'];

/** Same order as keys in {@link LOCATION_CELL_FILL_KIND_META}. */
export const LOCATION_MAP_SWATCH_COLOR_KEYS = recordKeys(LOCATION_CELL_FILL_KIND_META).map(
  (k) => LOCATION_CELL_FILL_KIND_META[k].swatchColorKey,
) as readonly LocationMapSwatchColorKey[];
