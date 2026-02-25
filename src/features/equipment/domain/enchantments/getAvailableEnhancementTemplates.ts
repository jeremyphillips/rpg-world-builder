import type { EnchantmentTemplate } from '@/data/equipment/enchantments/enchantmentTemplates.types'
import { equipment } from '@/data/equipment/equipment'

/**
 * Return all enhancement templates. Templates are no longer gated by edition
 * or character level — filtering is handled by campaign content policy.
 */
export function getAvailableEnhancementTemplates(): EnchantmentTemplate[] {
  return [...equipment.enchantments.enhancementTemplates]
}
