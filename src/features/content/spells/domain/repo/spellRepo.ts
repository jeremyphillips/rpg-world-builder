/**
 * Spell repository — merges system + campaign spells + content patches.
 *
 * Resolution order:
 * 1) Campaign-owned entry (full override)
 * 2) System entry + campaign patch (merged via applyContentPatch)
 * 3) Raw system entry
 */
import { apiFetch, ApiError } from '@/app/api';
import type { Spell, SpellInput } from '@/features/content/shared/domain/types/spell.types';
import type { ContentSource } from '@/features/content/shared/domain/types';
import type { SystemRulesetId } from '@/features/mechanics/domain/core/rules';
import { getSystemSpells, getSystemSpell } from '@/features/mechanics/domain/core/rules/systemCatalog.spells';
import { getContentPatch } from '@/features/content/shared/domain/contentPatchRepo';
import { applyContentPatch } from '@/features/content/shared/domain/patches/applyContentPatch';
import type { ListOptions } from '@/features/content/shared/domain/repo/contentRepo.types';

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

type CampaignSpellDto = {
  _id: string;
  campaignId: string;
  spellId: string;
  name: string;
  description: string;
  imageKey: string;
  school: string;
  level: number;
  classes: string[];
  ritual: boolean;
  concentration: boolean;
  effects: unknown[];
  accessPolicy?: { scope: string; allowCharacterIds?: string[] };
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

function toSpell(dto: CampaignSpellDto): Spell {
  return {
    id: dto.spellId,
    name: dto.name,
    description: dto.description,
    imageKey: dto.imageKey || undefined,
    school: dto.school as Spell['school'],
    level: dto.level,
    classes: dto.classes ?? [],
    ritual: dto.ritual,
    concentration: dto.concentration,
    effects: dto.effects as Spell['effects'],
    source: 'campaign' as ContentSource,
    campaignId: dto.campaignId,
    accessPolicy: dto.accessPolicy as Spell['accessPolicy'],
  };
}

// ---------------------------------------------------------------------------
// Campaign CRUD helpers
// ---------------------------------------------------------------------------

/** Exported for loadCampaignCatalogOverrides. */
export async function listCampaignSpells(campaignId: string): Promise<Spell[]> {
  const data = await apiFetch<{ spells: CampaignSpellDto[] }>(
    `/api/campaigns/${campaignId}/spells`,
  );
  return (data.spells ?? []).map(toSpell);
}

async function getCampaignSpell(
  campaignId: string,
  spellId: string,
): Promise<Spell | null> {
  try {
    const data = await apiFetch<{ spell: CampaignSpellDto }>(
      `/api/campaigns/${campaignId}/spells/${spellId}`,
    );
    return toSpell(data.spell);
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function createCampaignSpell(
  campaignId: string,
  input: SpellInput,
): Promise<{ spell: Spell } | { errors: ValidationError[] }> {
  try {
    const data = await apiFetch<{ spell: CampaignSpellDto }>(
      `/api/campaigns/${campaignId}/spells`,
      { method: 'POST', body: input },
    );
    return { spell: toSpell(data.spell) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

async function updateCampaignSpell(
  campaignId: string,
  spellId: string,
  input: SpellInput,
): Promise<{ spell: Spell } | { errors: ValidationError[] }> {
  try {
    const data = await apiFetch<{ spell: CampaignSpellDto }>(
      `/api/campaigns/${campaignId}/spells/${spellId}`,
      { method: 'PATCH', body: input },
    );
    return { spell: toSpell(data.spell) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

async function deleteCampaignSpell(
  campaignId: string,
  spellId: string,
): Promise<boolean> {
  try {
    await apiFetch(
      `/api/campaigns/${campaignId}/spells/${spellId}`,
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

/** Spell shape for list view (Spell has all needed fields). */
export type SpellSummary = Spell;

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase());
}

export const spellRepo = {
  async listSummaries(
    campaignId: string,
    systemId: SystemRulesetId,
    opts?: ListOptions & { search?: string },
  ): Promise<SpellSummary[]> {
    const [system, campaign, contentPatch] = await Promise.all([
      Promise.resolve(getSystemSpells(systemId)),
      listCampaignSpells(campaignId),
      getContentPatch(campaignId),
    ]);

    const spellPatches = contentPatch?.patches?.spells ?? {};
    const campaignIds = new Set(campaign.map((c) => c.id));

    const patchedSystem: Spell[] = system
      .filter((s) => !campaignIds.has(s.id))
      .map((s): Spell => {
        const patch = spellPatches[s.id];
        if (!patch) return s;
        const merged = applyContentPatch<Spell>(s, patch as Partial<Spell>);
        return { ...merged, patched: true };
      });

    const merged: Spell[] = [...patchedSystem, ...campaign];

    let results = [...merged];

    if (opts?.search) {
      results = results.filter((s) => matchesSearch(s.name, opts.search!));
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getEntry(
    campaignId: string,
    systemId: SystemRulesetId,
    id: string,
  ): Promise<Spell | null> {
    const campaignEntry = await getCampaignSpell(campaignId, id);
    if (campaignEntry) return campaignEntry;

    const systemSpell = getSystemSpell(systemId, id) ?? null;
    if (!systemSpell) return null;

    const contentPatch = await getContentPatch(campaignId);
    const spellPatch = contentPatch?.patches?.spells?.[id];
    if (!spellPatch) return systemSpell;

    const merged = applyContentPatch<Spell>(systemSpell, spellPatch as Partial<Spell>);
    return { ...merged, patched: true };
  },

  async createEntry(
    campaignId: string,
    input: SpellInput,
  ): Promise<Spell> {
    const result = await createCampaignSpell(campaignId, input);
    if ('errors' in result) {
      throw new Error(result.errors.map((e) => e.message).join('; '));
    }
    return result.spell;
  },

  async updateEntry(
    campaignId: string,
    id: string,
    input: SpellInput,
  ): Promise<Spell> {
    const result = await updateCampaignSpell(campaignId, id, input);
    if ('errors' in result) {
      throw new Error(result.errors.map((e) => e.message).join('; '));
    }
    return result.spell;
  },

  async deleteEntry(
    campaignId: string,
    id: string,
  ): Promise<boolean> {
    return deleteCampaignSpell(campaignId, id);
  },
};
