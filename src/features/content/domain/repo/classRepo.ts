/**
 * Class repository — merges system classes + campaign custom classes + content patches.
 *
 * Resolution order:
 * 1) Campaign-owned entry (full override)
 * 2) System entry + campaign patch (merged via applyContentPatch)
 * 3) Raw system entry
 */
import type { CampaignContentRepo, ListOptions } from './contentRepo.types';
import type { CharacterClass } from '@/features/classes/domain/types';
import type { ContentSource } from '../types';
import { getSystemClasses, getSystemClass } from '@/features/mechanics/domain/core/rules/systemCatalog.classes';
import {
  listCampaignClasses,
  getCampaignClass,
  createCampaignClass,
  updateCampaignClass,
  deleteCampaignClass,
} from '../campaignClassRepo';
import { getContentPatch } from '../contentPatchRepo';
import { applyContentPatch } from '../patches/applyContentPatch';
import type { SystemRulesetId } from '@/features/mechanics/domain/core/rules';

export type ClassContentItem = CharacterClass & {
  source: ContentSource;
  campaignId?: string;
  systemId?: SystemRulesetId;
  accessPolicy?: import('@/shared/types/visibility').Visibility;
  patched?: boolean;
};

export type ClassSummary = ClassContentItem;

function toSummary(cls: ClassContentItem): ClassSummary {
  return cls;
}

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase());
}

export type ClassInput = Omit<CharacterClass, 'id'> & {
  id?: string;
  accessPolicy?: import('@/shared/types/visibility').Visibility;
};

export const classRepo: CampaignContentRepo<ClassContentItem, ClassSummary, ClassInput> = {
  async listSummaries(
    campaignId: string,
    systemId: SystemRulesetId,
    opts?: ListOptions,
  ): Promise<ClassSummary[]> {
    const [system, campaign, contentPatch] = await Promise.all([
      Promise.resolve([...getSystemClasses(systemId)]),
      listCampaignClasses(campaignId),
      getContentPatch(campaignId),
    ]);

    const classPatches = contentPatch?.patches?.classes ?? {};
    const campaignIds = new Set(campaign.map((c) => c.id));

    const patchedSystem: ClassContentItem[] = system
      .filter((c) => !campaignIds.has(c.id))
      .map((c): ClassContentItem => {
        const patch = classPatches[c.id];
        if (!patch) return { ...c, source: 'system' as ContentSource, systemId };
        const merged = applyContentPatch<CharacterClass>(c, patch as Partial<CharacterClass>);
        return { ...merged, source: 'system' as ContentSource, systemId, patched: true };
      });

    const merged: ClassContentItem[] = [...patchedSystem, ...campaign];

    let results = merged.map(toSummary);

    if (opts?.search) {
      results = results.filter((r) => matchesSearch(r.name, opts.search!));
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getEntry(
    campaignId: string,
    systemId: SystemRulesetId,
    id: string,
  ): Promise<ClassContentItem | null> {
    const campaignEntry = await getCampaignClass(campaignId, id);
    if (campaignEntry) return campaignEntry;

    const systemClass = getSystemClass(systemId, id) ?? null;
    if (!systemClass) return null;

    const contentPatch = await getContentPatch(campaignId);
    const classPatch = contentPatch?.patches?.classes?.[id];
    if (!classPatch) return { ...systemClass, source: 'system', systemId };

    const merged = applyContentPatch<CharacterClass>(systemClass, classPatch as Partial<CharacterClass>);
    return { ...merged, source: 'system', systemId, patched: true };
  },

  async createEntry(campaignId: string, input: ClassInput): Promise<ClassContentItem> {
    const body: Record<string, unknown> = {
      name: input.name,
      description: input.description,
      accessPolicy: input.accessPolicy,
      generation: input.generation,
      proficiencies: input.proficiencies,
      progression: input.progression,
      definitions: input.definitions,
      requirements: input.requirements,
    };
    if (input.id) body.classId = input.id;

    const result = await createCampaignClass(campaignId, body);
    if ('errors' in result) {
      throw new Error(result.errors.map((e) => e.message).join('; '));
    }
    return result.class;
  },

  async updateEntry(
    campaignId: string,
    id: string,
    input: ClassInput,
  ): Promise<ClassContentItem> {
    const body: Record<string, unknown> = {
      name: input.name,
      description: input.description,
      accessPolicy: input.accessPolicy,
      generation: input.generation,
      proficiencies: input.proficiencies,
      progression: input.progression,
      definitions: input.definitions,
      requirements: input.requirements,
    };

    const result = await updateCampaignClass(campaignId, id, body);
    if ('errors' in result) {
      throw new Error(result.errors.map((e) => e.message).join('; '));
    }
    return result.class;
  },

  async deleteEntry(campaignId: string, id: string): Promise<boolean> {
    return deleteCampaignClass(campaignId, id);
  },
};
