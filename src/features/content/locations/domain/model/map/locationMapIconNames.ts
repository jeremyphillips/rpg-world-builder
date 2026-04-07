/**
 * Re-exports icon **name** ids and unions. The canonical owner of object/scale glyph vocabulary is
 * the MUI component maps in `presentation/map/locationMapIconNameMap.tsx` (keys are derived, not
 * duplicated here).
 *
 * Cell **fills** use swatch colors only (via `resolveCellFillVariant` / theme); they do not participate
 * in these icon namespaces.
 */

export type {
  LocationMapGlyphIconName,
  LocationMapObjectIconName,
  LocationMapScaleIconName,
} from '../../presentation/map/locationMapIconNameMap';

export {
  LOCATION_MAP_OBJECT_ICON_NAME_IDS,
  LOCATION_MAP_SCALE_ICON_NAME_IDS,
} from '../../presentation/map/locationMapIconNameMap';
