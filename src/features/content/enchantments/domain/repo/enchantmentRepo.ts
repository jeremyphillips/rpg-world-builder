/**
 * Enchantment repository — system enhancement templates + campaign stubs.
 *
 * System templates come from the code-defined catalog (systemCatalog.enchantments).
 * Campaign-owned custom enchantments are stubbed (no API yet).
 */
import type { EnchantmentTemplate } from '../types';
import { getSystemEnchantmentTemplates, getSystemEnchantmentTemplate } from '@/features/mechanics/domain/core/rules/systemCatalog.enchantments';
import type { SystemRulesetId } from '@/features/mechanics/domain/core/rules';

// ---------------------------------------------------------------------------
// Campaign entry shape (matches CampaignEquipmentEntry pattern when API exists)
// ---------------------------------------------------------------------------

export type CampaignEnchantmentEntry = {
  id: string;
  name: string;
  description?: string;
  campaignId: string;
  data: Partial<EnchantmentTemplate>;
};

// ---------------------------------------------------------------------------
// Campaign stubs — no API yet
// ---------------------------------------------------------------------------

const campaignEnchantmentStub = {
  async list(_campaignId: string): Promise<CampaignEnchantmentEntry[]> {
    return [];
  },

  async get(_campaignId: string, _itemId: string): Promise<CampaignEnchantmentEntry | null> {
    return null;
  },
};

// ---------------------------------------------------------------------------
// Public repo API
// ---------------------------------------------------------------------------

export const enchantmentRepo = {
  listSystem(systemId: SystemRulesetId): EnchantmentTemplate[] {
    return [...getSystemEnchantmentTemplates(systemId)];
  },

  getSystemById(systemId: SystemRulesetId, id: string): EnchantmentTemplate | null {
    return getSystemEnchantmentTemplate(systemId, id) ?? null;
  },

  /** Campaign list (stub — returns [] until backend supports campaign enchantments). */
  listCampaign: campaignEnchantmentStub.list,

  // TODO: createEntry — not implemented yet
  // TODO: updateEntry — not implemented yet
  // TODO: deleteEntry — not implemented yet
};
