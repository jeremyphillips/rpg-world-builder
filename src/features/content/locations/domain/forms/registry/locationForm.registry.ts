/**
 * Location form field registry — config + mapping for create/edit.
 */
import { LOCATION_SCALE_ORDER } from '@/shared/domain/locations/location.constants';
import type { Location } from '@/features/content/locations/domain/types';
import type { LocationInput } from '@/features/content/locations/domain/types';
import { getBaseContentFieldSpecs } from '@/features/content/shared/forms/baseFieldSpecs';
import type { FieldSpec } from '@/features/content/shared/forms/registry';
import type { LocationFormValues } from '../types/locationForm.types';

const trim = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const strOrEmpty = (v: unknown): string => (v != null ? String(v) : '');

const SCALE_OPTIONS = LOCATION_SCALE_ORDER.map((s) => ({ value: s, label: s }));

const splitList = (v: unknown): string[] => {
  if (typeof v !== 'string' || !trim(v)) return [];
  return trim(v)
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

export const LOCATION_FORM_FIELDS = [
  ...getBaseContentFieldSpecs<
    LocationFormValues,
    LocationInput & Record<string, unknown>,
    Location & Record<string, unknown>
  >(),
  {
    name: 'scale',
    label: 'Scale',
    kind: 'select' as const,
    required: true,
    options: SCALE_OPTIONS,
    defaultFromOptions: 'first' as const,
    defaultValue: SCALE_OPTIONS[0]?.value ?? '',
    parse: (v) => (trim(v) || undefined) as LocationInput['scale'],
    format: (v) => strOrEmpty(v) as LocationFormValues['scale'],
  },
  {
    name: 'category',
    label: 'Category',
    kind: 'text' as const,
    placeholder: 'e.g. settlement, dungeon',
    defaultValue: '' as LocationFormValues['category'],
    parse: (v) => (trim(v) || undefined) as LocationInput['category'],
    format: (v) => strOrEmpty(v) as LocationFormValues['category'],
  },
  {
    name: 'parentId',
    label: 'Parent location',
    kind: 'optionPicker' as const,
    placeholder: 'Optional — choose a parent location',
    defaultValue: '' as LocationFormValues['parentId'],
    maxItems: 1,
    valueMode: 'scalar' as const,
    parse: (v) => (trim(v) || undefined) as LocationInput['parentId'],
    format: (v) => strOrEmpty(v) as LocationFormValues['parentId'],
  },
  {
    name: 'labelShort',
    label: 'Label (short)',
    kind: 'text' as const,
    defaultValue: '' as LocationFormValues['labelShort'],
    parse: () => undefined,
    format: () => '' as LocationFormValues['labelShort'],
  },
  {
    name: 'labelNumber',
    label: 'Label (number)',
    kind: 'text' as const,
    defaultValue: '' as LocationFormValues['labelNumber'],
    parse: () => undefined,
    format: () => '' as LocationFormValues['labelNumber'],
  },
  {
    name: 'sortOrder',
    label: 'Sort order',
    kind: 'numberText' as const,
    defaultValue: '' as LocationFormValues['sortOrder'],
    parse: (v) => {
      const t = trim(v);
      if (!t) return undefined;
      const n = Number(t);
      return Number.isFinite(n) ? (n as LocationInput['sortOrder']) : undefined;
    },
    format: (v) => (v != null && v !== '' ? String(v) : '') as LocationFormValues['sortOrder'],
  },
  {
    name: 'aliases',
    label: 'Aliases',
    kind: 'textarea' as const,
    placeholder: 'Comma-separated',
    defaultValue: '' as LocationFormValues['aliases'],
    parse: (v) => {
      const arr = splitList(v);
      return (arr.length ? arr : undefined) as LocationInput['aliases'];
    },
    format: (v) =>
      (Array.isArray(v) ? (v as string[]).join(', ') : strOrEmpty(v)) as LocationFormValues['aliases'],
  },
  {
    name: 'tags',
    label: 'Tags',
    kind: 'textarea' as const,
    placeholder: 'Comma-separated',
    defaultValue: '' as LocationFormValues['tags'],
    parse: (v) => {
      const arr = splitList(v);
      return (arr.length ? arr : undefined) as LocationInput['tags'];
    },
    format: (v) =>
      (Array.isArray(v) ? (v as string[]).join(', ') : strOrEmpty(v)) as LocationFormValues['tags'],
  },
] as const satisfies readonly FieldSpec<
  LocationFormValues,
  LocationInput & Record<string, unknown>,
  Location & Record<string, unknown>
>[];
