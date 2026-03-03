/**
 * Pure mappers for Weapon form values ↔ domain types.
 * Registry-backed with required-field merging.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { Weapon, WeaponInput } from '@/features/content/domain/types';
import { buildDefaultFormValues } from '@/features/content/forms/registry';
import { WEAPON_FORM_FIELDS } from './weaponForm.registry';
import type { WeaponFormValues } from './weaponForm.types';

const defaultFormValues = buildDefaultFormValues(WEAPON_FORM_FIELDS);

const toOptionalNumber = (s: string): number | undefined => {
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const trimOrNull = (s: string): string | null =>
  s.trim() ? s.trim() : null;

const VALID_DIE_FACES = [4, 6, 8, 10, 12, 20] as const;

function parseDamage(s: string | undefined): { count: number; die: number } {
  if (!s || typeof s !== 'string') return { count: 1, die: 6 };
  const m = s.trim().match(/^(\d+)d(\d+)$/i);
  if (!m) return { count: 1, die: 6 };
  const count = Math.max(1, parseInt(m[1], 10) || 1);
  const dieNum = parseInt(m[2], 10);
  const die = VALID_DIE_FACES.includes(dieNum as (typeof VALID_DIE_FACES)[number])
    ? dieNum
    : 6;
  return { count, die };
}

function parseDamageVersatile(s: string | undefined): { count: number; die: number } {
  if (!s || typeof s !== 'string' || !s.trim()) return { count: 0, die: 8 };
  const m = s.trim().match(/^(\d+)d(\d+)$/i);
  if (!m) return { count: 0, die: 8 };
  const count = Math.max(0, parseInt(m[1], 10) || 0);
  const dieNum = parseInt(m[2], 10);
  const die = VALID_DIE_FACES.includes(dieNum as (typeof VALID_DIE_FACES)[number])
    ? dieNum
    : 8;
  return { count: count || 0, die };
}

/**
 * Converts a Weapon domain object to form values.
 * Handles nested damage/range structure (not 1:1 with item).
 */
export const weaponToFormValues = (weapon: Weapon): WeaponFormValues => {
  const { count, die } = parseDamage(weapon.damage?.default);
  const versatile = parseDamageVersatile(weapon.damage?.versatile);
  return {
    ...(defaultFormValues as WeaponFormValues),
    name: weapon.name,
    description: weapon.description ?? '',
    imageKey: weapon.imageKey ?? '',
    accessPolicy: (weapon.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC) as WeaponFormValues['accessPolicy'],
    category: (weapon.category ?? '') as WeaponFormValues['category'],
    mode: (weapon.mode ?? '') as WeaponFormValues['mode'],
    damageDefaultCount: count,
    damageDefaultDie: String(die),
    damageVersatileCount: versatile.count,
    damageVersatileDie: String(versatile.die),
    damageType: weapon.damageType ?? '',
    mastery: (weapon as { mastery?: string }).mastery ?? '',
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
  const count = Number(values.damageDefaultCount) || 1;
  const die = Number(values.damageDefaultDie) || 6;
  const damageDefault = `${count}d${die}`;
  const damage: { default: string; versatile?: string } = {
    default: damageDefault,
  };
  const vCount = Number(values.damageVersatileCount) || 0;
  if (vCount > 0) {
    const vDie = Number(values.damageVersatileDie) || 6;
    damage.versatile = `${vCount}d${vDie}`;
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
    imageKey: trimOrNull(values.imageKey),
    accessPolicy: values.accessPolicy,
    category: values.category
      ? (values.category as WeaponInput['category'])
      : undefined,
    mode: values.mode ? (values.mode as WeaponInput['mode']) : undefined,
    damage,
    damageType: values.damageType.trim() || undefined,
    properties: values.properties,
    ...(range && { range }),
  };

  if (values.mastery.trim()) {
    (input as WeaponInput & { mastery?: string }).mastery =
      values.mastery.trim();
  }

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
    const { count, die } = parseDamage(damage.default);
    out.damageDefaultCount = count;
    out.damageDefaultDie = String(die);
  }
  if (damage?.versatile) {
    const versatile = parseDamageVersatile(damage.versatile);
    out.damageVersatileCount = versatile.count;
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
    const count = Number(patch.damageDefaultCount) || 1;
    const die = Number(patch.damageDefaultDie) || 6;
    damage = { ...damage, default: `${count}d${die}` };
    delete out.damageDefaultCount;
    delete out.damageDefaultDie;
  }

  const hasVersatileFields =
    'damageVersatileCount' in patch || 'damageVersatileDie' in patch;
  if (hasVersatileFields) {
    const vCount = Number(patch.damageVersatileCount) || 0;
    delete out.damageVersatileCount;
    delete out.damageVersatileDie;
    if (vCount > 0) {
      const vDie = Number(patch.damageVersatileDie) || 6;
      damage = { ...damage, versatile: `${vCount}d${vDie}` };
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
