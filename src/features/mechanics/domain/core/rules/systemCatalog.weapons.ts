/**
 * System weapon catalog — code-defined weapon entries per system ruleset.
 *
 * These are the "factory defaults" for weapons (SRD_CC_v5_2_1). Campaign-owned
 * custom weapons are stored in the DB and merged at runtime by the weaponRepo.
 */
import type { Weapon, WeaponFields } from '@/features/content/domain/types';
import type { SystemRulesetId } from './ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from './systemIds';

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

export function toSystemWeapon(systemId: SystemRulesetId, raw: WeaponFields): Weapon {
  return {
    ...raw,
    source: 'system',
    systemId,
    patched: false,
  };
}

// ---------------------------------------------------------------------------
// 5e v1 system weapons (SRD_CC_v5_2_1)
// ---------------------------------------------------------------------------

const WEAPONS_RAW: readonly WeaponFields[] = [
  // SIMPLE MELEE WEAPONS
  { id: 'club', name: 'Club', category: 'simple', mode: 'melee', properties: ['light'], damage: { default: '1d4' }, damageType: 'bludgeoning', weight: { value: 2, unit: 'lb' }, cost: { coin: 'sp', value: 1 }, mastery: 'slow' },
  { id: 'dagger', name: 'Dagger', category: 'simple', mode: 'melee', properties: ['finesse', 'light', 'thrown'], damage: { default: '1d4' }, damageType: 'piercing', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 2 }, range: { normal: 20, long: 60, unit: 'ft' }, mastery: 'nick' },
  { id: 'greatclub', name: 'Greatclub', category: 'simple', mode: 'melee', properties: ['two-handed'], damage: { default: '1d8' }, damageType: 'bludgeoning', weight: { value: 10, unit: 'lb' }, cost: { coin: 'sp', value: 2 }, mastery: 'push' },
  { id: 'handaxe', name: 'Handaxe', category: 'simple', mode: 'melee', properties: ['light', 'thrown'], damage: { default: '1d6' }, damageType: 'slashing', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, range: { normal: 20, long: 60, unit: 'ft' }, mastery: 'vex' },
  { id: 'javelin', name: 'Javelin', category: 'simple', mode: 'melee', properties: ['thrown'], damage: { default: '1d6' }, damageType: 'piercing', weight: { value: 2, unit: 'lb' }, cost: { coin: 'sp', value: 5 }, range: { normal: 30, long: 120, unit: 'ft' }, mastery: 'slow' },
  { id: 'light-hammer', name: 'Light Hammer', category: 'simple', mode: 'melee', properties: ['light', 'thrown'], damage: { default: '1d4' }, damageType: 'bludgeoning', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 2 }, range: { normal: 20, long: 60, unit: 'ft' }, mastery: 'nick' },
  { id: 'mace', name: 'Mace', category: 'simple', mode: 'melee', properties: [], damage: { default: '1d6' }, damageType: 'bludgeoning', weight: { value: 4, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, mastery: 'sap' },
  { id: 'quarterstaff', name: 'Quarterstaff', category: 'simple', mode: 'melee', properties: ['versatile'], damage: { default: '1d6', versatile: '1d8' }, damageType: 'bludgeoning', weight: { value: 4, unit: 'lb' }, cost: { coin: 'sp', value: 2 }, mastery: 'topple' },
  { id: 'sickle', name: 'Sickle', category: 'simple', mode: 'melee', properties: ['light'], damage: { default: '1d4' }, damageType: 'slashing', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, mastery: 'nick' },
  { id: 'spear', name: 'Spear', category: 'simple', mode: 'melee', properties: ['thrown', 'versatile'], damage: { default: '1d6', versatile: '1d8' }, damageType: 'piercing', weight: { value: 3, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, range: { normal: 20, long: 60, unit: 'ft' }, mastery: 'sap' },
  // SIMPLE RANGED
  { id: 'light-crossbow', name: 'Crossbow, Light', category: 'simple', mode: 'ranged', properties: ['ammunition', 'loading', 'two-handed'], damage: { default: '1d8' }, damageType: 'piercing', weight: { value: 5, unit: 'lb' }, cost: { coin: 'gp', value: 25 }, range: { normal: 80, long: 320, unit: 'ft' }, mastery: 'slow' },
  { id: 'dart', name: 'Dart', category: 'simple', mode: 'ranged', properties: ['finesse', 'thrown'], damage: { default: '1d4' }, damageType: 'piercing', weight: { value: 0.25, unit: 'lb' }, cost: { coin: 'cp', value: 5 }, range: { normal: 20, long: 60, unit: 'ft' }, mastery: 'vex' },
  { id: 'shortbow', name: 'Shortbow', category: 'simple', mode: 'ranged', properties: ['ammunition', 'two-handed'], damage: { default: '1d6' }, damageType: 'piercing', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 25 }, range: { normal: 80, long: 320, unit: 'ft' }, mastery: 'vex' },
  { id: 'sling', name: 'Sling', category: 'simple', mode: 'ranged', properties: ['ammunition'], damage: { default: '1d4' }, damageType: 'bludgeoning', weight: { value: 0, unit: 'lb' }, cost: { coin: 'sp', value: 1 }, range: { normal: 30, long: 120, unit: 'ft' }, mastery: 'slow' },
  // MARTIAL MELEE
  { id: 'battleaxe', name: 'Battleaxe', category: 'martial', mode: 'melee', properties: ['versatile'], damage: { default: '1d8', versatile: '1d10' }, damageType: 'slashing', weight: { value: 4, unit: 'lb' }, cost: { coin: 'gp', value: 10 }, mastery: 'topple' },
  { id: 'flail', name: 'Flail', category: 'martial', mode: 'melee', properties: [], damage: { default: '1d8' }, damageType: 'bludgeoning', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 10 }, mastery: 'sap' },
  { id: 'glaive', name: 'Glaive', category: 'martial', mode: 'melee', properties: ['heavy', 'reach', 'two-handed'], damage: { default: '1d10' }, damageType: 'slashing', weight: { value: 6, unit: 'lb' }, cost: { coin: 'gp', value: 20 }, mastery: 'graze' },
  { id: 'greataxe', name: 'Greataxe', category: 'martial', mode: 'melee', properties: ['heavy', 'two-handed'], damage: { default: '1d12' }, damageType: 'slashing', weight: { value: 7, unit: 'lb' }, cost: { coin: 'gp', value: 30 }, mastery: 'cleave' },
  { id: 'greatsword', name: 'Greatsword', category: 'martial', mode: 'melee', properties: ['heavy', 'two-handed'], damage: { default: '2d6' }, damageType: 'slashing', weight: { value: 6, unit: 'lb' }, cost: { coin: 'gp', value: 50 }, mastery: 'graze' },
  { id: 'halberd', name: 'Halberd', category: 'martial', mode: 'melee', properties: ['heavy', 'reach', 'two-handed'], damage: { default: '1d10' }, damageType: 'slashing', weight: { value: 6, unit: 'lb' }, cost: { coin: 'gp', value: 20 }, mastery: 'cleave' },
  { id: 'lance', name: 'Lance', category: 'martial', mode: 'melee', properties: ['reach', 'special'], damage: { default: '1d12' }, damageType: 'piercing', weight: { value: 6, unit: 'lb' }, cost: { coin: 'gp', value: 10 }, mastery: 'topple' },
  { id: 'longsword', name: 'Longsword', category: 'martial', mode: 'melee', properties: ['versatile'], damage: { default: '1d8', versatile: '1d10' }, damageType: 'slashing', weight: { value: 3, unit: 'lb' }, cost: { coin: 'gp', value: 15 }, mastery: 'sap' },
  { id: 'maul', name: 'Maul', category: 'martial', mode: 'melee', properties: ['heavy', 'two-handed'], damage: { default: '2d6' }, damageType: 'bludgeoning', weight: { value: 10, unit: 'lb' }, cost: { coin: 'gp', value: 10 }, mastery: 'topple' },
  { id: 'morningstar', name: 'Morningstar', category: 'martial', mode: 'melee', properties: [], damage: { default: '1d8' }, damageType: 'piercing', weight: { value: 4, unit: 'lb' }, cost: { coin: 'gp', value: 15 }, mastery: 'sap' },
  { id: 'pike', name: 'Pike', category: 'martial', mode: 'melee', properties: ['heavy', 'reach', 'two-handed'], damage: { default: '1d10' }, damageType: 'piercing', weight: { value: 18, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, mastery: 'push' },
  { id: 'rapier', name: 'Rapier', category: 'martial', mode: 'melee', properties: ['finesse'], damage: { default: '1d8' }, damageType: 'piercing', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 25 }, mastery: 'vex' },
  { id: 'scimitar', name: 'Scimitar', category: 'martial', mode: 'melee', properties: ['finesse', 'light'], damage: { default: '1d6' }, damageType: 'slashing', weight: { value: 3, unit: 'lb' }, cost: { coin: 'gp', value: 25 }, mastery: 'nick' },
  { id: 'shortsword', name: 'Shortsword', category: 'martial', mode: 'melee', properties: ['finesse', 'light'], damage: { default: '1d6' }, damageType: 'piercing', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 10 }, mastery: 'vex' },
  { id: 'trident', name: 'Trident', category: 'martial', mode: 'melee', properties: ['thrown', 'versatile'], damage: { default: '1d6', versatile: '1d8' }, damageType: 'piercing', weight: { value: 4, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, range: { normal: 20, long: 60, unit: 'ft' }, mastery: 'topple' },
  { id: 'war-pick', name: 'War Pick', category: 'martial', mode: 'melee', properties: [], damage: { default: '1d8' }, damageType: 'piercing', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, mastery: 'sap' },
  { id: 'warhammer', name: 'Warhammer', category: 'martial', mode: 'melee', properties: ['versatile'], damage: { default: '1d8', versatile: '1d10' }, damageType: 'bludgeoning', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 15 }, mastery: 'push' },
  { id: 'whip', name: 'Whip', category: 'martial', mode: 'melee', properties: ['finesse', 'reach'], damage: { default: '1d4' }, damageType: 'slashing', weight: { value: 3, unit: 'lb' }, cost: { coin: 'gp', value: 2 }, mastery: 'slow' },
  // MARTIAL RANGED
  { id: 'blowgun', name: 'Blowgun', category: 'martial', mode: 'ranged', properties: ['ammunition', 'loading'], damage: { default: '1' }, damageType: 'piercing', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 10 }, range: { normal: 25, long: 100, unit: 'ft' }, mastery: 'vex' },
  { id: 'hand-crossbow', name: 'Crossbow, Hand', category: 'martial', mode: 'ranged', properties: ['ammunition', 'light', 'loading'], damage: { default: '1d6' }, damageType: 'piercing', weight: { value: 3, unit: 'lb' }, cost: { coin: 'gp', value: 75 }, range: { normal: 30, long: 120, unit: 'ft' }, mastery: 'vex' },
  { id: 'heavy-crossbow', name: 'Crossbow, Heavy', category: 'martial', mode: 'ranged', properties: ['ammunition', 'heavy', 'loading', 'two-handed'], damage: { default: '1d10' }, damageType: 'piercing', weight: { value: 18, unit: 'lb' }, cost: { coin: 'gp', value: 50 }, range: { normal: 100, long: 400, unit: 'ft' }, mastery: 'push' },
  { id: 'longbow', name: 'Longbow', category: 'martial', mode: 'ranged', properties: ['ammunition', 'heavy', 'two-handed'], damage: { default: '1d8' }, damageType: 'piercing', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 50 }, range: { normal: 150, long: 600, unit: 'ft' }, mastery: 'slow' },
  { id: 'net', name: 'Net', category: 'martial', mode: 'ranged', properties: ['special', 'thrown'], damage: { default: '-' }, damageType: 'none', weight: { value: 3, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, range: { normal: 5, long: 15, unit: 'ft' }, mastery: 'topple' },
];

const SYSTEM_WEAPONS_SRD_CC_V5_2_1: readonly Weapon[] = WEAPONS_RAW.map(w => toSystemWeapon(DEFAULT_SYSTEM_RULESET_ID, w));

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SYSTEM_WEAPONS_BY_SYSTEM_ID: Record<SystemRulesetId, readonly Weapon[]> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_WEAPONS_SRD_CC_V5_2_1,
};

export function getSystemWeapons(systemId: SystemRulesetId): readonly Weapon[] {
  return SYSTEM_WEAPONS_BY_SYSTEM_ID[systemId] ?? [];
}

export function getSystemWeapon(systemId: SystemRulesetId, id: string): Weapon | undefined {
  return getSystemWeapons(systemId).find(w => w.id === id);
}
