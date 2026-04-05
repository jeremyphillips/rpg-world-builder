/**
 * Location form field registry — config + mapping for create/edit.
 */
import {
  ALL_LOCATION_SCALE_IDS,
  LOCATION_BUILDING_FUNCTION_IDS,
  LOCATION_BUILDING_PRIMARY_SUBTYPE_IDS,
  LOCATION_BUILDING_PRIMARY_TYPE_IDS,
  LOCATION_CATEGORY_IDS,
  LOCATION_CELL_UNIT_IDS,
  SURFACE_LOCATION_CONTENT_SCALE_IDS,
} from '@/shared/domain/locations';
import {
  GRID_SIZE_PRESETS,
  type GridSizePreset,
} from '@/shared/domain/grid/gridPresets';
import type { Location } from '@/features/content/locations/domain/model/location';
import type { LocationInput } from '@/features/content/locations/domain/model/location';
import {
  LOCATION_BUILDING_FUNCTION_META,
  LOCATION_BUILDING_PRIMARY_SUBTYPE_META,
  LOCATION_BUILDING_PRIMARY_TYPE_META,
} from '../../model/building/locationBuilding.meta';
import { DEFAULT_VISIBILITY_PUBLIC, when } from '@/ui/patterns';
import { getNameDescriptionFieldSpecs } from '@/features/content/shared/forms/baseFieldSpecs';
import type { FieldSpec } from '@/features/content/shared/forms/registry';
import type { LocationFormValues } from '../types/locationForm.types';

/** Dependent fields use ConditionalFormRenderer `visibleWhen` — shown after user picks a valid scale (includes legacy scales for edit). */
const VISIBLE_WHEN_SCALE_SELECTED = when.in('scale', [...ALL_LOCATION_SCALE_IDS]);

const VISIBLE_WHEN_BUILDING = when.eq('scale', 'building');
const VISIBLE_WHEN_BUILDING_TYPE_SELECTED = when.and(
  when.eq('scale', 'building'),
  when.neq('buildingPrimaryType', ''),
);

const BUILDING_TYPE_OPTIONS = LOCATION_BUILDING_PRIMARY_TYPE_IDS.map((id) => ({
  value: id,
  label: LOCATION_BUILDING_PRIMARY_TYPE_META[id].label,
}));

/** Full list; `getLocationFieldConfigs` narrows by selected type. */
const BUILDING_SUBTYPE_OPTIONS = LOCATION_BUILDING_PRIMARY_SUBTYPE_IDS.map((id) => ({
  value: id,
  label: LOCATION_BUILDING_PRIMARY_SUBTYPE_META[id].label,
}));

const BUILDING_FUNCTION_OPTIONS = LOCATION_BUILDING_FUNCTION_IDS.map((id) => ({
  value: id,
  label: LOCATION_BUILDING_FUNCTION_META[id].label,
}));

const trim = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const strOrEmpty = (v: unknown): string => (v != null ? String(v) : '');

/** Default registry options — create uses surface-only via `getAllowedLocationScaleOptionsForCreate`; edit overrides with full scale list. */
const SCALE_OPTIONS = SURFACE_LOCATION_CONTENT_SCALE_IDS.map((s) => ({ value: s, label: s }));

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

