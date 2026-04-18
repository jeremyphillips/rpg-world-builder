// ---------------------------------------------------------------------------
// SYSTEM PATCHING
// ---------------------------------------------------------------------------
// Campaigns may store patches for system content entries.
// Resolution order:
// 1) Campaign-owned entry (full override)
// 2) System entry + campaign patch (merged via applyContentPatch)
// 3) Raw system entry
//
// UI for editing patches will be added in a follow-up.

/**
 * Race repository — merges system races + campaign custom races.
 *
 * System races come from the code-defined catalog (systemCatalog.races.ts).
 * Campaign races come from the DB via API.
 *
 * All returned objects carry `source: 'system' | 'campaign'`.
 */
import { apiFetch, ApiError } from '@/app/api';
import type { Visibility } from '@/shared/types/visibility';
import type { CampaignContentRepo, ListOptions } from '@/features/content/shared/domain/repo/contentRepo.types';
import type { Race, RaceSummary, RaceInput } from '@/features/content/races/domain/types';
import { getSystemRaces, getSystemRace } from '@/features/mechanics/domain/rulesets/system/races';
import {
  getContentPatch,
  getEntryPatch,
  getPatchMapForType,
} from '@/features/content/shared/domain/contentPatchRepo';
import {
  mergeSystemCampaignWithPatches,
  resolveSystemEntryWithPatch,
  summariesFromCatalogWithPatches,
} from '@/features/content/shared/domain/patches/patchedContentResolution';
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets';

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

type CampaignRaceDto = {
  _id: string;
  campaignId: string;
  raceId: string;
  name: string;
  description: string;
  imageKey: string;
  accessPolicy?: Visibility;
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

function toRace(dto: CampaignRaceDto): Race {
  return {
    id: dto.raceId,
    name: dto.name,
    description: dto.description,
    imageKey: dto.imageKey || null,
    source: 'campaign' as const,
    campaignId: dto.campaignId,
    accessPolicy: dto.accessPolicy,
  };
}

// ---------------------------------------------------------------------------
// Campaign CRUD helpers
// ---------------------------------------------------------------------------

/** Exported for loadCampaignCatalogOverrides and domain index. */
export async function listCampaignRaces(campaignId: string): Promise<Race[]> {
  const data = await apiFetch<{ races: CampaignRaceDto[] }>(
    `/api/campaigns/${campaignId}/races`,
  );
  return data.races.map(toRace);
}

async function getCampaignRace(
  campaignId: string,
  raceId: string,
): Promise<Race | null> {
  try {
    const data = await apiFetch<{ race: CampaignRaceDto }>(
      `/api/campaigns/${campaignId}/races/${raceId}`,
    );
    return toRace(data.race);
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function createCampaignRace(
  campaignId: string,
  input: RaceInput,
): Promise<{ race: Race } | { errors: ValidationError[] }> {
  try {
    const data = await apiFetch<{ race: CampaignRaceDto }>(
      `/api/campaigns/${campaignId}/races`,
      { method: 'POST', body: input },
    );
    return { race: toRace(data.race) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

async function updateCampaignRace(
  campaignId: string,
  raceId: string,
  input: RaceInput,
): Promise<{ race: Race } | { errors: ValidationError[] }> {
  try {
    const data = await apiFetch<{ race: CampaignRaceDto }>(
      `/api/campaigns/${campaignId}/races/${raceId}`,
      { method: 'PATCH', body: input },
    );
    return { race: toRace(data.race) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

async function deleteCampaignRace(
  campaignId: string,
  raceId: string,
): Promise<boolean> {
  try {
    await apiFetch(`/api/campaigns/${campaignId}/races/${raceId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return false;
    throw err;
  }
}

/** Exported for domain index. */
export { getCampaignRace, createCampaignRace, updateCampaignRace, deleteCampaignRace };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSummary(race: Race, allowedInCampaign: boolean): RaceSummary {
  const base = {
    id: race.id,
    name: race.name,
    description: race.description,
    imageKey: race.imageKey,
    campaigns: race.campaigns,
    accessPolicy: race.accessPolicy,
    patched: race.patched,
    allowedInCampaign,
  };
  return race.source === 'system'
    ? { ...base, source: 'system' as const, systemId: race.systemId }
    : { ...base, source: 'campaign' as const, campaignId: race.campaignId };
}

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase());
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const raceRepo: CampaignContentRepo<Race, RaceSummary, RaceInput> = {

  async listSummaries(
    campaignId: string,
    systemId: SystemRulesetId,
    opts?: ListOptions,
  ): Promise<RaceSummary[]> {
    const catalog = opts?.catalog;

    if (catalog) {
      const racesById = catalog.racesAllById ?? catalog.racesById;

      if (!racesById) {
        return [];
      }

      const contentPatch = await getContentPatch(campaignId);
      let results = summariesFromCatalogWithPatches({
        catalogById: racesById as Record<string, Race>,
        patchDoc: contentPatch,
        contentTypeKey: 'races',
        allowedIds: catalog.raceAllowedIds,
        toSummary,
      });

      if (opts?.search) {
        return results.filter((r) => matchesSearch(r.name, opts.search!)).sort((a, b) => a.name.localeCompare(b.name));
      }
      return results.sort((a, b) => a.name.localeCompare(b.name));
    }

    const [system, campaign, contentPatch] = await Promise.all([
      Promise.resolve(getSystemRaces(systemId)),
      listCampaignRaces(campaignId),
      getContentPatch(campaignId),
    ]);

    const merged = mergeSystemCampaignWithPatches(
      [...system],
      campaign,
      getPatchMapForType(contentPatch, 'races'),
    );

    let results = merged.map((r) => toSummary(r, true));

    if (opts?.search) {
      results = results.filter((r) => matchesSearch(r.name, opts.search!));
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getEntry(
    campaignId: string,
    systemId: SystemRulesetId,
    id: string,
  ): Promise<Race | null> {
    const campaignRace = await getCampaignRace(campaignId, id);
    if (campaignRace) return campaignRace;

    const systemRace = getSystemRace(systemId, id) ?? null;
    if (!systemRace) return null;

    const contentPatch = await getContentPatch(campaignId);
    return resolveSystemEntryWithPatch(
      systemRace,
      getEntryPatch(contentPatch, 'races', id),
    );
  },

  async createEntry(
    campaignId: string,
    input: RaceInput,
  ): Promise<Race> {
    const result = await createCampaignRace(campaignId, input);
    if ('errors' in result) {
      throw new Error(result.errors.map(e => e.message).join('; '));
    }
    return result.race;
  },

  async updateEntry(
    campaignId: string,
    id: string,
    patch: RaceInput,
  ): Promise<Race> {
    const result = await updateCampaignRace(campaignId, id, patch);
    if ('errors' in result) {
      throw new Error(result.errors.map(e => e.message).join('; '));
    }
    return result.race;
  },

  async deleteEntry(
    campaignId: string,
    id: string,
  ): Promise<boolean> {
    return deleteCampaignRace(campaignId, id);
  },
};
