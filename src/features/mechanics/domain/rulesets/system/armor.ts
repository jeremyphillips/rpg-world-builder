/**
 * System armor catalog — code-defined armor entries per system ruleset.
 *
 * These are the "factory defaults" for armor (SRD_CC_v5_2_1). Campaign-owned
 * custom armor is stored in the DB and merged at runtime by the armorRepo.
 */
import type { Armor, ArmorFields } from '@/features/content/equipment/armor/domain/types';
import type { SystemRulesetId } from '../types/ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds';

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

export function toSystemArmor(systemId: SystemRulesetId, raw: ArmorFields): Armor {
  return {
    ...raw,
    source: 'system',
    systemId,
    patched: false,
  };
}

// ---------------------------------------------------------------------------
// 5e v1 system armor (SRD_CC_v5_2_1)
// ---------------------------------------------------------------------------

const ARMOR_RAW: readonly ArmorFields[] = [
  // LIGHT ARMOR
  { id: 'leather', name: 'Leather', material: 'organic', category: 'light', cost: { coin: 'gp', value: 10 }, baseAC: 11, dex: { mode: 'full' }, weight: { value: 10, unit: 'lb' } },
  { id: 'studded-leather', name: 'Studded Leather', material: 'metal', category: 'light', cost: { coin: 'gp', value: 45 }, baseAC: 12, dex: { mode: 'full' }, weight: { value: 13, unit: 'lb' } },
  // MEDIUM ARMOR
  { id: 'hide', name: 'Hide', material: 'organic', category: 'medium', cost: { coin: 'gp', value: 10 }, baseAC: 12, stealthDisadvantage: false, dex: { mode: 'capped', maxBonus: 2 }, weight: { value: 12, unit: 'lb' } },
  { id: 'chain-shirt', name: 'Chain Shirt', material: 'metal', category: 'medium', cost: { coin: 'gp', value: 50 }, baseAC: 13, stealthDisadvantage: false, dex: { mode: 'capped', maxBonus: 2 }, weight: { value: 20, unit: 'lb' } },
  { id: 'scale-mail', name: 'Scale Mail', material: 'metal', category: 'medium', cost: { coin: 'gp', value: 50 }, baseAC: 14, stealthDisadvantage: true, dex: { mode: 'capped', maxBonus: 2 }, weight: { value: 45, unit: 'lb' } },
  { id: 'breastplate', name: 'Breastplate', material: 'metal', category: 'medium', cost: { coin: 'gp', value: 400 }, baseAC: 14, stealthDisadvantage: false, dex: { mode: 'capped', maxBonus: 2 }, weight: { value: 20, unit: 'lb' } },
  { id: 'half-plate', name: 'Half Plate', material: 'metal', category: 'medium', cost: { coin: 'gp', value: 750 }, baseAC: 15, stealthDisadvantage: true, dex: { mode: 'capped', maxBonus: 2 }, weight: { value: 40, unit: 'lb' } },
  // HEAVY ARMOR
  { id: 'ring-mail', name: 'Ring Mail', material: 'metal', category: 'heavy', cost: { coin: 'gp', value: 30 }, baseAC: 14, stealthDisadvantage: true, dex: { mode: 'none' }, weight: { value: 40, unit: 'lb' } },
  { id: 'chain-mail', name: 'Chain Mail', material: 'metal', category: 'heavy', cost: { coin: 'gp', value: 75 }, baseAC: 16, stealthDisadvantage: true, minStrength: 13, dex: { mode: 'none' }, weight: { value: 55, unit: 'lb' } },
  { id: 'splint', name: 'Splint', material: 'metal', category: 'heavy', cost: { coin: 'gp', value: 200 }, baseAC: 17, stealthDisadvantage: true, minStrength: 15, dex: { mode: 'none' }, weight: { value: 60, unit: 'lb' } },
  { id: 'plate', name: 'Plate', material: 'metal', category: 'heavy', cost: { coin: 'gp', value: 1500 }, baseAC: 18, stealthDisadvantage: true, minStrength: 15, dex: { mode: 'none' }, weight: { value: 65, unit: 'lb' } },
  // SHIELDS
  { id: 'shield-wood', name: 'Shield (Wood)', material: 'organic', category: 'shields', cost: { coin: 'gp', value: 10 }, stealthDisadvantage: false, dex: { mode: 'none' }, acBonus: 2, weight: { value: 6, unit: 'lb' } },
  { id: 'shield-steel', name: 'Shield (Steel)', material: 'metal', category: 'shields', cost: { coin: 'gp', value: 10 }, stealthDisadvantage: false, dex: { mode: 'none' }, acBonus: 2, weight: { value: 6, unit: 'lb' } },
];

const SYSTEM_ARMOR_SRD_CC_V5_2_1: readonly Armor[] = ARMOR_RAW.map(a => toSystemArmor(DEFAULT_SYSTEM_RULESET_ID, a));

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SYSTEM_ARMOR_BY_SYSTEM_ID: Record<SystemRulesetId, readonly Armor[]> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_ARMOR_SRD_CC_V5_2_1,
};

export function getSystemArmor(systemId: SystemRulesetId): readonly Armor[] {
  return SYSTEM_ARMOR_BY_SYSTEM_ID[systemId] ?? [];
}

export function getSystemArmorEntry(systemId: SystemRulesetId, id: string): Armor | undefined {
  return getSystemArmor(systemId).find(a => a.id === id);
}
