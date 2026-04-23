import {
  DAMAGE_TYPE_FULL_SELECT_OPTIONS,
  DAMAGE_TYPE_ROWS,
  getDamageTypeDisplayName,
  type DamageTypeRowId,
} from '@/features/content/shared/domain/vocab/damage/damageTypeDisplay.vocab';

/**
 * Resistance cantrip — SRD order; subset of {@link DAMAGE_TYPE_ROWS} (excludes force, psychic).
 */
const RESISTANCE_SPELL_DAMAGE_TYPE_IDS = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'radiant',
  'slashing',
  'thunder',
] as const;

export const RESISTANCE_SPELL_DAMAGE_TYPE_OPTIONS: { value: string; label: string }[] =
  RESISTANCE_SPELL_DAMAGE_TYPE_IDS.map((id) => {
    const row = DAMAGE_TYPE_ROWS.find((r) => r.id === id);
    if (!row) {
      throw new Error(`RESISTANCE_SPELL_DAMAGE_TYPE_IDS: missing DAMAGE_TYPE_ROWS entry for "${id}"`);
    }
    return { value: row.id, label: row.name };
  });

export {
  DAMAGE_TYPE_FULL_SELECT_OPTIONS as DAMAGE_TYPE_SELECT_OPTIONS,
  DAMAGE_TYPE_ROWS,
  getDamageTypeDisplayName,
  type DamageTypeRowId,
};
