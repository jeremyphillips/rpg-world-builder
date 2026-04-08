import type { LocationScaleId } from '@/shared/domain/locations';

/** Label for the map link picker; keyed by registry `linkedScale` (target kind / tier). */
export function linkedTargetPickerFieldLabel(linkedScale: LocationScaleId): string {
  switch (linkedScale) {
    case 'city':
      return 'Linked city';
    case 'building':
      return 'Linked building';
    case 'site':
      return 'Linked site';
    default:
      return 'Linked location';
  }
}
