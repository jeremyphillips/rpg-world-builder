import type { ArmorItem, WeaponItem, GearItem, EquipmentBase } from '@/data/equipment'
import type { Coin } from '@/data/equipment'

const COIN_TO_CP: Record<Coin, number> = {
  cp: 1,
  sp: 10,
  ep: 50,
  gp: 100,
  pp: 1000,
}

export const moneyToCp = (money?: { coin: Coin; value: number }): number => {
  if (!money) return 0
  return money.value * COIN_TO_CP[money.coin]
}

export const moneyToGp = (money?: { coin: Coin; value: number }): number => {
  return moneyToCp(money) / 100
}

export const getItemCostGp = (item?: { cost?: { coin: Coin; value: number } }) => {
  return moneyToGp(item?.cost)
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
