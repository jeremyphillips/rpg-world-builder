import type { EnchantmentTemplate } from '@/features/content/shared/domain/types'
import { enchantmentRepo } from '@/features/content/shared/domain/repo/enchantmentRepo'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds'

/**
 * Look up an enchantment template by ID.
 */
export function resolveEnchantmentTemplate(
  templateId: string,
): EnchantmentTemplate | undefined {
  return enchantmentRepo.getSystemById(DEFAULT_SYSTEM_RULESET_ID, templateId) ?? undefined;
}
