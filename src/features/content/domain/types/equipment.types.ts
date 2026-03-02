import type { Weight } from '@/shared/weight/types'
import type { MagicItem } from './magicItem.types'
import type { Armor } from './armor.types'
import type { Weapon } from './weapon.types'
import type { Gear } from './gear.types'

export type EquipmentBase = {
  id: string
  imageKey?: string
  name: string
  description?: string
  weight?: Weight
}

export type EquipmentItem = Armor | Weapon | Gear | MagicItem;