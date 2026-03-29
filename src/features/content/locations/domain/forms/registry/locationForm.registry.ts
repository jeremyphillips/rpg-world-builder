/**
 * Location form field registry — config + mapping for create/edit.
 */
import {
  LOCATION_CATEGORY_IDS,
  LOCATION_SCALE_ORDER,
  LOCATION_CELL_UNIT_IDS,
} from '@/shared/domain/locations';
import {
  GRID_SIZE_PRESETS,
  type GridSizePreset,
} from '@/shared/domain/grid/gridPresets';
import type { Location } from '@/features/content/locations/domain/types';
import type { LocationInput } from '@/features/content/locations/domain/types';
import { when } from '@/ui/patterns';
import { getBaseContentFieldSpecs } from '@/features/content/shared/forms/baseFieldSpecs';
import type { FieldSpec } from '@/features/content/shared/forms/registry';
import type { LocationFormValues } from '../types/locationForm.types';

/** Dependent fields use ConditionalFormRenderer `visibleWhen` — shown after user picks a valid scale. */
const VISIBLE_WHEN_SCALE_SELECTED = when.in('scale', [...LOCATION_SCALE_ORDER]);

const trim = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const strOrEmpty = (v: unknown): string => (v != null ? String(v) : '');

const SCALE_OPTIONS = LOCATION_SCALE_ORDER.map((s) => ({ value: s, label: s }));

const CATEGORY_OPTIONS = LOCATION_CATEGORY_IDS.map((c) => ({
  value: c,
  label: c.slice(0, 1).toUpperCase() + c.slice(1),
}));

const GRID_PRESET_OPTIONS = [
  { value: '', label: 'Custom size' },
  ...(
    Object.entries(GRID_SIZE_PRESETS) as [GridSizePreset, (typeof GRID_SIZE_PRESETS)[GridSizePreset]][]
  ).map(([key, v]) => ({
    value: key,
    label: `${key} (${v.columns}×${v.rows})`,
  })),
];

const GRID_CELL_UNIT_OPTIONS = LOCATION_CELL_UNIT_IDS.map((u) => ({
  value: u,
  label: u,
}));

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
    placeholder: 'Select scale',
    defaultValue: '' as LocationFormValues['scale'],
    parse: (v) => (trim(v) || undefined) as LocationInput['scale'],
    format: (v) => strOrEmpty(v) as LocationFormValues['scale'],
  },
  {
    name: 'category',
    label: 'Category',
    kind: 'select' as const,
    options: CATEGORY_OPTIONS,
    placeholder: 'Optional — choose a category',
    defaultValue: '' as LocationFormValues['category'],
    visibleWhen: VISIBLE_WHEN_SCALE_SELECTED,
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
    renderSelectedAs: 'card',
    visibleWhen: VISIBLE_WHEN_SCALE_SELECTED,
    parse: (v) => (trim(v) || undefined) as LocationInput['parentId'],
    format: (v) => strOrEmpty(v) as LocationFormValues['parentId'],
  },
  {
    name: 'gridPreset',
    label: 'Size preset',
    kind: 'select' as const,
    options: GRID_PRESET_OPTIONS,
    placeholder: 'Custom or preset',
    defaultValue: '' as LocationFormValues['gridPreset'],
    parse: () => undefined,
    format: () => '' as LocationFormValues['gridPreset'],
    visibleWhen: VISIBLE_WHEN_SCALE_SELECTED,
    group: {
      id: 'mapGrid',
      label: 'Map grid',
      helperText: 'Bounding rectangle only; irregular shapes can use layout masking later.',
      direction: 'column' as const,
      spacing: 2,
    },
  },
  {
    name: 'gridColumns',
    label: 'Grid columns',
    kind: 'numberText' as const,
    defaultValue: '' as LocationFormValues['gridColumns'],
    parse: () => undefined,
    format: () => '' as LocationFormValues['gridColumns'],
    validation: { rules: [{ kind: 'min', value: 1, message: 'Must be at least 1' }] },
    visibleWhen: VISIBLE_WHEN_SCALE_SELECTED,
    group: {
      id: 'mapGrid',
      label: 'Map grid',
      direction: 'column' as const,
      spacing: 2,
    },
  },
  {
    name: 'gridRows',
    label: 'Grid rows',
    kind: 'numberText' as const,
    defaultValue: '' as LocationFormValues['gridRows'],
    parse: () => undefined,
    format: () => '' as LocationFormValues['gridRows'],
    validation: { rules: [{ kind: 'min', value: 1, message: 'Must be at least 1' }] },
    visibleWhen: VISIBLE_WHEN_SCALE_SELECTED,
    group: {
      id: 'mapGrid',
      label: 'Map grid',
      direction: 'column' as const,
      spacing: 2,
    },
  },
  {
    name: 'gridCellUnit',
    label: 'Cell unit',
    kind: 'select' as const,
    options: GRID_CELL_UNIT_OPTIONS,
    placeholder: 'Choose unit',
    defaultValue: '5ft' as LocationFormValues['gridCellUnit'],
    parse: () => undefined,
    format: () => '5ft' as LocationFormValues['gridCellUnit'],
    visibleWhen: VISIBLE_WHEN_SCALE_SELECTED,
    group: {
      id: 'mapGrid',
      label: 'Map grid',
      direction: 'column' as const,
      spacing: 2,
    },
  },
  // TODO: determine how to surface in UI
  // {
  //   name: 'labelShort',
  //   label: 'Label (short)',
  //   kind: 'text' as const,
  //   defaultValue: '' as LocationFormValues['labelShort'],
  //   parse: () => undefined,
  //   format: () => '' as LocationFormValues['labelShort'],
  // },
  // {
  //   name: 'labelNumber',
  //   label: 'Label (number)',
  //   kind: 'text' as const,
  //   defaultValue: '' as LocationFormValues['labelNumber'],
  //   parse: () => undefined,
  //   format: () => '' as LocationFormValues['labelNumber'],
  // },
  // {
  //   name: 'sortOrder',
  //   label: 'Sort order',
  //   kind: 'numberText' as const,
  //   defaultValue: '' as LocationFormValues['sortOrder'],
  //   parse: (v) => {
  //     const t = trim(v);
  //     if (!t) return undefined;
  //     const n = Number(t);
  //     return Number.isFinite(n) ? (n as LocationInput['sortOrder']) : undefined;
  //   },
  //   format: (v) => (v != null && v !== '' ? String(v) : '') as LocationFormValues['sortOrder'],
  // },
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

/** Fields filtered when map bootstrap UI is hidden (e.g. system patch editor). */
export const LOCATION_GRID_BOOTSTRAP_FIELD_NAMES = new Set<string>([
  'gridPreset',
  'gridColumns',
  'gridRows',
  'gridCellUnit',
]);
