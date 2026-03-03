/**
 * Weapon form field registry — single source of truth for config + mapping.
 */
import type { Weapon, WeaponInput } from '@/features/content/domain/types';
import { getBaseContentFieldSpecs } from '@/features/content/forms/baseFieldSpecs';
import {
  WEAPON_CATEGORY_OPTIONS,
  WEAPON_MODE_OPTIONS,
  WEAPON_PROPERTY_OPTIONS,
  WEAPON_DAMAGE_TYPE_OPTIONS,
} from '@/features/content/domain/vocab';
import type { FieldSpec } from '@/features/content/forms/registry';
import type { WeaponFormValues } from './weaponForm.types';
import { when } from '@/ui/patterns';

const isRanged = when.eq('mode', 'ranged');
const isVersatile = when.contains('properties', 'versatile');

const arrOrEmpty = (v: unknown): string[] =>
  Array.isArray(v) ? (v as string[]) : [];

export const WEAPON_FORM_FIELDS = [
  ...getBaseContentFieldSpecs<
    WeaponFormValues,
    WeaponInput & Record<string, unknown>,
    Weapon & Record<string, unknown>
  >(),
  {
    name: 'category',
    label: 'Category',
    kind: 'select' as const,
    required: true,
    options: WEAPON_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    placeholder: 'Select category',
    defaultValue: '' as WeaponFormValues['category'],
    parse: (v: unknown) => (v ? (v as WeaponInput['category']) : undefined),
    format: (v: unknown) => (v ?? '') as WeaponFormValues['category'],
  },
  {
    name: 'mode',
    label: 'Mode',
    kind: 'select' as const,
    required: true,
    options: WEAPON_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    placeholder: 'Select mode',
    defaultValue: 'melee' as WeaponFormValues['mode'],
    parse: (v: unknown) => (v ? (v as WeaponInput['mode']) : undefined),
    format: (v: unknown) => (v ?? '') as WeaponFormValues['mode'],
  },
  {
    name: 'properties',
    label: 'Properties',
    kind: 'checkboxGroup' as const,
    options: WEAPON_PROPERTY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    defaultValue: [] as WeaponFormValues['properties'],
    parse: (v: unknown) => (Array.isArray(v) ? (v as WeaponInput['properties']) : undefined),
    format: (v: unknown) => arrOrEmpty(v) as WeaponFormValues['properties'],
  },
  {
    name: 'damageDefault',
    label: 'Damage (e.g. 1d6)',
    kind: 'text' as const,
    path: 'damage.default',
    placeholder: '1d6',
    defaultValue: '1d6' as WeaponFormValues['damageDefault'],
  },
  {
    name: 'damageVersatile',
    label: 'Damage (versatile)',
    kind: 'text' as const,
    path: 'damage.versatile',
    placeholder: '1d8',
    helperText: 'Optional. Only used for versatile weapons.',
    defaultValue: '' as WeaponFormValues['damageVersatile'],
    visibleWhen: isVersatile,
  },
  {
    name: 'damageType',
    label: 'Damage Type',
    kind: 'select' as const,
    options: WEAPON_DAMAGE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    placeholder: 'Select damage type',
    defaultValue: 'slashing' as WeaponFormValues['damageType'],
    parse: (v: unknown) => (v ? String(v) : undefined),
    format: (v: unknown) => (v ?? '') as WeaponFormValues['damageType'],
  },
  {
    name: 'rangeNormal',
    label: 'Range (normal, ft)',
    kind: 'text' as const,
    path: 'range.normal',
    placeholder: 'e.g. 30',
    helperText: 'Only used for ranged weapons.',
    defaultValue: '' as WeaponFormValues['rangeNormal'],
    visibleWhen: isRanged,
  },
  {
    name: 'rangeLong',
    label: 'Range (long, ft)',
    kind: 'text' as const,
    path: 'range.long',
    placeholder: 'e.g. 120',
    helperText: 'Optional. Only used for ranged weapons.',
    defaultValue: '' as WeaponFormValues['rangeLong'],
    visibleWhen: isRanged,
  },
  // TODO: decide whether to show mastery
  // {
  //   name: 'mastery',
  //   label: 'Mastery',
  //   kind: 'text' as const,
  //   placeholder: 'e.g. slow, nick',
  //   defaultValue: '' as WeaponFormValues['mastery'],
  // },
] as const satisfies readonly FieldSpec<
  WeaponFormValues,
  WeaponInput & Record<string, unknown>,
  Weapon & Record<string, unknown>
>[];
