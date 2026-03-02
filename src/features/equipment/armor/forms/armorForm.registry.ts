/**
 * Armor form field registry — single source of truth for config + mapping.
 */
import type { Armor, ArmorInput } from '@/features/content/domain/types';
import { getBaseContentFieldSpecs } from '@/features/content/forms/baseFieldSpecs';
import {
  ARMOR_CATEGORY_OPTIONS,
  ARMOR_MATERIAL_OPTIONS,
} from '@/features/content/domain/vocab';
import { when } from '@/ui/patterns';
import type { FieldSpec } from '@/features/equipment/forms/registry';
import type { ArmorFormValues } from './armorForm.types';

const isArmor = when.in('category', ['light', 'medium', 'heavy']);
const isShield = when.eq('category', 'shields');

const numOrUndefined = (v: unknown): number | undefined => {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const numToStr = (v: unknown): string =>
  v != null && Number.isFinite(Number(v)) ? String(v) : '';

export const ARMOR_FORM_FIELDS = [
  ...getBaseContentFieldSpecs<
    ArmorFormValues,
    ArmorInput & Record<string, unknown>,
    Armor & Record<string, unknown>
  >(),
  {
    name: 'category',
    label: 'Category',
    kind: 'select',
    required: true,
    options: ARMOR_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    placeholder: 'Select category',
    // defaultFromOptions: 'first',
    defaultValue: '',
    parse: (v) => (v ? (v as ArmorInput['category']) : undefined),
    format: (v) => (v ?? '') as ArmorFormValues['category'],
  },
  {
    name: 'material',
    label: 'Material',
    kind: 'select',
    options: ARMOR_MATERIAL_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    placeholder: 'Select material',
    defaultFromOptions: 'first',
    parse: (v) => (v ? (v as ArmorInput['material']) : undefined),
    format: (v) => (v ?? '') as ArmorFormValues['material'],
  },
  {
    name: 'baseAC',
    label: 'Base AC',
    kind: 'numberText',
    placeholder: 'e.g. 14',
    defaultValue: '',
    required: true,
    visibleWhen: isArmor,
    validation: { min: 10, max: 20, integer: true },
    parse: (v) => numOrUndefined(v),
    format: (v) => numToStr(v),
  },
  {
    name: 'acBonus',
    label: 'AC Bonus',
    kind: 'numberText',
    placeholder: 'e.g. 2',
    defaultValue: '',
    visibleWhen: isShield,
    parse: (v) => numOrUndefined(v),
    format: (v) => numToStr(v),
    formatForDisplay: (v) =>
      v != null && Number.isFinite(Number(v)) ? `+${v}` : '',
  },
  {
    name: 'stealthDisadvantage',
    label: 'Stealth Disadvantage',
    kind: 'checkbox',
    defaultValue: false,
    visibleWhen: isArmor,
    parse: (v) => Boolean(v),
    format: (v) => Boolean(v ?? false),
    formatForDisplay: (v) => (v ? 'Yes' : 'No'),
  },
] as const satisfies readonly FieldSpec<
  ArmorFormValues,
  ArmorInput & Record<string, unknown>,
  Armor & Record<string, unknown>
>[];
