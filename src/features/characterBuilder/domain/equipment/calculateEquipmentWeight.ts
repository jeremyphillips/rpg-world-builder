import type { Armor, Gear, Weapon } from '@/features/content/shared/domain/types'
import type { Weight } from '@/shared/weight/types'
import { weightToLb } from '@/shared/weight'

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
