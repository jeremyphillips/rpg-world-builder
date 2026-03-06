import type { EnchantmentTemplate } from '@/features/content/shared/domain/types'
import { enchantmentRepo } from '@/features/content/shared/domain/repo/enchantmentRepo'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds'

/**
 * Return all enhancement templates. Templates are no longer gated by edition
 * or character level — filtering is handled by campaign content policy.
 */
export function getAvailableEnhancementTemplates(): EnchantmentTemplate[] {
  return enchantmentRepo.listSystem(DEFAULT_SYSTEM_RULESET_ID);
}
