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

/** Link text for opening the linked target’s edit route in a new tab */
export function editLinkLabelForLinkedScale(linkedScale: LocationScaleId): string {
  switch (linkedScale) {
    case 'city':
      return 'Edit city';
    case 'building':
      return 'Edit building';
    case 'site':
      return 'Edit site';
    case 'floor':
      return 'Edit floor';
    case 'room':
      return 'Edit room';
    default:
      return 'Edit location';
  }
}
