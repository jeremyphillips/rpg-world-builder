/**
 * Monster repository — merges system monsters + campaign custom monsters.
 *
 * System monsters come from `rulesets/system/monsters/` (see `monsters/index.ts`).
 * Campaign monsters come from the DB via API.
 *
 * All returned objects carry `source: 'system' | 'campaign'`.
 */
import { apiFetch, ApiError } from '@/app/api';
import type { Visibility } from '@/shared/types/visibility';
import type { CampaignContentRepo, ListOptions } from '@/features/content/shared/domain/repo/contentRepo.types';
import type { Monster, MonsterSummary, MonsterInput } from '@/features/content/monsters/domain/types';
import { getSystemMonsters, getSystemMonster } from '@/features/mechanics/domain/rulesets/system/monsters';
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

type CampaignMonsterDto = {
  _id: string;
  campaignId: string;
  monsterId: string;
  name: string;
  data: Record<string, unknown>;
  accessPolicy?: Visibility;
  createdAt: string;
  updatedAt: string;
};

type ValidationError = { path: string; code: string; message: string };

function toMonster(dto: CampaignMonsterDto): Monster {
  const data = dto.data ?? {};
  return {
    id: dto.monsterId,
    name: dto.name,
    ...data,
    source: 'campaign',
    campaignId: dto.campaignId,
    accessPolicy: dto.accessPolicy,
  } as Monster;
}

export async function listCampaignMonsters(campaignId: string): Promise<Monster[]> {
  try {
    const data = await apiFetch<{ monsters: CampaignMonsterDto[] }>(
      `/api/campaigns/${campaignId}/monsters`,
    );
    return data.monsters.map(toMonster);
  } catch {
    return [];
  }
}

async function getCampaignMonster(
  campaignId: string,
  monsterId: string,
): Promise<Monster | null> {
  try {
    const data = await apiFetch<{ monster: CampaignMonsterDto }>(
      `/api/campaigns/${campaignId}/monsters/${monsterId}`,
    );
    return toMonster(data.monster);
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function createCampaignMonster(
  campaignId: string,
  input: MonsterInput,
): Promise<{ monster: Monster } | { errors: ValidationError[] }> {
  try {
    const data = await apiFetch<{ monster: CampaignMonsterDto }>(
      `/api/campaigns/${campaignId}/monsters`,
      { method: 'POST', body: input },
    );
    return { monster: toMonster(data.monster) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

async function updateCampaignMonster(
  campaignId: string,
  monsterId: string,
  input: MonsterInput,
): Promise<{ monster: Monster } | { errors: ValidationError[] }> {
  try {
    const data = await apiFetch<{ monster: CampaignMonsterDto }>(
      `/api/campaigns/${campaignId}/monsters/${monsterId}`,
      { method: 'PATCH', body: input },
    );
    return { monster: toMonster(data.monster) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

async function deleteCampaignMonster(
  campaignId: string,
  monsterId: string,
): Promise<boolean> {
  try {
    await apiFetch(`/api/campaigns/${campaignId}/monsters/${monsterId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return false;
    throw err;
  }
}

export { getCampaignMonster, createCampaignMonster, updateCampaignMonster, deleteCampaignMonster };

function toSummary(monster: Monster, allowedInCampaign: boolean): MonsterSummary {
  const base = {
    ...monster,
    allowedInCampaign,
  };
  return base as MonsterSummary;
}

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase());
}

export const monsterRepo: CampaignContentRepo<Monster, MonsterSummary, MonsterInput> = {
  async listSummaries(
    campaignId: string,
    systemId: SystemRulesetId,
    opts?: ListOptions,
  ): Promise<MonsterSummary[]> {
    const catalog = opts?.catalog;

    if (catalog?.monstersAllById) {
      const monstersById = catalog.monstersAllById;

      const contentPatch = await getContentPatch(campaignId);
      const results = summariesFromCatalogWithPatches({
        catalogById: monstersById as Record<string, Monster>,
        patchDoc: contentPatch,
        contentTypeKey: 'monsters',
        allowedIds: catalog.monsterAllowedIds,
        toSummary,
      });

      if (opts?.search) {
        return results
          .filter((r) => matchesSearch(r.name, opts.search!))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      return results.sort((a, b) => a.name.localeCompare(b.name));
    }

    const [system, campaign, contentPatch] = await Promise.all([
      Promise.resolve(getSystemMonsters(systemId)),
      listCampaignMonsters(campaignId),
      getContentPatch(campaignId),
    ]);

    const merged = mergeSystemCampaignWithPatches(
      [...system],
      campaign,
      getPatchMapForType(contentPatch, 'monsters'),
    );

    let results = merged.map((m) => toSummary(m, true));

    if (opts?.search) {
      results = results.filter((r) => matchesSearch(r.name, opts.search!));
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getEntry(
    campaignId: string,
    systemId: SystemRulesetId,
    id: string,
  ): Promise<Monster | null> {
    const campaignMonster = await getCampaignMonster(campaignId, id);
    if (campaignMonster) return campaignMonster;

    const systemMonster = getSystemMonster(systemId, id) ?? null;
    if (!systemMonster) return null;

    const contentPatch = await getContentPatch(campaignId);
    return resolveSystemEntryWithPatch(
      systemMonster,
      getEntryPatch(contentPatch, 'monsters', id),
    );
  },

  async createEntry(campaignId: string, input: MonsterInput): Promise<Monster> {
    const result = await createCampaignMonster(campaignId, input);
    if ('errors' in result) {
      throw new Error(result.errors.map((e) => e.message).join('; '));
    }
    return result.monster;
  },

  async updateEntry(
    campaignId: string,
    id: string,
    patch: MonsterInput,
  ): Promise<Monster> {
    const result = await updateCampaignMonster(campaignId, id, patch);
    if ('errors' in result) {
      throw new Error(result.errors.map((e) => e.message).join('; '));
    }
    return result.monster;
  },

  async deleteEntry(campaignId: string, id: string): Promise<boolean> {
    return deleteCampaignMonster(campaignId, id);
  },
};
