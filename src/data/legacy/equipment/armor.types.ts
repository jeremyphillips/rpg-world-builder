import type { EquipmentEditionDatumBase, EquipmentItemBase } from './equipment.types'

/** Armor material (affects e.g. Druid restrictions) */
export type ArmorMaterial = 'fabric' | 'organic' | 'metal'

/** Armor category across editions: 5e/3e light-heavy+shields, 4e uses specific material categories */
export type ArmorCategory =
  | 'light' | 'medium' | 'heavy' | 'shields'                    // 5e, 3e
  | 'cloth' | 'leather' | 'hide' | 'chainmail' | 'scale' | 'plate'  // 4e specific

/** 2e encumbrance category */
export type ArmorEncumbrance2e = 'light' | 'medium' | 'heavy' | 'extra-heavy'

/** Edition-specific data for armor */
export interface ArmorEditionDatum extends EquipmentEditionDatumBase {
  // ——— Universal (reused across editions) ———
  /** Armor category: light/medium/heavy/shields (5e, 3e), cloth/chainmail/scale/plate (4e) */
  category?: ArmorCategory
  /** 5e: base AC before Dex; 3e: AC bonus; 4e: AC bonus */
  baseAC?: number
  /** Armor properties: dexterity-modifier-full, dexterity-modifier-max-2, etc. */
  properties?: string[]
  /** Strength requirement for heavy armor (5e, 3e) */
  minStrength?: number
  /** Shield AC bonus (5e, 2e, 3e, 4e) */
  acBonus?: number

  // ——— 5e ———
  /** 5e: imposes stealth disadvantage */
  stealthDisadvantage?: boolean

  // ——— 2e ———
  /** 2e: AC value (lower = better in descending AC) */
  acValue?: number
  /** 2e: encumbrance category */
  encumbrance?: ArmorEncumbrance2e

  // ——— 3e / 3.5e ———
  /** 3e: maximum Dex bonus to AC while wearing */
  maxDexBonus?: number
  /** 3e: penalty to Str/Dex-based skill checks (negative number) */
  armorCheckPenalty?: number
  /** 3e: arcane spell failure chance (percentage, e.g. 20 = 20%) */
  arcaneSpellFailure?: number
  /** 3e: speed reduction by base speed — e.g. { '30': 20, '20': 15 } for heavy */
  speed?: Record<string, number>

  // ——— 4e ———
  /** 4e: skill check penalty (negative number) */
  checkPenalty?: number
  /** 4e: speed penalty in squares (e.g. -1) */
  speedPenalty?: number
}

/** A single armor or shield entry */
export interface ArmorItem extends EquipmentItemBase<ArmorEditionDatum> {
  material: ArmorMaterial
}
