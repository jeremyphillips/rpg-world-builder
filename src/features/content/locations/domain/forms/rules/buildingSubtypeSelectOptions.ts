import { LOCATION_BUILDING_PRIMARY_SUBTYPE_META } from '@/features/content/locations/domain/model/building/locationBuilding.meta';
import { getAllowedLocationBuildingPrimarySubtypesForType } from '@/features/content/locations/domain/model/building/locationBuilding.policy';

/** Select options for Building Subtype filtered by the current Building Type. */
export function buildBuildingSubtypeSelectOptions(primaryType: string | undefined): {
  value: string;
  label: string;
}[] {
  const ids = getAllowedLocationBuildingPrimarySubtypesForType(primaryType);
  return ids.map((id) => ({
    value: id,
    label: LOCATION_BUILDING_PRIMARY_SUBTYPE_META[id].label,
  }));
}
