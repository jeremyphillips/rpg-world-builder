/**
 * Pure mappers for Weapon form values ↔ domain types.
 * Registry-backed with required-field merging.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type {
  Weapon,
  WeaponInput,
  WeaponFields,
} from '@/features/content/domain/types';
import { buildDefaultFormValues } from '@/features/content/forms/registry';
import {
  buildXdY,
  parseXdY,
  toCount,
  toCountOrZero,
  toDieFace,
} from '@/features/mechanics/domain/dice';
import { WEAPON_FORM_FIELDS } from '../registry/weaponForm.registry';
import type { WeaponFormValues } from '../types/weaponForm.types';

const defaultFormValues = buildDefaultFormValues(WEAPON_FORM_FIELDS);

const toOptionalNumber = (s: string): number | undefined => {
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const trimOrUndefined = (s: string): string | undefined =>
  s.trim() ? s.trim() : undefined;

/**
 * Converts a Weapon domain object to form values.
 * Handles nested damage/range structure (not 1:1 with item).
 */
export const weaponToFormValues = (weapon: Weapon): WeaponFormValues => {
  const defaultStr =
    weapon.damage?.default != null ? String(weapon.damage.default) : undefined;
  const versatileStr =
    weapon.damage?.versatile != null ? String(weapon.damage.versatile) : undefined;
  const { count, die } = parseXdY(defaultStr);
  const versatile = parseXdY(versatileStr, {
    defaultCount: 0,
    defaultDie: 8,
  });
  return {
    ...(defaultFormValues as WeaponFormValues),
    name: weapon.name,
    description: weapon.description ?? '',
    imageKey: weapon.imageKey ?? '',
    accessPolicy: (weapon.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC) as WeaponFormValues['accessPolicy'],
    category: (weapon.category ?? '') as WeaponFormValues['category'],
    mode: (weapon.mode ?? '') as WeaponFormValues['mode'],
    damageDefaultCount: String(count),
    damageDefaultDie: String(die),
    damageVersatileCount: String(versatile.count),
    damageVersatileDie: String(versatile.die),
    damageType: weapon.damageType ?? '',
    rangeNormal: weapon.range?.normal != null ? String(weapon.range.normal) : '',
    rangeLong: weapon.range?.long != null ? String(weapon.range.long) : '',
    properties: weapon.properties ?? [],
  };
};

/**
 * Converts form values to WeaponInput for create/update.
 * Handles nested damage and range structure.
 */
export const toWeaponInput = (values: WeaponFormValues): WeaponInput => {
  const count = toCount(values.damageDefaultCount, 1);
  const die = toDieFace(values.damageDefaultDie, 6);
  const damageDefault = buildXdY({ count, die });
  const damage: WeaponFields['damage'] = {
    default: damageDefault,
  };
  const vCount = toCountOrZero(values.damageVersatileCount, 0);
  if (vCount > 0) {
    const vDie = toDieFace(values.damageVersatileDie, 6);
    damage.versatile = buildXdY({ count: vCount, die: vDie });
  }

  let range: { normal: number; long?: number; unit: 'ft' } | undefined;
  if (values.mode === 'ranged') {
    const normal = toOptionalNumber(values.rangeNormal);
    if (normal != null) {
      const long = toOptionalNumber(values.rangeLong);
      range = {
        normal,
        ...(long != null && { long }),
        unit: 'ft',
      };
    }
  }

  const input: WeaponInput = {
    name: values.name.trim(),
    description: values.description.trim(),
    imageKey: trimOrUndefined(values.imageKey),
    accessPolicy: values.accessPolicy,
    category: values.category
      ? (values.category as WeaponInput['category'])
      : undefined,
    mode: values.mode ? (values.mode as WeaponInput['mode']) : undefined,
    damage,
    damageType: (values.damageType.trim() || undefined) as WeaponInput['damageType'],
    properties: values.properties,
    ...(range && { range }),
  };

  return input;
};

/**
 * Converts a weapon domain-style patch to form-style patch.
 * Used when loading system item patches so form fields (damageDefaultCount/die) display correctly.
 */
export const weaponDomainPatchToForm = (
  patch: Record<string, unknown>
): Record<string, unknown> => {
  const out = { ...patch };
  const damage = patch.damage as { default?: string; versatile?: string } | undefined;
  if (damage?.default) {
    const { count, die } = parseXdY(damage.default);
    out.damageDefaultCount = String(count);
    out.damageDefaultDie = String(die);
  }
  if (damage?.versatile) {
    const versatile = parseXdY(damage.versatile, {
      defaultCount: 0,
      defaultDie: 8,
    });
    out.damageVersatileCount = String(versatile.count);
    out.damageVersatileDie = String(versatile.die);
  }
  if ('damage' in out) {
    delete out.damage;
  }
  return out;
};

/**
 * Converts a weapon form-style patch to domain-style patch.
 * Used when saving system item patches (damageDefaultCount/die -> damage.default).
 */
export const weaponPatchToDomain = (
  patch: Record<string, unknown>
): Record<string, unknown> => {
  const out = { ...patch };
  let damage: Record<string, unknown> = (out.damage ?? {}) as Record<string, unknown>;

  const hasDamageFields =
    'damageDefaultCount' in patch || 'damageDefaultDie' in patch;
  if (hasDamageFields) {
    const count = toCount(patch.damageDefaultCount, 1);
    const die = toDieFace(patch.damageDefaultDie, 6);
    damage = { ...damage, default: buildXdY({ count, die }) };
    delete out.damageDefaultCount;
    delete out.damageDefaultDie;
  }

  const hasVersatileFields =
    'damageVersatileCount' in patch || 'damageVersatileDie' in patch;
  if (hasVersatileFields) {
    const vCount = toCountOrZero(patch.damageVersatileCount, 0);
    delete out.damageVersatileCount;
    delete out.damageVersatileDie;
    if (vCount > 0) {
      const vDie = toDieFace(patch.damageVersatileDie, 6);
      damage = { ...damage, versatile: buildXdY({ count: vCount, die: vDie }) };
    } else {
      const { versatile: _, ...rest } = damage;
      damage = rest;
    }
  }

  if (Object.keys(damage).length > 0) {
    out.damage = damage;
  } else if ('damage' in out) {
    delete out.damage;
  }
  return out;
};
