/**
 * Location form values ↔ domain input.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { Location, LocationInput } from '@/features/content/locations/domain/types';
import {
  buildDefaultFormValues,
  buildToFormValues,
  buildToInput,
} from '@/features/content/shared/forms/registry';
import { LOCATION_FORM_FIELDS } from '../registry/locationForm.registry';
import type { LocationFormValues } from '../types/locationForm.types';

const trim = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

const toInput = buildToInput(LOCATION_FORM_FIELDS);
const toFormValuesFromItem = buildToFormValues(LOCATION_FORM_FIELDS);
const defaultFormValues = buildDefaultFormValues(LOCATION_FORM_FIELDS);

export const locationToFormValues = (loc: Location): LocationFormValues => ({
  ...(defaultFormValues as LocationFormValues),
  ...toFormValuesFromItem(loc as Location & Record<string, unknown>),
  accessPolicy: (loc.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC) as LocationFormValues['accessPolicy'],
  labelShort: loc.label?.short ?? '',
  labelNumber: loc.label?.number ?? '',
  sortOrder: loc.sortOrder != null ? String(loc.sortOrder) : '',
  aliases: (loc.aliases ?? []).join(', '),
  tags: (loc.tags ?? []).join(', '),
});

export const toLocationInput = (values: LocationFormValues): LocationInput => {
  const base = toInput(values) as LocationInput;
  const label =
    trim(values.labelShort) || trim(values.labelNumber)
      ? {
          short: trim(values.labelShort) || undefined,
          number: trim(values.labelNumber) || undefined,
        }
      : undefined;
  const scale = trim(values.scale);
  if (scale === 'world') {
    return {
      ...base,
      category: undefined,
      parentId: undefined,
      label,
    };
  }
  return {
    ...base,
    label,
  };
};
