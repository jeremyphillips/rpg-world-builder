/**
 * Class repository — merges system classes + campaign custom classes + content patches.
 *
 * Resolution order:
 * 1) Campaign-owned entry (full override)
 * 2) System entry + campaign patch (merged via applyContentPatch)
 * 3) Raw system entry
 */
import { apiFetch, ApiError } from '@/app/api';
import type { Visibility } from '@/shared/types/visibility';
import type { CampaignContentRepo, ListOptions } from '@/features/content/shared/domain/repo/contentRepo.types';
import type { CharacterClass } from '@/features/classes/domain/types';
import { getSystemClasses, getSystemClass } from '@/features/mechanics/domain/core/rules/systemCatalog.classes';
import { getContentPatch } from '@/features/content/shared/domain/contentPatchRepo';
import { applyContentPatch } from '@/features/content/shared/domain/patches/applyContentPatch';
import type { SystemRulesetId } from '@/features/mechanics/domain/core/rules';

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

type CampaignClassDto = {
  _id: string;
  campaignId: string;
  classId: string;
  name: string;
  description: string;
  accessPolicy?: Visibility;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type ValidationError = {
  path: string;
  code: string;
  message: string;
};

const DEFAULT_REQUIREMENTS = { allowedRaces: 'all' as const, allowedAlignments: 'any' as const };
const DEFAULT_PROFICIENCIES = {
  skills: { type: 'choice' as const, choose: 2, level: 1 },
  weapons: { type: 'fixed' as const, level: 1, categories: ['simple', 'martial'] },
  armor: { type: 'fixed' as const, level: 1, categories: ['light', 'medium'] },
};
const DEFAULT_PROGRESSION = {
  hitDie: 8,
  attackProgression: 'good' as const,
  savingThrows: ['str', 'dex'],
  spellcasting: 'none' as const,
  asiLevels: [4, 8, 12, 16, 19],
  features: [] as { id: string; level: number; name: string }[],
};
const DEFAULT_GENERATION = { primaryAbilities: ['str', 'dex'] as const };

// ---------------------------------------------------------------------------
// DTO → domain
// ---------------------------------------------------------------------------

function toCharacterClass(dto: CampaignClassDto): CharacterClass & { source: 'campaign'; campaignId: string; accessPolicy?: Visibility } {
  const d = dto.data ?? {};
  return {
    id: dto.classId,
    name: dto.name,
    description: dto.description,
    source: 'campaign',
    campaignId: dto.campaignId,
    accessPolicy: dto.accessPolicy,
    generation: (d.generation as CharacterClass['generation']) ?? DEFAULT_GENERATION,
    proficiencies: (d.proficiencies as CharacterClass['proficiencies']) ?? DEFAULT_PROFICIENCIES,
    progression: (d.progression as CharacterClass['progression']) ?? DEFAULT_PROGRESSION,
    definitions: d.definitions as CharacterClass['definitions'],
    requirements: (d.requirements as CharacterClass['requirements']) ?? DEFAULT_REQUIREMENTS,
  };
}

// ---------------------------------------------------------------------------
// Campaign CRUD helpers
// ---------------------------------------------------------------------------

/** Exported for loadCampaignCatalogOverrides. */
export async function listCampaignClasses(
  campaignId: string,
): Promise<(CharacterClass & { source: 'campaign'; campaignId: string; accessPolicy?: Visibility })[]> {
  const data = await apiFetch<{ classes: CampaignClassDto[] }>(
    `/api/campaigns/${campaignId}/classes`,
  );
  return (data.classes ?? []).map(toCharacterClass);
}

async function getCampaignClass(
  campaignId: string,
  classId: string,
): Promise<(CharacterClass & { source: 'campaign'; campaignId: string; accessPolicy?: Visibility }) | null> {
  try {
    const data = await apiFetch<{ class: CampaignClassDto }>(
      `/api/campaigns/${campaignId}/classes/${classId}`,
    );
    return toCharacterClass(data.class);
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function createCampaignClass(
  campaignId: string,
  input: Record<string, unknown>,
): Promise<
  | { class: CharacterClass & { source: 'campaign'; campaignId: string; accessPolicy?: Visibility } }
  | { errors: ValidationError[] }
> {
  try {
    const data = await apiFetch<{ class: CampaignClassDto }>(
      `/api/campaigns/${campaignId}/classes`,
      { method: 'POST', body: input },
    );
    return { class: toCharacterClass(data.class) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

async function updateCampaignClass(
  campaignId: string,
  classId: string,
  input: Record<string, unknown>,
): Promise<
  | { class: CharacterClass & { source: 'campaign'; campaignId: string; accessPolicy?: Visibility } }
  | { errors: ValidationError[] }
> {
  try {
    const data = await apiFetch<{ class: CampaignClassDto }>(
      `/api/campaigns/${campaignId}/classes/${classId}`,
      { method: 'PATCH', body: input },
    );
    return { class: toCharacterClass(data.class) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

async function deleteCampaignClass(
  campaignId: string,
  classId: string,
): Promise<boolean> {
  try {
    await apiFetch(`/api/campaigns/${campaignId}/classes/${classId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return false;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Public repo API
// ---------------------------------------------------------------------------

export type ClassContentItem =
  | (CharacterClass & { source: 'system'; systemId: SystemRulesetId; campaignId?: never; accessPolicy?: import('@/shared/types/visibility').Visibility; patched?: boolean })
  | (CharacterClass & { source: 'campaign'; campaignId: string; systemId?: never; accessPolicy?: import('@/shared/types/visibility').Visibility; patched?: boolean });

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

export const classRepo = {
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
        if (!patch) return { ...c, source: 'system', systemId } as ClassContentItem;
        const merged = applyContentPatch<CharacterClass>(c, patch as Partial<CharacterClass>);
        return { ...merged, source: 'system', systemId, patched: true } as ClassContentItem;
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
    if (!classPatch) return { ...systemClass, source: 'system', systemId } as ClassContentItem;

    const merged = applyContentPatch<CharacterClass>(systemClass, classPatch as Partial<CharacterClass>);
    return { ...merged, source: 'system', systemId, patched: true } as ClassContentItem;
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

  async deleteEntry(campaignId: string, classId: string): Promise<boolean> {
    return deleteCampaignClass(campaignId, classId);
  },
} as CampaignContentRepo<ClassContentItem, ClassSummary, ClassInput>;
