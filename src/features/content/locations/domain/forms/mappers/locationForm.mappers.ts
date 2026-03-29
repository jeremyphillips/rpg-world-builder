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
import { sanitizeLocationFormValues } from '@/features/content/locations/domain/forms/utils/locationDependentFieldsPolicy';

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
  const scale = trim(values.scale);
  const patch = sanitizeLocationFormValues(values, { scale, locations: undefined });
  const merged = { ...values, ...patch };
  const base = toInput(merged) as LocationInput;
  const label =
    trim(merged.labelShort) || trim(merged.labelNumber)
      ? {
          short: trim(merged.labelShort) || undefined,
          number: trim(merged.labelNumber) || undefined,
        }
      : undefined;
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
