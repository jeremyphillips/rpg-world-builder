/**
 * Gear form field registry — single source of truth for config + mapping.
 */
import type { Gear, GearInput } from '@/features/content/domain/types';
import { getBaseContentFieldSpecs } from '@/features/content/forms/baseFieldSpecs';
import { GEAR_CATEGORY_OPTIONS } from '@/features/content/domain/vocab';
import { type FieldSpec } from '@/features/content/forms/registry';
import type { GearFormValues } from './gearForm.types';

const trimOrUndefined = (v: unknown): string | undefined => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s || undefined;
};
const strOrEmpty = (v: unknown): string => (v != null ? String(v) : '');

export const GEAR_FORM_FIELDS = [
  ...getBaseContentFieldSpecs<
    GearFormValues,
    GearInput & Record<string, unknown>,
    Gear & Record<string, unknown>
  >(),
  {
    name: 'category',
    label: 'Category',
    kind: 'select',
    required: true,
    options: GEAR_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    placeholder: 'Select category',
    defaultValue: 'adventuring-utility' as GearFormValues['category'],
    parse: (v) => (v ? (v as GearInput['category']) : undefined),
    format: (v) => (v ?? '') as GearFormValues['category'],
  },
  {
    name: 'capacity',
    label: 'Capacity / Notes',
    kind: 'text',
    placeholder: 'e.g. capacity or notes',
    defaultValue: '' as GearFormValues['capacity'],
    parse: (v) => trimOrUndefined(v),
    format: (v) => strOrEmpty(v),
  },
] as const satisfies readonly FieldSpec<
  GearFormValues,
  GearInput & Record<string, unknown>,
  Gear & Record<string, unknown>
>[];
