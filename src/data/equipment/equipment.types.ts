import type { Money } from '@/shared/money/types'

export type EquipmentBase = {
  id: string
  name: string
  category: string
  description?: string
  weight?: {
    value: number
    unit: string
  }
  cost: Money
}

export interface ArmorItem extends EquipmentBase {
  material: string
  baseAC?: number
  stealthDisadvantage: boolean
  properties: string[]
  minStrength?: number
  acBonus?: number
}

export type GearCategory =
  | 'packs-containers'
  | 'lighting-fuel'
  | 'rope-climbing'
  | 'tools-utility'
  | 'adventuring-utility'
  | 'writing-knowledge'
  | 'kits-focuses'
  | 'rations-consumables'
  | 'clothing'
  | 'misc-tools'
  | 'cases-quivers'
  | 'tent-camp'
  | 'luxury-special'
  | 'potions-alchemical';

export interface GearItem extends EquipmentBase {
  properties?: string[];

  // Containers / storage
  capacity?: string;

  // Lighting
  range?: string;
  duration?: string;

  // Rope / climbing (5e-ish where applicable)
  hp?: number;
  burstDC?: number;

  // Kits / consumables
  charges?: number;

  // Writing
  pages?: number;

  // Rations
  type?: string;

  // Potions / alchemical
  effect?: string;

  // Focus / proficiency
  proficiency?: string;

  // Focus kind (spellcasting focus, implement, etc.)
  kind?: string;
};

export interface WeaponItem extends EquipmentBase {
  type: string
  properties: string[]
  damage: { default: string, versatile?: string }
  damageType: string  
  mastery: string
  range?: string
  description?: string
}


export type MagicItemSlot =
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'potion'
  | 'ring'
  | 'cloak'
  | 'boots'
  | 'gloves'
  | 'helm'
  | 'belt'
  | 'amulet'
  | 'helm'
  | 'wand'
  | 'staff'
  | 'rod'
  | 'scroll'
  | 'wondrous'

export type MagicItemEffect =
  | { kind: 'bonus'; target: string; value: number }
  | { kind: 'modifier'; target: string; mode: 'add' | 'mul' | 'set'; value: any }
  | { kind: 'note'; text: string };

export type MagicItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very-rare'
  | 'legendary'
  | 'artifact';

export interface MagicItem extends EquipmentBase {
  slot: MagicItemSlot;
  // “derived”/composition
  baseItemId?: string;

  consumable?: boolean;

  // flattened “default ruleset” fields (whatever you treat as canonical for now)
  rarity?: MagicItemRarity;
  requiresAttunement?: boolean;

  bonus?: number;
  charges?: number;

  effect?: string;
  effects?: MagicItemEffect[];

  description?: string;
};

export type EquipmentItem = ArmorItem | WeaponItem | GearItem | MagicItem;