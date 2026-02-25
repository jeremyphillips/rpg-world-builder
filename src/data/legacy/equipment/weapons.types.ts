import type { EquipmentEditionDatumBase, EquipmentItemBase } from './equipment.types'

/** Physical damage type for weapons */
export type WeaponDamageType = 'bludgeoning' | 'piercing' | 'slashing' | 'none'

/** Weapon category across editions: 5e simple/martial, 3e adds exotic, 4e uses military/superior */
export type WeaponCategory = 'simple' | 'martial' | 'exotic' | 'military' | 'superior'

/** Melee vs ranged — universal across all editions */
export type WeaponType = 'melee' | 'ranged'

/** Structured damage object unifying all edition damage representations */
export interface WeaponDamage {
  /** 5e, 3e, 4e: standard damage dice e.g. '1d6', '2d6', '-' for net */
  default?: string
  /** 5e: two-handed damage for versatile weapons e.g. '1d8' */
  versatile?: string
  /** 1e, 2e: damage vs Small/Medium creatures e.g. '2d4' */
  sm?: string
  /** 1e, 2e: damage vs Large creatures e.g. '1d6+1' */
  l?: string
}

/** Edition-specific data for weapons */
export interface WeaponEditionDatum extends EquipmentEditionDatumBase {
  // ——— Universal ———
  /** Weapon category: simple, martial (5e/3e), exotic (3e), military, superior (4e) */
  category?: WeaponCategory
  /** melee | ranged */
  type?: WeaponType
  /** Structured damage — see WeaponDamage for per-edition fields */
  damage?: WeaponDamage
  /** Weapon properties: light, finesse, thrown, two-handed, reach, etc. */
  properties?: string[]
  /** Range string: '20/60' (5e), '60/120/180' (2e), or single increment */
  range?: string

  // ——— 5e ———
  /** 5e (2024): weapon mastery e.g. 'slow', 'nick', 'vex' */
  mastery?: string

  // ——— 2e ———
  /** 2e: initiative speed factor modifier */
  speedFactor?: number

  // ——— 3e / 3.5e ———
  /** 3e: critical threat range and multiplier */
  critical?: {
    /** Threat range lower bound: 19 = 19-20, 18 = 18-20 (default 20) */
    range?: number
    /** Critical multiplier: 2 = x2, 3 = x3, 4 = x4 (default x2) */
    multiplier?: number
  }
  /** 3e: range increment in feet (single number, not normal/long) */
  rangeIncrement?: number

  // ——— 4e ———
  /** 4e: proficiency bonus to attack rolls (+2, +3) */
  proficiencyBonus?: number
  /** 4e: weapon group(s) — axe, heavy-blade, light-blade, hammer, etc. */
  weaponGroup?: string[]
}

/** A single weapon entry */
export interface WeaponItem extends EquipmentItemBase<WeaponEditionDatum> {
  damageType: WeaponDamageType
}