export const LOCATION_FORM_FIELDS = [
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
      label: '',
      helperText: '',
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
      label: '',
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
      label: '',
      direction: 'column' as const,
      spacing: 2,
    },
  },
  ...getNameDescriptionFieldSpecs<
    LocationFormValues,
    LocationInput & Record<string, unknown>,
    Location & Record<string, unknown>
  >(),
  {
    name: 'accessPolicy',
    label: 'Visibility',
    kind: 'visibility' as const,
    skipInForm: true,
    defaultValue: DEFAULT_VISIBILITY_PUBLIC as LocationFormValues['accessPolicy'],
    parse: (v) => (v ?? DEFAULT_VISIBILITY_PUBLIC) as LocationInput['accessPolicy'],
    format: (v) => (v ?? DEFAULT_VISIBILITY_PUBLIC) as LocationFormValues['accessPolicy'],
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
    name: 'buildingPrimaryType',
    label: 'Building Type',
    kind: 'select' as const,
    options: BUILDING_TYPE_OPTIONS,
    placeholder: 'Select type',
    defaultValue: '' as LocationFormValues['buildingPrimaryType'],
    helperText: 'What kind of building is this overall?',
    visibleWhen: VISIBLE_WHEN_BUILDING,
    group: {
      id: 'buildingProfile',
      label: 'Building profile',
      direction: 'column' as const,
      spacing: 2,
    },
  },
  {
    name: 'buildingPrimarySubtype',
    label: 'Building Subtype',
    kind: 'select' as const,
    options: BUILDING_SUBTYPE_OPTIONS,
    placeholder: 'Select subtype',
    defaultValue: '' as LocationFormValues['buildingPrimarySubtype'],
    helperText: 'Choose the specific kind of building within the selected type.',
    visibleWhen: VISIBLE_WHEN_BUILDING_TYPE_SELECTED,
    group: {
      id: 'buildingProfile',
      label: 'Building profile',
      direction: 'column' as const,
      spacing: 2,
    },
  },
  {
    name: 'buildingFunctions',
    label: 'Additional Functions',
    kind: 'optionPicker' as const,
    pickerOptions: BUILDING_FUNCTION_OPTIONS,
    valueMode: 'array' as const,
    renderSelectedAs: 'chip' as const,
    placeholder: 'Add functions…',
    defaultValue: [] as unknown as LocationFormValues['buildingFunctions'],
    helperText:
      'Optional. Add extra roles for mixed-use buildings, such as lodging, food & drink, trade, or guild activity.',
    visibleWhen: VISIBLE_WHEN_BUILDING_TYPE_SELECTED,
    group: {
      id: 'buildingProfile',
      label: 'Building profile',
      direction: 'column' as const,
      spacing: 2,
    },
  },
  {
    name: 'buildingIsPublicStorefront',
    label: 'Open to the Public',
    kind: 'checkbox' as const,
    defaultValue: false as LocationFormValues['buildingIsPublicStorefront'],
    helperText:
      'Whether visitors can freely enter or use services here—shops, taverns, temples, guild halls, inns, and similar.',
    visibleWhen: VISIBLE_WHEN_BUILDING,
    group: {
      id: 'buildingProfile',
      label: 'Building profile',
      direction: 'column' as const,
      spacing: 2,
    },
  },
  {
    name: 'buildingOwnerRefs',
    label: 'Owners',
    kind: 'optionPicker' as const,
    pickerOptions: [],
    valueMode: 'array' as const,
    renderSelectedAs: 'chip' as const,
    placeholder: 'Add owners…',
    defaultValue: [] as unknown as LocationFormValues['buildingOwnerRefs'],
    helperText: 'PCs or NPCs tied to owning this building.',
    visibleWhen: VISIBLE_WHEN_BUILDING,
    group: {
      id: 'buildingProfile',
      label: 'Building profile',
      direction: 'column' as const,
      spacing: 2,
    },
  },
  {
    name: 'buildingStaffRefs',
    label: 'Staff',
    kind: 'optionPicker' as const,
    pickerOptions: [],
    valueMode: 'array' as const,
    renderSelectedAs: 'chip' as const,
    placeholder: 'Add staff…',
    defaultValue: [] as unknown as LocationFormValues['buildingStaffRefs'],
    helperText: 'PCs or NPCs who work here.',
    visibleWhen: VISIBLE_WHEN_BUILDING,
    group: {
      id: 'buildingProfile',
      label: 'Building profile',
      direction: 'column' as const,
      spacing: 2,
    },
  },
  /**
   * Kept for mappers / effects (e.g. preset-driven column/row sync). Not shown in metadata tab —
   * use `skipInForm` so the size preset control does not appear next to read-only grid fields.
   */
  {
    name: 'gridPreset',
    label: 'Size preset',
    kind: 'select' as const,
    skipInForm: true,
    options: GRID_PRESET_OPTIONS,
    placeholder: 'Custom or preset',
    defaultValue: '' as LocationFormValues['gridPreset'],
    parse: () => undefined,
    format: () => '' as LocationFormValues['gridPreset'],
    visibleWhen: VISIBLE_WHEN_SCALE_SELECTED,
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
  
  // TODO: determine how/whether to surface in UI
  // {
  //   name: 'aliases',
  //   label: 'Aliases',
  //   kind: 'textarea' as const,
  //   placeholder: 'Comma-separated',
  //   defaultValue: '' as LocationFormValues['aliases'],
  //   parse: (v) => {
  //     const arr = splitList(v);
  //     return (arr.length ? arr : undefined) as LocationInput['aliases'];
  //   },
  //   format: (v) =>
  //     (Array.isArray(v) ? (v as string[]).join(', ') : strOrEmpty(v)) as LocationFormValues['aliases'],
  // },
  // {
  //   name: 'tags',
  //   label: 'Tags',
  //   kind: 'textarea' as const,
  //   placeholder: 'Comma-separated',
  //   defaultValue: '' as LocationFormValues['tags'],
  //   parse: (v) => {
  //     const arr = splitList(v);
  //     return (arr.length ? arr : undefined) as LocationInput['tags'];
  //   },
  //   format: (v) =>
  //     (Array.isArray(v) ? (v as string[]).join(', ') : strOrEmpty(v)) as LocationFormValues['tags'],
  // },
] as const satisfies readonly FieldSpec<
  LocationFormValues,
  LocationInput & Record<string, unknown>,
  Location & Record<string, unknown>
>[];

/** Fields filtered when map bootstrap UI is hidden (e.g. system patch editor). */
export const LOCATION_GRID_BOOTSTRAP_FIELD_NAMES = new Set<string>([
  'gridGeometry',
  'gridPreset',
  'gridColumns',
  'gridRows',
  'gridCellUnit',
]);
