import type { MagicItemRarity } from './magicItem.types'
import type { Money } from '@/shared/money/types' 
import type { BonusEffect, CustomEffect, GrantEffect, ModifierEffect } from '@/features/mechanics/domain/effects/effects.types'

export type EnchantableSlot = 'weapon' | 'armor' | 'shield'

/**
 * Data-layer effect descriptor (stored in enchantment templates, magic items).
 * Resolved to Effect[] by resolveEffectDescriptors.
 */
export type EffectDescriptor =
  | { kind: 'bonus'; target: string; value: number }
  | { kind: 'stat_bonus'; stat: string; value: number }
  | { kind: 'grant'; grantType: string; value: unknown }
  | { kind: 'custom'; id: string; params?: Record<string, unknown> }

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
  effectsBySlot: Partial<Record<EnchantableSlot, EffectDescriptor[]>>
}