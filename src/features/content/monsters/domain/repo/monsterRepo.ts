/**
 * Monster repository — merges system monsters + campaign custom monsters.
 *
 * System monsters come from systemCatalog.monsters.ts.
 * Campaign monsters come from the DB via API.
 *
 * All returned objects carry `source: 'system' | 'campaign'`.
 */
import { apiFetch, ApiError } from '@/app/api';
import type { Visibility } from '@/shared/types/visibility';
import type { CampaignContentRepo, ListOptions } from '@/features/content/shared/domain/repo/contentRepo.types';
import type { Monster, MonsterSummary, MonsterInput } from '@/features/content/monsters/domain/types';
import { getSystemMonsters, getSystemMonster } from '@/features/mechanics/domain/rulesets/system/monsters';
import { getContentPatch } from '@/features/content/shared/domain/contentPatchRepo';
import { applyContentPatch } from '@/features/content/shared/domain/patches/applyContentPatch';
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
    const catalog = opts?.catalog as
      | { monstersAllById?: Record<string, Monster>; monsterAllowedIds?: string[] }
      | undefined;

    if (catalog?.monstersAllById) {
      const monstersById = catalog.monstersAllById;
      const allowedSet = new Set(catalog.monsterAllowedIds ?? []);

      const treatAllAsAllowed = catalog.monsterAllowedIds === undefined;
      const results: MonsterSummary[] = Object.values(monstersById).map((m) =>
        toSummary(m, treatAllAsAllowed || allowedSet.has(m.id)),
      );

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

    const monsterPatches = contentPatch?.patches?.monsters ?? {};
    const campaignIds = new Set(campaign.map((m) => m.id));

    const patchedSystem: Monster[] = system
      .filter((m) => !campaignIds.has(m.id))
      .map((m): Monster => {
        const patch = monsterPatches[m.id];
        if (!patch) return m;
        const merged = applyContentPatch<Monster>(m, patch as Partial<Monster>);
        return { ...merged, patched: true };
      });

    const merged: Monster[] = [...patchedSystem, ...campaign];

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
    const monsterPatch = contentPatch?.patches?.monsters?.[id];
    if (!monsterPatch) return systemMonster;

    const merged = applyContentPatch<Monster>(systemMonster, monsterPatch as Partial<Monster>);
    return { ...merged, patched: true };
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
