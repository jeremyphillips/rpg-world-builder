// ---------------------------------------------------------------------------
// Resolution order:
// 1) Campaign-owned entry (full override)
// 2) System entry + campaign patch (merged via applyContentPatch)
// 3) Raw system entry
// ---------------------------------------------------------------------------

import type { CampaignContentRepo, ListOptions } from '@/features/content/shared/domain/repo/contentRepo.types';
import type { Armor, ArmorSummary, ArmorInput, ArmorFields } from '@/features/content/equipment/armor/domain/types';
import { getSystemArmor, getSystemArmorEntry } from '@/features/mechanics/domain/rulesets/system/armor';
import { campaignArmorRepo, type CampaignEquipmentEntry } from '@/features/content/equipment/shared/domain/campaignEquipmentApi';
import { getContentPatch } from '@/features/content/shared/domain/contentPatchRepo';
import { applyContentPatch } from '@/features/content/shared/domain/patches/applyContentPatch';
import { moneyToCp } from '@/shared/money';
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets';

function toSummary(armor: Armor): ArmorSummary {
  const base = {
    id: armor.id,
    name: armor.name,
    imageKey: armor.imageKey,
    accessPolicy: armor.accessPolicy,
    patched: armor.patched,
    category: armor.category,
    costCp: moneyToCp(armor.cost),
    baseAC: armor.baseAC,
    acBonus: armor.acBonus,
    stealthDisadvantage: armor.stealthDisadvantage ?? false,
  };
  return armor.source === 'system'
    ? { ...base, source: 'system' as const, systemId: armor.systemId }
    : { ...base, source: 'campaign' as const, campaignId: armor.campaignId };
}

function campaignEntryToArmor(e: CampaignEquipmentEntry): Armor {
  const d = (e.data ?? {}) as Partial<ArmorFields>;
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    imageKey: e.imageKey,
    source: 'campaign',
    campaignId: e.campaignId,
    accessPolicy: e.accessPolicy,
    cost: d.cost ?? { coin: 'gp', value: 0 },
    weight: d.weight,
    category: d.category ?? 'light',
    material: d.material ?? 'metal',
    baseAC: d.baseAC,
    dex: d.dex,
    stealthDisadvantage: d.stealthDisadvantage,
    minStrength: d.minStrength,
    acBonus: d.acBonus,
  };
}

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase());
}

export const armorRepo: CampaignContentRepo<Armor, ArmorSummary, ArmorInput> = {

  async listSummaries(
    campaignId: string,
    systemId: SystemRulesetId,
    opts?: ListOptions,
  ): Promise<ArmorSummary[]> {
    const [system, campaign, contentPatch] = await Promise.all([
      Promise.resolve(getSystemArmor(systemId)),
      campaignArmorRepo.list(campaignId),
      getContentPatch(campaignId),
    ]);

    const armorPatches = contentPatch?.patches?.armor ?? {};
    const campaignIds = new Set(campaign.map(c => c.id));

    const patchedSystem: Armor[] = system
      .filter(a => !campaignIds.has(a.id))
      .map((a): Armor => {
        const patch = armorPatches[a.id];
        if (!patch) return a;
        const merged = applyContentPatch<Armor>(a, patch as Partial<Armor>);
        return { ...merged, patched: true };
      });

    const merged: Armor[] = [
      ...patchedSystem,
      ...campaign.map(campaignEntryToArmor),
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
  ): Promise<Armor | null> {
    const campaignEntry = await campaignArmorRepo.get(campaignId, id);
    if (campaignEntry) return campaignEntryToArmor(campaignEntry);

    const systemArmor = getSystemArmorEntry(systemId, id) ?? null;
    if (!systemArmor) return null;

    const contentPatch = await getContentPatch(campaignId);
    const armorPatch = contentPatch?.patches?.armor?.[id];
    if (!armorPatch) return systemArmor;

    const merged = applyContentPatch<Armor>(systemArmor, armorPatch as Partial<Armor>);
    return { ...merged, patched: true };
  },

  async createEntry(
    campaignId: string,
    input: ArmorInput,
  ): Promise<Armor> {
    const { name, description, accessPolicy, ...rest } = input;
    const result = await campaignArmorRepo.create(campaignId, {
      name,
      description: description ?? '',
      imageKey: (rest as Record<string, unknown>).imageKey ?? '',
      accessPolicy,
      data: rest,
    });
    if ('errors' in result) {
      throw new Error(result.errors.map(e => e.message).join('; '));
    }
    return campaignEntryToArmor(result.entry);
  },

  async updateEntry(
    campaignId: string,
    id: string,
    input: ArmorInput,
  ): Promise<Armor> {
    const { name, description, accessPolicy, ...rest } = input;
    const result = await campaignArmorRepo.update(campaignId, id, {
      name,
      description: description ?? '',
      imageKey: (rest as Record<string, unknown>).imageKey ?? '',
      accessPolicy,
      data: rest,
    });
    if ('errors' in result) {
      throw new Error(result.errors.map(e => e.message).join('; '));
    }
    return campaignEntryToArmor(result.entry);
  },

  async deleteEntry(
    campaignId: string,
    id: string,
  ): Promise<boolean> {
    return campaignArmorRepo.remove(campaignId, id);
  },
};
