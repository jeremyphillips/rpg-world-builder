import type { DiceOrFlat, dY } from '@/features/mechanics/domain/dice';
import { ABILITIES } from '@/features/mechanics/domain/character/abilities/abilities';

/** Enhance Ability, Contagion (disadvantage on saves), etc. — excludes Constitution where spell text says so. */
export const SPELL_CASTER_ABILITY_OPTIONS_NO_CON: { value: string; label: string }[] = ABILITIES.filter(
  (a) => a.id !== 'con',
).map((a) => ({ value: a.id, label: a.name }));

export { RESISTANCE_SPELL_DAMAGE_TYPE_OPTIONS } from '@/features/mechanics/domain/damage/damageTypeUi';

/** Standard cantrip damage upgrade thresholds (levels 5, 11, 17). */
export function cantripDamageScaling(die: dY) {
  return {
    thresholds: [
      { level: 5, damage: `2${die}` as DiceOrFlat },
      { level: 11, damage: `3${die}` as DiceOrFlat },
      { level: 17, damage: `4${die}` as DiceOrFlat },
    ],
  };
}

/**
 * Authored spell level uses **0** for cantrips. For formulas that need a positive
 * spell tier (e.g. dice-per-spell-level when slots are not modeled), treat **0 as 1**.
 * Does not replace character level for cantrip damage scaling (`levelScaling` / `cantripDamageScaling`).
 */
export function effectiveSpellLevelForScaling(spellLevel: number): number {
  return spellLevel <= 0 ? 1 : spellLevel;
}
