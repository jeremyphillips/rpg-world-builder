/**
 * Select options for spell/effect damage type (energy types used by most spells).
 */
import { ENERGY_DAMAGE_TYPES } from './energyDamageTypes.vocab';

export const DAMAGE_TYPE_SELECT_OPTIONS = ENERGY_DAMAGE_TYPES.map((r) => ({
  value: r.id,
  label: r.name,
}));
