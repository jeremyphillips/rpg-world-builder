import {
  buildXdY,
  type DiceOrFlat,
  toCount,
  toDieFace,
} from '@/shared/domain/dice';
import type { DamageType } from '@/features/mechanics/domain/damage/damage.types';
import type { SpellEffect, SpellEffectGroup } from '@/features/content/spells/domain/types';
import type { SpellEffectFormRow, SpellEffectGroupFormRow } from '../types/spellForm.types';
import type { EffectConditionId } from '@/features/content/shared/domain/vocab/effectConditions.vocab';
import {
  getSpellEffectKindPhase1SelectOptions,
  isSpellEffectPhase1Kind,
} from '../options/spellEffectKinds.phase1';

const STUB_KINDS = new Set<string>(['grant', 'immunity', 'save', 'check', 'state']);

function parseDiceOrFlat(raw: unknown): DiceOrFlat | undefined {
  if (raw == null) return undefined;
  const t = String(raw).trim();
  if (t === '') return undefined;
  const n = Number(t);
  if (!Number.isNaN(n) && t === String(n)) {
    return n as DiceOrFlat;
  }
  return t as DiceOrFlat;
}

function parseOptionalPositiveInt(raw: string): number | undefined {
  const t = raw.trim();
  if (t === '') return undefined;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

/** Builds `XdY`, `XdY+N`, or `XdY-N` from draft dice fields (dice mode only). */
export function assembleDiceDamageString(row: Pick<SpellEffectFormRow, 'damageDiceCount' | 'damageDieFace' | 'damageModifier'>): string | undefined {
  const count = toCount(row.damageDiceCount, 1);
  const die = toDieFace(row.damageDieFace, 6);
  const base = buildXdY({ count, die });
  const modRaw = String(row.damageModifier ?? '').trim();
  if (modRaw === '') return base;
  const mod = parseInt(modRaw, 10);
  if (!Number.isFinite(mod) || mod === 0) return base;
  return `${base}${mod > 0 ? '+' : ''}${mod}`;
}

/** Maps domain `DiceOrFlat` into draft damage fields for round-trip editing. */
export function damageToDraftFields(damage: DiceOrFlat): Pick<
  SpellEffectFormRow,
  'damageFormat' | 'damageDiceCount' | 'damageDieFace' | 'damageModifier' | 'damageFlatValue'
> {
  if (typeof damage === 'number') {
    return {
      damageFormat: 'flat',
      damageDiceCount: '1',
      damageDieFace: '6',
      damageModifier: '',
      damageFlatValue: String(damage),
    };
  }
  const s = String(damage).trim();
  const m = s.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (m) {
    const modPart = m[3];
    const modDisplay = modPart ? String(parseInt(modPart, 10)) : '';
    return {
      damageFormat: 'dice',
      damageDiceCount: m[1],
      damageDieFace: m[2],
      damageModifier: modDisplay,
      damageFlatValue: '',
    };
  }
  const n = Number(s);
  if (!Number.isNaN(n) && s === String(n)) {
    return {
      damageFormat: 'flat',
      damageDiceCount: '1',
      damageDieFace: '6',
      damageModifier: '',
      damageFlatValue: s,
    };
  }
  return {
    damageFormat: 'flat',
    damageDiceCount: '1',
    damageDieFace: '6',
    damageModifier: '',
    damageFlatValue: s,
  };
}

/** Default row for a new effect in the nested repeat (includes all draft keys). */
export function createDefaultSpellEffectFormRow(): SpellEffectFormRow {
  const firstKind = getSpellEffectKindPhase1SelectOptions()[0]?.value ?? 'damage';
  return {
    kind: isSpellEffectPhase1Kind(firstKind) ? firstKind : 'damage',
    noteText: '',
    noteCategory: '',
    damageDiceCount: '1',
    damageFormat: 'dice',
    damageDieFace: '6',
    damageModifier: '',
    damageFlatValue: '',
    damageType: '',
    conditionId: '',
    moveDistance: '',
    moveForced: false,
    resourceId: '',
    resourceMax: '',
    resourceRecharge: 'none',
  };
}

export function formRowToSpellEffect(row: SpellEffectFormRow): SpellEffect | null {
  const k = row.kind;
  if (k === '' || !isSpellEffectPhase1Kind(k)) return null;
  if (STUB_KINDS.has(k)) return null;

  switch (k) {
    case 'note': {
      const text = row.noteText.trim();
      if (!text) return null;
      return { kind: 'note', text } as SpellEffect;
    }
    case 'damage': {
      const mode = row.damageFormat === 'flat' ? 'flat' : 'dice';
      let damage: DiceOrFlat | undefined;
      if (mode === 'flat') {
        damage = parseDiceOrFlat(row.damageFlatValue);
      } else {
        const assembled = assembleDiceDamageString(row);
        damage = assembled !== undefined ? (assembled as DiceOrFlat) : undefined;
      }
      if (damage === undefined) return null;
      const out: SpellEffect = {
        kind: 'damage',
        damage,
      } as SpellEffect;
      const de = out as Extract<SpellEffect, { kind: 'damage' }>;
      if (row.damageType.trim()) {
        de.damageType = row.damageType.trim() as DamageType;
      }
      return out;
    }
    case 'condition': {
      const id = row.conditionId.trim() as EffectConditionId;
      if (!id) return null;
      return { kind: 'condition', conditionId: id } as SpellEffect;
    }
    case 'move': {
      const distance = parseOptionalPositiveInt(String(row.moveDistance));
      const out: SpellEffect = {
        kind: 'move',
        forced: Boolean(row.moveForced),
      } as SpellEffect;
      const me = out as Extract<SpellEffect, { kind: 'move' }>;
      if (distance !== undefined) me.distance = distance;
      return out;
    }
    case 'resource': {
      const id = row.resourceId.trim();
      if (!id) return null;
      const maxRaw = parseOptionalPositiveInt(String(row.resourceMax));
      if (maxRaw === undefined) return null;
      return {
        kind: 'resource',
        resource: {
          id,
          max: maxRaw,
          recharge: row.resourceRecharge,
        },
      } as SpellEffect;
    }
    default:
      return null;
  }
}

export function spellEffectToFormRow(effect: SpellEffect): SpellEffectFormRow {
  const base = createDefaultSpellEffectFormRow();
  switch (effect.kind) {
    case 'note':
      return {
        ...base,
        kind: 'note',
        noteText: effect.text,
        noteCategory: effect.category ?? '',
      };
    case 'damage':
      return {
        ...base,
        kind: 'damage',
        ...damageToDraftFields(effect.damage),
        damageType: effect.damageType ?? '',
      };
    case 'condition':
      return {
        ...base,
        kind: 'condition',
        conditionId: effect.conditionId,
      };
    case 'move':
      return {
        ...base,
        kind: 'move',
        moveDistance: effect.distance != null ? String(effect.distance) : '',
        moveForced: Boolean(effect.forced),
      };
    case 'resource':
      return {
        ...base,
        kind: 'resource',
        resourceId: effect.resource.id,
        resourceMax: String(
          typeof effect.resource.max === 'number' ? effect.resource.max : '',
        ),
        resourceRecharge: effect.resource.recharge,
      };
    default: {
      if (isSpellEffectPhase1Kind(effect.kind)) {
        return { ...base, kind: effect.kind };
      }
      return {
        ...base,
        kind: 'note',
        noteText: `(Unsupported effect kind in form: ${(effect as SpellEffect).kind})`,
      };
    }
  }
}

export function spellEffectGroupsFormToDomain(
  rows: SpellEffectGroupFormRow[] | undefined,
): SpellEffectGroup[] | undefined {
  if (rows == null || !Array.isArray(rows)) return undefined;
  return rows.map((g) => ({
    targeting:
      g.targeting.selection && g.targeting.targetType
        ? {
            selection: g.targeting.selection,
            targetType: g.targeting.targetType,
          }
        : undefined,
    effects: (g.effects ?? [])
      .map((row) => formRowToSpellEffect(row))
      .filter((e): e is SpellEffect => e != null),
  }));
}

export function spellEffectGroupsDomainToForm(
  domain: SpellEffectGroup[] | undefined,
): SpellEffectGroupFormRow[] {
  if (domain == null || !Array.isArray(domain)) return [];
  return domain.map((g) => ({
    targeting: {
      selection: (g.targeting?.selection ?? '') as SpellEffectGroupFormRow['targeting']['selection'],
      targetType: (g.targeting?.targetType ?? '') as SpellEffectGroupFormRow['targeting']['targetType'],
    },
    effects: (g.effects ?? []).map((e) => spellEffectToFormRow(e)),
  }));
}
