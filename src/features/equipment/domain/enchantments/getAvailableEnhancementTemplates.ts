import type { EnchantmentTemplate } from '@/data/equipmentCore/enchantments/enchantmentTemplates.types'
import { equipmentCore } from '@/data/equipmentCore/equipmentCore'

/**
 * Return all enhancement templates. Templates are no longer gated by edition
 * or character level — filtering is handled by campaign content policy.
 */
export function getAvailableEnhancementTemplates(): EnchantmentTemplate[] {
  return [...equipmentCore.enchantments.enhancementTemplates]
}
