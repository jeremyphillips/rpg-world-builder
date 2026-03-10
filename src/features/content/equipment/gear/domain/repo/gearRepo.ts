// ---------------------------------------------------------------------------
// Resolution order:
// 1) Campaign-owned entry (full override)
// 2) System entry + campaign patch (merged via applyContentPatch)
// 3) Raw system entry
// ---------------------------------------------------------------------------

import type { CampaignContentRepo, ListOptions } from '@/features/content/shared/domain/repo/contentRepo.types';
import type { Gear, GearSummary, GearInput, GearFields } from '@/features/content/shared/domain/types/gear.types';
import { getSystemGear, getSystemGearEntry } from '@/features/mechanics/domain/core/rules/systemCatalog.gear';
import type { SystemRulesetId } from '@/features/mechanics/domain/core/rules';
import { campaignGearRepo, type CampaignEquipmentEntry } from '@/features/content/equipment/shared/domain/campaignEquipmentApi';
import { getContentPatch } from '@/features/content/shared/domain/contentPatchRepo';
import { applyContentPatch } from '@/features/content/shared/domain/patches/applyContentPatch';
import { moneyToCp } from '@/shared/money';
import { weightToLb } from '@/shared/weight';

function toSummary(gear: Gear): GearSummary {
  const base = {
    id: gear.id,
    name: gear.name,
    imageKey: gear.imageKey,
    accessPolicy: gear.accessPolicy,
    patched: gear.patched,
    category: gear.category,
    costCp: moneyToCp(gear.cost),
    weightLb: weightToLb(gear.weight),
  };
  return gear.source === 'system'
    ? { ...base, source: 'system' as const, systemId: gear.systemId }
    : { ...base, source: 'campaign' as const, campaignId: gear.campaignId };
}

function campaignEntryToGear(e: CampaignEquipmentEntry): Gear {
  const d = (e.data ?? {}) as Partial<GearFields>;
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
    category: d.category ?? 'adventuring-utility',
    capacity: d.capacity,
    range: d.range,
    duration: d.duration,
    charges: d.charges,
    effect: d.effect,
  };
}

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase());
}

export const gearRepo: CampaignContentRepo<Gear, GearSummary, GearInput> = {

  async listSummaries(
    campaignId: string,
    systemId: SystemRulesetId,
    opts?: ListOptions,
  ): Promise<GearSummary[]> {
    const [system, campaign, contentPatch] = await Promise.all([
      Promise.resolve(getSystemGear(systemId)),
      campaignGearRepo.list(campaignId),
      getContentPatch(campaignId),
    ]);

    const gearPatches = contentPatch?.patches?.gear ?? {};
    const campaignIds = new Set(campaign.map(c => c.id));

    const patchedSystem: Gear[] = system
      .filter(g => !campaignIds.has(g.id))
      .map((g): Gear => {
        const patch = gearPatches[g.id];
        if (!patch) return g;
        const merged = applyContentPatch<Gear>(g, patch as Partial<Gear>);
        return { ...merged, patched: true };
      });

    const merged: Gear[] = [
      ...patchedSystem,
      ...campaign.map(campaignEntryToGear),
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
  ): Promise<Gear | null> {
    const campaignEntry = await campaignGearRepo.get(campaignId, id);
    if (campaignEntry) return campaignEntryToGear(campaignEntry);

    const systemGear = getSystemGearEntry(systemId, id) ?? null;
    if (!systemGear) return null;

    const contentPatch = await getContentPatch(campaignId);
    const gearPatch = contentPatch?.patches?.gear?.[id];
    if (!gearPatch) return systemGear;

    const merged = applyContentPatch<Gear>(systemGear, gearPatch as Partial<Gear>);
    return { ...merged, patched: true };
  },

  async createEntry(
    campaignId: string,
    input: GearInput,
  ): Promise<Gear> {
    const { name, description, accessPolicy, ...rest } = input;
    const result = await campaignGearRepo.create(campaignId, {
      name,
      description: description ?? '',
      imageKey: (rest as Record<string, unknown>).imageKey ?? '',
      accessPolicy,
      data: rest,
    });
    if ('errors' in result) {
      throw new Error(result.errors.map(e => e.message).join('; '));
    }
    return campaignEntryToGear(result.entry);
  },

  async updateEntry(
    campaignId: string,
    id: string,
    input: GearInput,
  ): Promise<Gear> {
    const { name, description, accessPolicy, ...rest } = input;
    const result = await campaignGearRepo.update(campaignId, id, {
      name,
      description: description ?? '',
      imageKey: (rest as Record<string, unknown>).imageKey ?? '',
      accessPolicy,
      data: rest,
    });
    if ('errors' in result) {
      throw new Error(result.errors.map(e => e.message).join('; '));
    }
    return campaignEntryToGear(result.entry);
  },

  async deleteEntry(
    campaignId: string,
    id: string,
  ): Promise<boolean> {
    return campaignGearRepo.remove(campaignId, id);
  },
};
