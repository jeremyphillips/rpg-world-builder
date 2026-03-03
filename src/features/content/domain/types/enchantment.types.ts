import type { MagicItemRarity } from './magicItem.types'
import type { Money } from '@/shared/money/types' 
import type { BonusEffect, CustomEffect, GrantEffect, ModifierEffect } from '@/features/mechanics/domain/effects/effects.types'

export type EnchantableSlot = 'weapon' | 'armor' | 'shield'

export type EnchantmentEffect =
  | BonusEffect
  | ModifierEffect
  | GrantEffect
  | CustomEffect

export type EnchantmentTemplate = {
  id: string
  name: string
  appliesTo: EnchantableSlot[]
  rarity?: MagicItemRarity
  cost?: Money
  requiresAttunement?: boolean | string
  effectsBySlot: Partial<Record<EnchantableSlot, EnchantmentEffect[]>>
}