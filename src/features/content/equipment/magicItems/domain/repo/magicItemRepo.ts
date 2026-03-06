// ---------------------------------------------------------------------------
// Resolution order:
// 1) Campaign-owned entry (full override)
// 2) System entry + campaign patch (merged via applyContentPatch)
// 3) Raw system entry
// ---------------------------------------------------------------------------

import type { CampaignContentRepo, ListOptions } from '@/features/content/shared/domain/repo/contentRepo.types';
import type { MagicItem, MagicItemSummary, MagicItemInput, MagicItemFields } from '@/features/content/shared/domain/types/magicItem.types';
import { getSystemMagicItems, getSystemMagicItem } from '@/features/mechanics/domain/core/rules/systemCatalog.magicItems';
import { campaignMagicItemRepo, type CampaignEquipmentEntry } from '@/features/content/equipment/shared/domain/campaignEquipmentApi';
import { getContentPatch } from '@/features/content/shared/domain/contentPatchRepo';
import { applyContentPatch } from '@/features/content/shared/domain/patches/applyContentPatch';
import { moneyToCp } from '@/shared/money';
import type { SystemRulesetId } from '@/features/mechanics/domain/core/rules';

function toSummary(item: MagicItem): MagicItemSummary {
  const base = {
    id: item.id,
    name: item.name,
    imageKey: item.imageKey,
    accessPolicy: item.accessPolicy,
    patched: item.patched,
    slot: item.slot,
    costCp: moneyToCp(item.cost),
    rarity: item.rarity,
    requiresAttunement: item.requiresAttunement ?? false,
  };
  return item.source === 'system'
    ? { ...base, source: 'system' as const, systemId: item.systemId }
    : { ...base, source: 'campaign' as const, campaignId: item.campaignId };
}

function campaignEntryToMagicItem(e: CampaignEquipmentEntry): MagicItem {
  const d = (e.data ?? {}) as Partial<MagicItemFields>;
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    imageKey: e.imageKey,
    source: 'campaign',
    campaignId: e.campaignId,
    accessPolicy: e.accessPolicy,
    cost: d.cost,
    weight: d.weight,
    slot: d.slot ?? 'wondrous',
    rarity: d.rarity,
    requiresAttunement: d.requiresAttunement,
    bonus: d.bonus,
    charges: d.charges,
    effects: d.effects,
  };
}

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase());
}

export const magicItemRepo: CampaignContentRepo<MagicItem, MagicItemSummary, MagicItemInput> = {

  async listSummaries(
    campaignId: string,
    systemId: SystemRulesetId,
    opts?: ListOptions,
  ): Promise<MagicItemSummary[]> {
    const [system, campaign, contentPatch] = await Promise.all([
      Promise.resolve(getSystemMagicItems(systemId)),
      campaignMagicItemRepo.list(campaignId),
      getContentPatch(campaignId),
    ]);

    const magicItemPatches = contentPatch?.patches?.magicItems ?? {};
    const campaignIds = new Set(campaign.map(c => c.id));

    const patchedSystem: MagicItem[] = system
      .filter(m => !campaignIds.has(m.id))
      .map((m): MagicItem => {
        const patch = magicItemPatches[m.id];
        if (!patch) return m;
        const merged = applyContentPatch<MagicItem>(m, patch as Partial<MagicItem>);
        return { ...merged, patched: true };
      });

    const merged: MagicItem[] = [
      ...patchedSystem,
      ...campaign.map(campaignEntryToMagicItem),
    ];

    let results = merged.map(toSummary);

    if (opts?.search) {
      results = results.filter(r => matchesSearch(r.name, opts.search!));
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getEntry(
    campaignId: string,
    systemId: SystemRulesetId,
    id: string,
  ): Promise<MagicItem | null> {
    const campaignEntry = await campaignMagicItemRepo.get(campaignId, id);
    if (campaignEntry) return campaignEntryToMagicItem(campaignEntry);

    const systemItem = getSystemMagicItem(systemId, id) ?? null;
    if (!systemItem) return null;

    const contentPatch = await getContentPatch(campaignId);
    const itemPatch = contentPatch?.patches?.magicItems?.[id];
    if (!itemPatch) return systemItem;

    const merged = applyContentPatch<MagicItem>(systemItem, itemPatch as Partial<MagicItem>);
    return { ...merged, patched: true };
  },

  async createEntry(
    campaignId: string,
    input: MagicItemInput,
  ): Promise<MagicItem> {
    const { name, description, accessPolicy, ...rest } = input;
    const result = await campaignMagicItemRepo.create(campaignId, {
      name,
      description: description ?? '',
      imageKey: (rest as Record<string, unknown>).imageKey ?? '',
      accessPolicy,
      data: rest,
    });
    if ('errors' in result) {
      throw new Error(result.errors.map(e => e.message).join('; '));
    }
    return campaignEntryToMagicItem(result.entry);
  },

  async updateEntry(
    campaignId: string,
    id: string,
    input: MagicItemInput,
  ): Promise<MagicItem> {
    const { name, description, accessPolicy, ...rest } = input;
    const result = await campaignMagicItemRepo.update(campaignId, id, {
      name,
      description: description ?? '',
      imageKey: (rest as Record<string, unknown>).imageKey ?? '',
      accessPolicy,
      data: rest,
    });
    if ('errors' in result) {
      throw new Error(result.errors.map(e => e.message).join('; '));
    }
    return campaignEntryToMagicItem(result.entry);
  },

  async deleteEntry(
    campaignId: string,
    id: string,
  ): Promise<boolean> {
    return campaignMagicItemRepo.remove(campaignId, id);
  },
};
