// ---------------------------------------------------------------------------
// MIGRATION NOTE
// ---------------------------------------------------------------------------
// All monetary math should use CP (copper) as the base unit.
// Avoid using moneyToGp for calculations.
// Use:
// - moneyToCp for math
// - formatMoney / formatCp for UI display
// ---------------------------------------------------------------------------

import type { Armor, Weapon, Gear } from '@/features/content/shared/domain/types'
import type { Money } from '@/shared/money/types'
import { moneyToCp, COIN_TO_CP } from '@/shared/money'

export { moneyToCp, COIN_TO_CP }

export const getItemCostCp = (item?: { cost?: Money }): number => {
  return moneyToCp(item?.cost)
}

export const calculateEquipmentCostCp = (
  weaponIds: string[],
  armorIds: string[],
  gearIds: string[],
  weaponsData: readonly Weapon[],
  armorData: readonly Armor[],
  gearData: readonly Gear[],
): number => {
  const weaponMap = new Map(weaponsData.map(w => [w.id, w]))
  const armorMap = new Map(armorData.map(a => [a.id, a]))
  const gearMap = new Map(gearData.map(g => [g.id, g]))

  const weaponCost = weaponIds.reduce((sum, id) => sum + getItemCostCp(weaponMap.get(id)), 0)
  const armorCost = armorIds.reduce((sum, id) => sum + getItemCostCp(armorMap.get(id)), 0)
  const gearCost = gearIds.reduce((sum, id) => sum + getItemCostCp(gearMap.get(id)), 0)

  return weaponCost + armorCost + gearCost
}
