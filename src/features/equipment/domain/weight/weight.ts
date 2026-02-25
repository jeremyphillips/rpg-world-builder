import type { ArmorItem, GearItem, WeaponItem } from '@/data'

export const parseWeight = (weightStr?: string): number => {
  if (!weightStr) return 0
  const match = weightStr.match(/([\d.]+)/)
  return match ? Number(match[1]) : 0
}

export const calculateEquipmentWeight = (
  weapons: string[] = [],
  armor: string[] = [],
  gear: string[] = [],
  weaponData: readonly WeaponItem[],
  armorData: readonly ArmorItem[],
  gearData: readonly GearItem[] = []
): number => {
  const weaponWeight = weapons.reduce((sum, id) => {
    const item = weaponData.find(w => w.id === id)
    return sum + parseWeight(item?.weight)
  }, 0)

  const armorWeight = armor.reduce((sum, id) => {
    const item = armorData.find(a => a.id === id)
    return sum + parseWeight(item?.weight)
  }, 0)

  const gearWeight = gear.reduce((sum, id) => {
    const item = gearData.find(g => g.id === id)
    return sum + parseWeight(item?.weight)
  }, 0)

  return weaponWeight + armorWeight + gearWeight
}
