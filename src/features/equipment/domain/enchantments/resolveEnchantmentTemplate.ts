import type { EnchantmentTemplate } from '@/data/equipmentCore/enchantments/enchantmentTemplates.types'
import { equipmentCore } from '@/data/equipmentCore/equipmentCore'

/**
 * Look up an enchantment template by ID.
 */
export function resolveEnchantmentTemplate(
  templateId: string,
): EnchantmentTemplate | undefined {
  return equipmentCore.enchantments.enhancementTemplates.find(t => t.id === templateId)
}
