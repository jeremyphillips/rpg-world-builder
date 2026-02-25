import type { EquipmentEditionDatumBase, EquipmentItemBase } from './equipment.types'

/** High-level category for grouping gear in the PHB-style list */
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
  | 'potions-alchemical'

/** Edition-specific data for a gear item (cost and optional mechanics/notes) */
export interface GearEditionDatum extends EquipmentEditionDatumBase {
  capacity?: string
  note?: string
  range?: string
  duration?: string
  /** 5e: e.g. burst DC; 2e: strength test */
  hp?: number
  burstDC?: number
  strength?: string
  properties?: string[]
  type?: string
  proficiency?: string
  charges?: number
  pages?: number
  effect?: string
}

/** A single gear item with shared fields and per-edition data */
export interface GearItem extends EquipmentItemBase<GearEditionDatum> {
  category: GearCategory
}
