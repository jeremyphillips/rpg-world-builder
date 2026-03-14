import type { MagicItemRarity } from '@/features/content/equipment/magicItems/domain/types/magicItem.types'
import type { Money } from '@/shared/money/types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'

export type EnchantableSlot = 'weapon' | 'armor' | 'shield'

export type EnchantmentEffect = Effect

export type EnchantmentTemplate = {
  id: string
  name: string
  appliesTo: EnchantableSlot[]
  rarity?: MagicItemRarity
  cost?: Money
  requiresAttunement?: boolean | string
  effectsBySlot: Partial<Record<EnchantableSlot, EnchantmentEffect[]>>
}
