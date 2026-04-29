/**
 * Weapon form field registry — single source of truth for config + mapping.
 *
 * Patch bindings adapt flattened UI fields (damageDefaultCount/die, rangeNormal/Long)
 * to domain-shaped patch paths (damage.default, damage.versatile, range.normal, range.long).
 * Domain patch shape is canonical; bindings handle UI/domain adaptation.
 */
import type { Weapon, WeaponInput } from '@/features/content/equipment/weapons/domain/types';
import { getBaseContentFieldSpecs } from '@/features/content/shared/forms/baseFieldSpecs';
import { DIE_FACE_OPTIONS } from '@/features/content/shared/forms/dice/diceOptions';
import {
  createOptionalXdYCountBinding,
  createOptionalXdYDieBinding,
  createRequiredXdYCountBinding,
  createRequiredXdYDieBinding,
} from '@/features/content/shared/forms/dice/dicePatchBindings';
import {
  WEAPON_CATEGORY_OPTIONS,
  WEAPON_MODE_OPTIONS,
  WEAPON_PROPERTY_OPTIONS,
  WEAPON_DAMAGE_TYPE_OPTIONS,
} from '@/features/content/equipment/weapons/domain/vocab';
import type { FieldSpec } from '@/features/content/shared/forms/registry';
import type { WeaponFormValues } from '../types/weaponForm.types';
import { when } from '@/ui/patterns';

const isRanged = when.eq('mode', 'ranged');
const isVersatile = when.contains('properties', 'versatile');

const arrOrEmpty = (v: unknown): string[] =>
  Array.isArray(v) ? (v as string[]) : [];

const versatileParseOptions = { defaultCount: 0, defaultDie: 8 as const };

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
    options: WEAPON_CATEGORY_OPTIONS.map((o) => ({ value: o.id, label: o.name })),
    placeholder: 'Select category',
    defaultValue: '' as WeaponFormValues['category'],
    parse: (v: unknown) => (v ? (v as WeaponInput['category']) : undefined),
    format: (v: unknown) => (v ?? '') as WeaponFormValues['category'],
    group: { id: 'categoryMode' },
  },
  {
    name: 'mode',
    label: 'Mode',
    kind: 'select' as const,
    required: true,
    options: WEAPON_MODE_OPTIONS.map((o) => ({ value: o.id, label: o.name })),
    placeholder: 'Select mode',
    defaultValue: 'melee' as WeaponFormValues['mode'],
    parse: (v: unknown) => (v ? (v as WeaponInput['mode']) : undefined),
    format: (v: unknown) => (v ?? '') as WeaponFormValues['mode'],
    group: { id: 'categoryMode' },
  },
  {
    name: 'properties',
    label: 'Properties',
    kind: 'checkboxGroup' as const,
    options: WEAPON_PROPERTY_OPTIONS.map((o) => ({ value: o.id, label: o.name })),
    defaultValue: [] as WeaponFormValues['properties'],
    parse: (v: unknown) => (Array.isArray(v) ? (v as WeaponInput['properties']) : undefined),
    format: (v: unknown) => arrOrEmpty(v) as WeaponFormValues['properties'],
  },
  {
    name: 'damageDefaultCount',
    label: 'Dice Count',
    kind: 'numberText' as const,
    defaultValue: '1' as WeaponFormValues['damageDefaultCount'],
    group: { id: 'damageDiceDefault', label: 'Damage (Default)' },
    width: 2,
    required: true,
    patchBinding: createRequiredXdYCountBinding({
      domainPath: 'damage.default',
      countFallback: 1,
      dieFallback: 6,
    }),
  },
  {
    name: 'damageDefaultDie',
    label: 'Die Face',
    kind: 'select' as const,
    options: DIE_FACE_OPTIONS,
    defaultValue: '6' as WeaponFormValues['damageDefaultDie'],
    group: { id: 'damageDiceDefault', label: 'Damage (Default)' },
    width: 3,
    required: true,
    patchBinding: createRequiredXdYDieBinding({
      domainPath: 'damage.default',
      dieFallback: 6,
    }),
  },
  {
    name: 'damageType',
    label: 'Damage Type',
    kind: 'select' as const,
    options: WEAPON_DAMAGE_TYPE_OPTIONS.map((o) => ({ value: o.id, label: o.name })),
    placeholder: 'Select damage type',
    defaultValue: 'slashing' as WeaponFormValues['damageType'],
    parse: (v: unknown) => (v ? String(v) : undefined),
    format: (v: unknown) => (v ?? '') as WeaponFormValues['damageType'],
    group: { id: 'damageDiceDefault', label: 'Damage (Default)' },
    width: 4,
  },
  {
    name: 'damageVersatileCount',
    label: 'Dice No.',
    kind: 'numberText' as const,
    defaultValue: '0' as WeaponFormValues['damageVersatileCount'],
    helperText: '',
    visibleWhen: isVersatile,
    group: { id: 'damageDiceVersatile', label: 'Damage (Versatile)', helperText: 'Optional. Only used for versatile weapons.' },
    width: 2,
    patchBinding: createOptionalXdYCountBinding({
      domainPath: 'damage.versatile',
      parseOptions: versatileParseOptions,
      countZeroFallback: 0,
    }),
  },
  {
    name: 'damageVersatileDie',
    label: 'Die Type',
    kind: 'select' as const,
    options: DIE_FACE_OPTIONS,
    defaultValue: '8' as WeaponFormValues['damageVersatileDie'],
    visibleWhen: isVersatile,
    group: { id: 'damageDiceVersatile', label: 'Damage (Versatile)' },
    width: 3,
    patchBinding: createOptionalXdYDieBinding({
      domainPath: 'damage.versatile',
      parseOptions: versatileParseOptions,
      countZeroFallback: 0,
      dieFallback: 8,
    }),
  },
  {
    name: 'rangeNormal',
    label: 'Normal',
    kind: 'text' as const,
    path: 'range.normal',
    placeholder: 'e.g. 30',
    defaultValue: '' as WeaponFormValues['rangeNormal'],
    visibleWhen: isRanged,
    group: { id: 'range', label: 'Range (ft)', helperText: 'Only used for ranged weapons.' },
    width: 6,
    patchBinding: {
      domainPath: 'range.normal',
      parse: (v) => (v != null ? String(v) : ''),
      serialize: (s) => {
        if (s == null || (typeof s === 'string' && s.trim() === ''))
          return undefined;
        const n = Number(s);
        return !Number.isNaN(n) ? n : undefined;
      },
    },
  },
  {
    name: 'rangeLong',
    label: 'Long',
    kind: 'text' as const,
    path: 'range.long',
    placeholder: 'e.g. 120',
    defaultValue: '' as WeaponFormValues['rangeLong'],
    visibleWhen: isRanged,
    group: { id: 'range', label: 'Range (ft)', helperText: 'Only used for ranged weapons.'},
    width: 6,
    patchBinding: {
      domainPath: 'range.long',
      parse: (v) => (v != null ? String(v) : ''),
      serialize: (s) => {
        if (s == null || (typeof s === 'string' && s.trim() === ''))
          return undefined;
        const n = Number(s);
        return !Number.isNaN(n) ? n : undefined;
      },
    },
  },
] as const satisfies readonly FieldSpec<
  WeaponFormValues,
  WeaponInput & Record<string, unknown>,
  Weapon & Record<string, unknown>
>[];
