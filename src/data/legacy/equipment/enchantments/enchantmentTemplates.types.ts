import type { MagicItemRarity, EffectDescriptor } from '../magicItems.types'

export type EnchantableSlot = 'weapon' | 'armor' | 'shield'

export type EnchantmentTemplateEditionDatum = {
  edition: string
  rarity?: MagicItemRarity
  cost?: string
  enhancementLevel?: number
  requiresAttunement?: boolean | string
  effectsBySlot: Partial<Record<EnchantableSlot, EffectDescriptor[]>>
}

export type EnchantmentTemplate = {
  id: string
  name: string
  appliesTo: EnchantableSlot[]
  editionData: EnchantmentTemplateEditionDatum[]
}
