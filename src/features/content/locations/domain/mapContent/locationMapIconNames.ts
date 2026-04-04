/**
 * Re-exports icon **name** ids and unions. The canonical owner of object/scale glyph vocabulary is
 * the MUI component maps in `mapPresentation/locationMapIconNameMap.tsx` (keys are derived, not
 * duplicated here).
 *
 * Cell **fills** use swatch colors only (`LOCATION_CELL_FILL_KIND_META`); they do not participate
 * in these icon namespaces.
 */

export type {
  LocationMapGlyphIconName,
  LocationMapObjectIconName,
  LocationMapScaleIconName,
} from '../mapPresentation/locationMapIconNameMap';

export {
  LOCATION_MAP_OBJECT_ICON_NAME_IDS,
  LOCATION_MAP_SCALE_ICON_NAME_IDS,
} from '../mapPresentation/locationMapIconNameMap';
