import type { MagicItemRarity } from './magicItem.types'
import type { Money } from '@/shared/money/types' 

export type EnchantableSlot = 'weapon' | 'armor' | 'shield'

export type EffectDescriptor =
  | { kind: 'bonus'; target: 'armor_class' | 'attack' | 'damage'; value: number }
  | { kind: 'stat_bonus'; stat: string; value: number }
  | { kind: 'grant'; grantType: string; value: unknown }
  | { kind: 'custom'; id: string; params?: Record<string, unknown> }

export type EnchantmentTemplate = {
  id: string
  name: string
  appliesTo: EnchantableSlot[]
  rarity?: MagicItemRarity
  cost?: Money
  requiresAttunement?: boolean | string
  effectsBySlot: Partial<Record<EnchantableSlot, EffectDescriptor[]>>
}