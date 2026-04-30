/**
 * Skill proficiency repository — merges system catalog + campaign entries + patches.
 *
 * Resolution order:
 * 1) Campaign-owned entry (full override)
 * 2) System entry + campaign patch (merged via applyContentPatch)
 * 3) Raw system entry
 */
import { apiFetch, ApiError } from '@/app/api';
import type { ContentSource } from '@/features/content/shared/domain/types';
import type { CampaignContentRepo, ListOptions } from '@/features/content/shared/domain/repo/contentRepo.types';
import type {
  SkillProficiency,
  SkillProficiencySummary,
  SkillProficiencyInput,
} from '@/features/content/skillProficiencies/domain/types';
import {
  getSystemSkillProficiencies,
  getSystemSkillProficiency,
} from '@/features/mechanics/domain/rulesets/system/skillProficiencies';
import {
  getContentPatch,
  getEntryPatch,
  getPatchMapForType,
} from '@/features/content/shared/domain/contentPatchRepo';
import {
  mergeSystemCampaignWithPatches,
  resolveSystemEntryWithPatch,
} from '@/features/content/shared/domain/patches/patchedContentResolution';
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets';
import type { CampaignCatalogAdmin } from '@/features/mechanics/domain/rulesets/campaign/buildCatalog';
import {
  patchedCatalogMetaEntry,
  resolveCatalogSourcedCampaignEntry,
} from '@/features/content/shared/domain/repo/resolveCatalogSourcedCampaignEntry';

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

type CampaignSkillProficiencyDto = {
  _id: string;
  campaignId: string;
  skillProficiencyId: string;
  name: string;
  description: string;
  imageKey: string;
  ability: string;
  suggestedClasses: string[];
  examples: string[];
  tags: string[];
  accessPolicy?: import('@/shared/types/visibility').Visibility;
  createdAt: string;
  updatedAt: string;
};

type ValidationError = {
  path: string;
  code: string;
  message: string;
};

// ---------------------------------------------------------------------------
// DTO → domain
// ---------------------------------------------------------------------------

function toSkillProficiency(dto: CampaignSkillProficiencyDto): SkillProficiency {
  return {
    id: dto.skillProficiencyId,
    name: dto.name,
    description: dto.description,
    imageKey: dto.imageKey || null,
    ability: dto.ability as SkillProficiency['ability'],
    suggestedClasses: dto.suggestedClasses ?? [],
    examples: dto.examples ?? [],
    tags: dto.tags ?? [],
    source: 'campaign' as ContentSource,
    campaignId: dto.campaignId,
    accessPolicy: dto.accessPolicy,
  } as SkillProficiency;
}

// ---------------------------------------------------------------------------
// Campaign CRUD helpers
// ---------------------------------------------------------------------------

async function listCampaignSkillProficiencies(
  campaignId: string,
): Promise<SkillProficiency[]> {
  const data = await apiFetch<{
    skillProficiencies: CampaignSkillProficiencyDto[];
  }>(`/api/campaigns/${campaignId}/skill-proficiencies`);
  return (data.skillProficiencies ?? []).map(toSkillProficiency);
}

async function getCampaignSkillProficiency(
  campaignId: string,
  skillProficiencyId: string,
): Promise<SkillProficiency | null> {
  try {
    const data = await apiFetch<{
      skillProficiency: CampaignSkillProficiencyDto;
    }>(
      `/api/campaigns/${campaignId}/skill-proficiencies/${skillProficiencyId}`,
    );
    return toSkillProficiency(data.skillProficiency);
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function createCampaignSkillProficiency(
  campaignId: string,
  input: Record<string, unknown>,
): Promise<
  | { skillProficiency: SkillProficiency }
  | { errors: ValidationError[] }
> {
  try {
    const data = await apiFetch<{
      skillProficiency: CampaignSkillProficiencyDto;
    }>(`/api/campaigns/${campaignId}/skill-proficiencies`, {
      method: 'POST',
      body: input,
    });
    return { skillProficiency: toSkillProficiency(data.skillProficiency) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

async function updateCampaignSkillProficiency(
  campaignId: string,
  skillProficiencyId: string,
  input: Record<string, unknown>,
): Promise<
  | { skillProficiency: SkillProficiency }
  | { errors: ValidationError[] }
> {
  try {
    const data = await apiFetch<{
      skillProficiency: CampaignSkillProficiencyDto;
    }>(
      `/api/campaigns/${campaignId}/skill-proficiencies/${skillProficiencyId}`,
      { method: 'PATCH', body: input },
    );
    return { skillProficiency: toSkillProficiency(data.skillProficiency) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

async function deleteCampaignSkillProficiency(
  campaignId: string,
  skillProficiencyId: string,
): Promise<boolean> {
  try {
    await apiFetch(
      `/api/campaigns/${campaignId}/skill-proficiencies/${skillProficiencyId}`,
      { method: 'DELETE' },
    );
    return true;
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return false;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Public repo API
// ---------------------------------------------------------------------------

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase());
}

async function loadSystemSkillProficiencyWithPatch(
  campaignId: string,
  systemId: SystemRulesetId,
  key: string,
): Promise<SkillProficiency | null> {
  const systemEntry = getSystemSkillProficiency(systemId, key) ?? null;
  if (!systemEntry) return null;
  const contentPatch = await getContentPatch(campaignId);
  return resolveSystemEntryWithPatch(
    systemEntry,
    getEntryPatch(contentPatch, 'skillProficiencies', key),
  );
}

async function resolveSkillProficiencyEntry(
  campaignId: string,
  systemId: SystemRulesetId,
  key: string,
  catalog: CampaignCatalogAdmin | undefined,
): Promise<SkillProficiency | null> {
  const meta = catalog?.skillProficienciesAllById?.[key] as SkillProficiency | undefined;

  return resolveCatalogSourcedCampaignEntry<SkillProficiency, SkillProficiency>({
    meta,
    getCampaign: () => getCampaignSkillProficiency(campaignId, key),
    loadSystemWithPatch: () => loadSystemSkillProficiencyWithPatch(campaignId, systemId, key),
    systemRowExists: () => Boolean(getSystemSkillProficiency(systemId, key)),
    loadCatalogOnly: (m) =>
      patchedCatalogMetaEntry(campaignId, key, m, 'skillProficiencies'),
  });
}

/** Catalog-aware fetch for detail/edit routes. */
export async function fetchSkillProficiencyDetailEntry(
  campaignId: string,
  systemId: SystemRulesetId,
  key: string,
  catalog: CampaignCatalogAdmin,
): Promise<SkillProficiency | null> {
  return resolveSkillProficiencyEntry(campaignId, systemId, key, catalog);
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

    const merged = mergeSystemCampaignWithPatches(
      [...system],
      campaign,
      getPatchMapForType(contentPatch, 'skillProficiencies'),
    );

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
    return resolveSkillProficiencyEntry(campaignId, systemId, id, undefined);
  },

  async createEntry(
    campaignId: string,
    input: SkillProficiencyInput,
  ): Promise<SkillProficiency> {
    const { name, description, imageKey, ability, suggestedClasses, examples, tags, accessPolicy } =
      input;
    const result = await createCampaignSkillProficiency(campaignId, {
      name,
      description: description ?? '',
      imageKey,
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
    const { name, description, imageKey, ability, suggestedClasses, examples, tags, accessPolicy } =
      input;
    const result = await updateCampaignSkillProficiency(campaignId, id, {
      name,
      description: description ?? '',
      imageKey,
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
