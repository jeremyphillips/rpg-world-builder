import type { ArmorItem } from '@/data/equipment/armor'
import type { WeaponItem } from '@/data/equipment/weapons'
import type { GearItem } from '@/data/equipment/gear'
import { parseCurrencyToGold } from '@/utils'

type CatalogItem = ArmorItem | WeaponItem | GearItem

export const getItemCostGp = (
  item: CatalogItem | undefined
): number => {
  return item?.cost ? parseCurrencyToGold(item.cost) : 0
}

export const calculateEquipmentCost = (
  weaponIds: string[],
  armorIds: string[],
  gearIds: string[],
  weaponsData: readonly WeaponItem[],
  armorData: readonly ArmorItem[],
  gearData: readonly GearItem[],
): number => {
  const weaponCost = weaponIds.reduce((sum, id) => {
    const w = weaponsData.find(w => w.id === id)
    return sum + getItemCostGp(w)
  }, 0)

  const armorCost = armorIds.reduce((sum, id) => {
    const a = armorData.find(a => a.id === id)
    return sum + getItemCostGp(a)
  }, 0)

  const gearCost = gearIds.reduce((sum, id) => {
    const g = gearData.find(g => g.id === id)
    return sum + getItemCostGp(g)
  }, 0)

  return weaponCost + armorCost + gearCost
}
