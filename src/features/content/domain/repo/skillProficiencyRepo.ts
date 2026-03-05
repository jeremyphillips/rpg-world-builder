/**
 * Skill proficiency repository — merges system catalog + campaign entries + patches.
 *
 * Resolution order:
 * 1) Campaign-owned entry (full override)
 * 2) System entry + campaign patch (merged via applyContentPatch)
 * 3) Raw system entry
 */
import type { CampaignContentRepo, ListOptions } from './contentRepo.types';
import type {
  SkillProficiency,
  SkillProficiencySummary,
  SkillProficiencyInput,
} from '../types/skillProficiency.types';
import {
  getSystemSkillProficiencies,
  getSystemSkillProficiency,
} from '@/features/mechanics/domain/core/rules/systemCatalog.skillProficiencies';
import {
  listCampaignSkillProficiencies,
  getCampaignSkillProficiency,
  createCampaignSkillProficiency,
  updateCampaignSkillProficiency,
  deleteCampaignSkillProficiency,
} from '../campaignSkillProficiencyRepo';
import { getContentPatch } from '../contentPatchRepo';
import { applyContentPatch } from '../patches/applyContentPatch';
import type { SystemRulesetId } from '@/features/mechanics/domain/core/rules';

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase());
}

export const skillProficiencyRepo: CampaignContentRepo<
  SkillProficiency,
  SkillProficiencySummary,
  SkillProficiencyInput
> = {
  async listSummaries(
    campaignId: string,
    systemId: SystemRulesetId,
    opts?: ListOptions,
  ): Promise<SkillProficiencySummary[]> {
    const [system, campaign, contentPatch] = await Promise.all([
      Promise.resolve(getSystemSkillProficiencies(systemId)),
      listCampaignSkillProficiencies(campaignId),
      getContentPatch(campaignId),
    ]);

    const skillProficiencyPatches =
      contentPatch?.patches?.skillProficiencies ?? {};
    const campaignIds = new Set(campaign.map((c) => c.id));

    const patchedSystem: SkillProficiency[] = system
      .filter((s) => !campaignIds.has(s.id))
      .map((s): SkillProficiency => {
        const patch = skillProficiencyPatches[s.id];
        if (!patch) return s;
        const merged = applyContentPatch<SkillProficiency>(
          s,
          patch as Partial<SkillProficiency>,
        );
        return { ...merged, patched: true };
      });

    const merged: SkillProficiency[] = [
      ...patchedSystem,
      ...campaign,
    ];

    let results = merged;

    if (opts?.search) {
      results = results.filter((r) => matchesSearch(r.name, opts!.search!));
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getEntry(
    campaignId: string,
    systemId: SystemRulesetId,
    id: string,
  ): Promise<SkillProficiency | null> {
    const campaignEntry = await getCampaignSkillProficiency(campaignId, id);
    if (campaignEntry) return campaignEntry;

    const systemEntry = getSystemSkillProficiency(systemId, id) ?? null;
    if (!systemEntry) return null;

    const contentPatch = await getContentPatch(campaignId);
    const patch = contentPatch?.patches?.skillProficiencies?.[id];
    if (!patch) return systemEntry;

    const merged = applyContentPatch<SkillProficiency>(
      systemEntry,
      patch as Partial<SkillProficiency>,
    );
    return { ...merged, patched: true };
  },

  async createEntry(
    campaignId: string,
    input: SkillProficiencyInput,
  ): Promise<SkillProficiency> {
    const { name, description, ability, suggestedClasses, examples, tags, accessPolicy } =
      input;
    const result = await createCampaignSkillProficiency(campaignId, {
      name,
      description: description ?? '',
      ability,
      suggestedClasses: suggestedClasses ?? [],
      examples: examples ?? [],
      tags: tags ?? [],
      accessPolicy,
    });
    if ('errors' in result) {
      throw new Error(result.errors.map((e) => e.message).join('; '));
    }
    return result.skillProficiency;
  },

  async updateEntry(
    campaignId: string,
    id: string,
    input: SkillProficiencyInput,
  ): Promise<SkillProficiency> {
    const { name, description, ability, suggestedClasses, examples, tags, accessPolicy } =
      input;
    const result = await updateCampaignSkillProficiency(campaignId, id, {
      name,
      description: description ?? '',
      ability,
      suggestedClasses: suggestedClasses ?? [],
      examples: examples ?? [],
      tags: tags ?? [],
      accessPolicy,
    });
    if ('errors' in result) {
      throw new Error(result.errors.map((e) => e.message).join('; '));
    }
    return result.skillProficiency;
  },

  async deleteEntry(
    campaignId: string,
    id: string,
  ): Promise<boolean> {
    return deleteCampaignSkillProficiency(campaignId, id);
  },
};
