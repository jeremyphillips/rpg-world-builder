import type { EnchantmentTemplate } from '@/data/equipment/enchantments/enchantmentTemplates.types'
import { equipment } from '@/data/equipment/equipment'

/**
 * Look up an enchantment template by ID.
 */
export function resolveEnchantmentTemplate(
  templateId: string,
): EnchantmentTemplate | undefined {
  return equipment.enchantments.enhancementTemplates.find(t => t.id === templateId)
}
