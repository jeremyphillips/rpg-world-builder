import type { Weight } from '@/shared/weight/types'
import type { MagicItem } from '@/features/content/equipment/magicItems/domain/types/magicItem.types'
import type { Armor } from '@/features/content/equipment/armor/domain/types/armor.types'
import type { Weapon } from '@/features/content/equipment/weapons/domain/types/weapon.types'
import type { Gear } from '@/features/content/equipment/gear/domain/types/gear.types'

export type EquipmentBase = {
  id: string
  imageKey?: string
  name: string
  description?: string
  weight?: Weight
}

export type EquipmentItem = Armor | Weapon | Gear | MagicItem;
