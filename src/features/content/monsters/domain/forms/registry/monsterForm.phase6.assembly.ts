/**
 * Phase 6 — shared serialization for monster senses specials, equipment records,
 * and patch bindings (mirrors {@link toMonsterInput} assembly).
 */
import type { CreatureSense } from '@/features/content/shared/domain/vocab/creatureSenses.types';
import type {
  MonsterEquippedArmor,
  MonsterEquippedWeapon,
} from '@/features/content/monsters/domain/types/monster-equipment.types';
import type { MonsterLanguage } from '@/features/content/monsters/domain/types/monster.types';
import {
  createRowId,
  mergePreserveExtras,
  tagRowsWithIds,
} from '@/features/content/shared/forms/assembly/mergePreserveExtras';

const numOrUndefined = (v: unknown): number | undefined => {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export type MonsterSenseSpecialFormRow = {
  __rowId?: string;
  type: string;
  range: string;
};

export type MonsterLanguageFormRow = {
  __rowId?: string;
  id: string;
  speaks: boolean;
};

export type MonsterEquipmentWeaponFormRow = {
  __rowId?: string;
  ref: string;
  weaponId: string;
  aliasName: string;
  attackBonus: string;
  damageBonus: string;
  reach: string;
  notes: string;
};

export type MonsterWeaponMergeRow = MonsterEquippedWeapon & { ref: string };

export type MonsterEquipmentArmorFormRow = {
  __rowId?: string;
  ref: string;
  armorId: string;
  aliasName: string;
  notes: string;
  acModifier: string;
};

export type MonsterArmorMergeRow = MonsterEquippedArmor & { ref: string };

export const MONSTER_SENSE_SPECIAL_OWNED_KEYS = ['type', 'range'] as const;

export const MONSTER_LANGUAGE_OWNED_KEYS = ['id', 'speaks'] as const satisfies readonly (keyof MonsterLanguage)[];

export const MONSTER_EQUIPMENT_WEAPON_OWNED_KEYS = [
  'ref',
  'weaponId',
  'aliasName',
  'attackBonus',
  'damageBonus',
  'reach',
  'notes',
] as const satisfies readonly (keyof MonsterWeaponMergeRow)[];

export const MONSTER_EQUIPMENT_ARMOR_OWNED_KEYS = [
  'ref',
  'armorId',
  'aliasName',
  'notes',
  'acModifier',
] as const satisfies readonly (keyof MonsterArmorMergeRow)[];

export function normalizeSenseRowAfterMerge(row: CreatureSense): CreatureSense {
  const rangeRaw = row.range as unknown;
  const n =
    typeof rangeRaw === 'string'
      ? numOrUndefined(rangeRaw)
      : typeof rangeRaw === 'number'
        ? rangeRaw
        : undefined;
  const next: CreatureSense = {
    type: row.type,
    ...(row.notes !== undefined ? { notes: row.notes } : {}),
    ...(row.source !== undefined ? { source: row.source } : {}),
  };
  if (n !== undefined) next.range = n;
  return next;
}

export function senseSpecialSerialize(
  uiValue: unknown,
  currentDomainValue: unknown,
): (CreatureSense & { __rowId?: string })[] {
  const formRows = Array.isArray(uiValue)
    ? (uiValue as ReadonlyArray<MonsterSenseSpecialFormRow & Partial<CreatureSense>>)
    : [];
  const sourceRows = Array.isArray(currentDomainValue)
    ? (currentDomainValue as ReadonlyArray<CreatureSense & { __rowId?: string }>)
    : undefined;
  const merged = mergePreserveExtras<CreatureSense>(formRows, sourceRows, MONSTER_SENSE_SPECIAL_OWNED_KEYS);
  return merged.map((row, i) => {
    const normalized = normalizeSenseRowAfterMerge(row);
    return {
      ...normalized,
      __rowId: formRows[i]?.__rowId ?? createRowId(),
    };
  });
}

export function weaponRecordToFormRows(
  weapons: Record<string, MonsterEquippedWeapon & { __rowId?: string }> | undefined,
): MonsterEquipmentWeaponFormRow[] {
  if (!weapons || typeof weapons !== 'object') return [];
  return Object.entries(weapons).map(([ref, w]) => ({
    __rowId: w.__rowId ?? '',
    ref,
    weaponId: w.weaponId ?? '',
    aliasName: w.aliasName ?? '',
    attackBonus: w.attackBonus != null && Number.isFinite(Number(w.attackBonus)) ? String(w.attackBonus) : '',
    damageBonus: w.damageBonus != null && Number.isFinite(Number(w.damageBonus)) ? String(w.damageBonus) : '',
    reach: w.reach != null && Number.isFinite(Number(w.reach)) ? String(w.reach) : '',
    notes: w.notes ?? '',
  }));
}

function normalizeWeaponDomainFields(
  row: Partial<MonsterWeaponMergeRow>,
): MonsterEquippedWeapon {
  const weaponId = typeof row.weaponId === 'string' ? row.weaponId : '';
  const w: MonsterEquippedWeapon = { weaponId };
  const aliasName =
    typeof row.aliasName === 'string' && row.aliasName.trim() !== '' ? row.aliasName.trim() : undefined;
  if (aliasName !== undefined) w.aliasName = aliasName;
  const ab = numOrUndefined(row.attackBonus as unknown);
  if (ab !== undefined) w.attackBonus = ab;
  const db = numOrUndefined(row.damageBonus as unknown);
  if (db !== undefined) w.damageBonus = db;
  const r = numOrUndefined(row.reach as unknown);
  if (r !== undefined) w.reach = r;
  const notes = typeof row.notes === 'string' && row.notes.trim() !== '' ? row.notes : undefined;
  if (notes !== undefined) w.notes = notes;
  if (row.damageOverride !== undefined) w.damageOverride = row.damageOverride;
  return w;
}

export function weaponFormRowsToDomainRecord(
  formRows: ReadonlyArray<MonsterEquipmentWeaponFormRow & Partial<MonsterWeaponMergeRow>>,
  source: Record<string, MonsterEquippedWeapon & { __rowId?: string }> | undefined,
): Record<string, MonsterEquippedWeapon & { __rowId?: string }> | undefined {
  if (formRows.length === 0) return undefined;
  const sourceList = source
    ? Object.entries(source).map(([ref, w]) => ({ ref, ...w }))
    : [];
  const taggedSource = tagRowsWithIds(sourceList as readonly Record<string, unknown>[]);
  const merged = mergePreserveExtras<MonsterWeaponMergeRow>(
    formRows as ReadonlyArray<MonsterWeaponMergeRow & { __rowId?: string }>,
    taggedSource as ReadonlyArray<MonsterWeaponMergeRow & { __rowId?: string }>,
    MONSTER_EQUIPMENT_WEAPON_OWNED_KEYS,
  );
  const out: Record<string, MonsterEquippedWeapon & { __rowId?: string }> = {};
  for (let i = 0; i < merged.length; i++) {
    const row = merged[i];
    const ref = row.ref?.trim();
    if (!ref) continue;
    const rawId = (formRows[i] as { __rowId?: string } | undefined)?.__rowId;
    const body = normalizeWeaponDomainFields(row);
    out[ref] =
      rawId && rawId.length > 0 ? { ...body, __rowId: rawId } : { ...body, __rowId: createRowId() };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function armorRecordToFormRows(
  armor: Record<string, MonsterEquippedArmor & { __rowId?: string }> | undefined,
): MonsterEquipmentArmorFormRow[] {
  if (!armor || typeof armor !== 'object') return [];
  return Object.entries(armor).map(([ref, a]) => ({
    __rowId: a.__rowId ?? '',
    ref,
    armorId: a.armorId ?? '',
    aliasName: a.aliasName ?? '',
    notes: a.notes ?? '',
    acModifier: a.acModifier != null && Number.isFinite(Number(a.acModifier)) ? String(a.acModifier) : '',
  }));
}

function normalizeArmorDomainFields(row: Partial<MonsterArmorMergeRow>): MonsterEquippedArmor {
  const armorId = typeof row.armorId === 'string' ? row.armorId : '';
  const a: MonsterEquippedArmor = { armorId };
  const aliasName =
    typeof row.aliasName === 'string' && row.aliasName.trim() !== '' ? row.aliasName.trim() : undefined;
  if (aliasName !== undefined) a.aliasName = aliasName;
  const notes = typeof row.notes === 'string' && row.notes.trim() !== '' ? row.notes : undefined;
  if (notes !== undefined) a.notes = notes;
  const ac = numOrUndefined(row.acModifier as unknown);
  if (ac !== undefined) a.acModifier = ac;
  return a;
}

export function armorFormRowsToDomainRecord(
  formRows: ReadonlyArray<MonsterEquipmentArmorFormRow & Partial<MonsterArmorMergeRow>>,
  source: Record<string, MonsterEquippedArmor & { __rowId?: string }> | undefined,
): Record<string, MonsterEquippedArmor & { __rowId?: string }> | undefined {
  if (formRows.length === 0) return undefined;
  const sourceList = source ? Object.entries(source).map(([ref, a]) => ({ ref, ...a })) : [];
  const taggedSource = tagRowsWithIds(sourceList as readonly Record<string, unknown>[]);
  const merged = mergePreserveExtras<MonsterArmorMergeRow>(
    formRows as ReadonlyArray<MonsterArmorMergeRow & { __rowId?: string }>,
    taggedSource as ReadonlyArray<MonsterArmorMergeRow & { __rowId?: string }>,
    MONSTER_EQUIPMENT_ARMOR_OWNED_KEYS,
  );
  const out: Record<string, MonsterEquippedArmor & { __rowId?: string }> = {};
  for (let i = 0; i < merged.length; i++) {
    const row = merged[i];
    const ref = row.ref?.trim();
    if (!ref) continue;
    const rawId = (formRows[i] as { __rowId?: string } | undefined)?.__rowId;
    const body = normalizeArmorDomainFields(row);
    out[ref] =
      rawId && rawId.length > 0 ? { ...body, __rowId: rawId } : { ...body, __rowId: createRowId() };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function languagesFormRowsToDomain(
  formRows: ReadonlyArray<MonsterLanguageFormRow>,
  source: ReadonlyArray<MonsterLanguage & { __rowId?: string }> | undefined,
): MonsterLanguage[] | undefined {
  if (formRows.length === 0) return undefined;
  const merged = mergePreserveExtras<MonsterLanguage>(
    formRows as ReadonlyArray<MonsterLanguageFormRow & Partial<MonsterLanguage>>,
    source,
    MONSTER_LANGUAGE_OWNED_KEYS,
  );
  const out: MonsterLanguage[] = [];
  for (const row of merged) {
    const id = typeof row.id === 'string' ? row.id.trim() : '';
    if (!id) continue;
    if (row.speaks) out.push({ id, speaks: true });
    else out.push({ id });
  }
  return out.length > 0 ? out : undefined;
}

/** Patch-mode round-trip for `languages[]` (re-attaches transient `__rowId`). */
export function languagesSerialize(
  uiValue: unknown,
  currentDomainValue: unknown,
): (MonsterLanguage & { __rowId?: string })[] {
  const formRows = Array.isArray(uiValue) ? (uiValue as MonsterLanguageFormRow[]) : [];
  const sourceRows = Array.isArray(currentDomainValue)
    ? (currentDomainValue as ReadonlyArray<MonsterLanguage & { __rowId?: string }>)
    : undefined;
  const merged = mergePreserveExtras<MonsterLanguage>(
    formRows as ReadonlyArray<MonsterLanguageFormRow & Partial<MonsterLanguage>>,
    sourceRows,
    MONSTER_LANGUAGE_OWNED_KEYS,
  );
  return merged
    .map((row, i) => {
      const id = typeof row.id === 'string' ? row.id.trim() : '';
      if (!id) return null;
      const base: MonsterLanguage & { __rowId: string } = {
        id,
        __rowId: formRows[i]?.__rowId ?? createRowId(),
      };
      if (row.speaks) base.speaks = true;
      return base;
    })
    .filter((row): row is MonsterLanguage & { __rowId: string } => row != null);
}
