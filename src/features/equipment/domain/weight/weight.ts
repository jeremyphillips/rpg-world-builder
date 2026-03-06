import type { Armor, Gear, Weapon } from '@/features/content/shared/domain/types'
import type { WeightUnit, Weight } from '@/shared/weight/types'

const WEIGHT_TO_LB: Record<WeightUnit, number> = {
  lb: 1,
  oz: 1 / 16,
}

export const weightToLb = (weight?: Weight): number => {
  if (!weight) return 0
  return weight.value * WEIGHT_TO_LB[weight.unit as WeightUnit]
}

export const calculateEquipmentWeight = (
  weapons: string[] = [],
  armor: string[] = [],
  gear: string[] = [],
  weaponData: readonly Weapon[],
  armorData: readonly Armor[],
  gearData: readonly Gear[] = []
): number => {

  const weaponMap = new Map(weaponData.map(w => [w.id, w]))
  const armorMap = new Map(armorData.map(a => [a.id, a]))
  const gearMap = new Map(gearData.map(g => [g.id, g]))

  const sumWeight = (ids: string[], map: Map<string, { weight?: Weight }>) =>
    ids.reduce((sum, id) => sum + weightToLb(map.get(id)?.weight), 0)

  const weaponWeight = sumWeight(weapons, weaponMap)
  const armorWeight = sumWeight(armor, armorMap)
  const gearWeight = sumWeight(gear, gearMap)

  return weaponWeight + armorWeight + gearWeight
}
