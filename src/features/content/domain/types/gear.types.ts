import type { Money } from '@/shared/money/types';
import type { Weight } from '@/shared/weight/types';
import type { ContentItem, ContentSummary, ContentInput } from './content.types';
import type { EquipmentBase } from './equipment.types';

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

export type GearProperty = 'magnification';

export interface GearFields extends EquipmentBase {
  cost: Money;
  weight?: Weight;

  category: GearCategory;
  properties?: GearProperty[];

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
}

export type Gear = ContentItem & GearFields;

export type GearSummary = ContentSummary & {
  category: GearCategory;
  costCp: number;
  weightLb: number;
};

export type GearInput = ContentInput & Partial<GearFields>;