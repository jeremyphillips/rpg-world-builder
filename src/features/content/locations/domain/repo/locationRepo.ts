/**
 * Location repository — merges system locations + campaign locations + content patches.
 */
import { apiFetch, ApiError } from '@/app/api';
import type { Visibility } from '@/shared/types/visibility';
import type { CampaignContentRepo, ListOptions } from '@/features/content/shared/domain/repo/contentRepo.types';
import type { Location, LocationFields, LocationInput, LocationSummary } from '@/features/content/locations/domain/types';
import { getSystemLocation, getSystemLocations } from '@/features/mechanics/domain/rulesets/system/locations';
import { getContentPatch } from '@/features/content/shared/domain/contentPatchRepo';
import { applyContentPatch } from '@/features/content/shared/domain/patches/applyContentPatch';
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets';
import type { LocationScaleId } from '@/shared/domain/locations';

type CampaignLocationDto = {
  id: string;
  campaignId: string;
  name: string;
  scale: string;
  category?: string;
  description?: string;
  imageKey?: string;
  accessPolicy?: Visibility;
  parentId?: string;
  ancestorIds?: string[];
  sortOrder?: number;
  label?: { short?: string; number?: string };
  aliases?: string[];
  tags?: string[];
  connections?: LocationFields['connections'];
  createdAt?: string;
  updatedAt?: string;
};

type ValidationError = {
  path: string;
  code: string;
  message: string;
};

function toCampaignLocation(
  dto: CampaignLocationDto,
): Location & { source: 'campaign'; campaignId: string } {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    source: 'campaign',
    campaignId: dto.campaignId,
    accessPolicy: dto.accessPolicy,
    scale: dto.scale as LocationScaleId,
    category: dto.category,
    imageKey: dto.imageKey ?? null,
    parentId: dto.parentId,
    ancestorIds: dto.ancestorIds ?? [],
    sortOrder: dto.sortOrder,
    label: dto.label,
    aliases: dto.aliases,
    tags: dto.tags,
    connections: dto.connections,
  };
}

export async function listCampaignLocations(campaignId: string): Promise<Location[]> {
  const data = await apiFetch<{ locations: CampaignLocationDto[] }>(
    `/api/campaigns/${campaignId}/locations`,
  );
  return (data.locations ?? []).map(toCampaignLocation);
}

async function getCampaignLocation(
  campaignId: string,
  locationId: string,
): Promise<(Location & { source: 'campaign'; campaignId: string }) | null> {
  try {
    const data = await apiFetch<{ location: CampaignLocationDto }>(
      `/api/campaigns/${campaignId}/locations/${locationId}`,
    );
    return toCampaignLocation(data.location);
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function createCampaignLocation(
  campaignId: string,
  body: Record<string, unknown>,
): Promise<
  | { location: Location & { source: 'campaign'; campaignId: string } }
  | { errors: ValidationError[] }
> {
  try {
    const data = await apiFetch<{ location: CampaignLocationDto }>(
      `/api/campaigns/${campaignId}/locations`,
      { method: 'POST', body },
    );
    return { location: toCampaignLocation(data.location) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

async function updateCampaignLocation(
  campaignId: string,
  locationId: string,
  body: Record<string, unknown>,
): Promise<
  | { location: Location & { source: 'campaign'; campaignId: string } }
  | { errors: ValidationError[] }
> {
  try {
    const data = await apiFetch<{ location: CampaignLocationDto }>(
      `/api/campaigns/${campaignId}/locations/${locationId}`,
      { method: 'PATCH', body },
    );
    return { location: toCampaignLocation(data.location) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

async function deleteCampaignLocation(campaignId: string, locationId: string): Promise<boolean> {
  try {
    await apiFetch(`/api/campaigns/${campaignId}/locations/${locationId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return false;
    throw err;
  }
}

export type LocationContentItem =
  | (Location & {
      source: 'system';
      systemId: SystemRulesetId;
      campaignId?: never;
      patched?: boolean;
    })
  | (Location & {
      source: 'campaign';
      campaignId: string;
      systemId?: never;
      patched?: boolean;
    });

function toSummary(loc: Location, allowedInCampaign: boolean): LocationSummary {
  const base = {
    id: loc.id,
    name: loc.name,
    description: loc.description,
    scale: loc.scale,
    category: loc.category,
    imageKey: loc.imageKey,
    parentId: loc.parentId,
    ancestorIds: loc.ancestorIds,
    sortOrder: loc.sortOrder,
    label: loc.label,
    aliases: loc.aliases,
    tags: loc.tags,
    connections: loc.connections,
    accessPolicy: loc.accessPolicy,
    patched: loc.patched,
    allowedInCampaign,
  };
  return loc.source === 'system'
    ? { ...base, source: 'system' as const, systemId: loc.systemId }
    : { ...base, source: 'campaign' as const, campaignId: loc.campaignId };
}

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase());
}

function locationInputToBody(input: LocationInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: input.name,
    description: input.description,
    accessPolicy: input.accessPolicy,
    imageKey: input.imageKey,
    scale: input.scale,
    category: input.category,
    parentId: input.parentId,
    sortOrder: input.sortOrder,
    label: input.label,
    aliases: input.aliases,
    tags: input.tags,
    connections: input.connections,
  };
  if (input.id) body.locationId = input.id;
  return body;
}

export const locationRepo: CampaignContentRepo<LocationContentItem, LocationSummary, LocationInput> = {
  async listSummaries(
    campaignId: string,
    systemId: SystemRulesetId,
    opts?: ListOptions,
  ): Promise<LocationSummary[]> {
    const [system, campaign, contentPatch] = await Promise.all([
      Promise.resolve([...getSystemLocations(systemId)]),
      listCampaignLocations(campaignId),
      getContentPatch(campaignId),
    ]);

    const locationPatches = contentPatch?.patches?.locations ?? {};
    const campaignIds = new Set(campaign.map((l) => l.id));

    const patchedSystem: LocationContentItem[] = system
      .filter((l) => !campaignIds.has(l.id))
      .map((l): LocationContentItem => {
        const patch = locationPatches[l.id];
        if (!patch) return { ...l, source: 'system', systemId } as LocationContentItem;
        const merged = applyContentPatch<Location>(l, patch as Partial<Location>);
        return { ...merged, source: 'system', systemId, patched: true } as LocationContentItem;
      });

    const merged: LocationContentItem[] = [...patchedSystem, ...campaign];

    let results = merged.map((r) => toSummary(r, true));

    if (opts?.search) {
      results = results.filter((r) => matchesSearch(r.name, opts.search!));
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getEntry(campaignId: string, systemId: SystemRulesetId, id: string): Promise<LocationContentItem | null> {
    const campaignEntry = await getCampaignLocation(campaignId, id);
    if (campaignEntry) return campaignEntry;

    const systemEntry = getSystemLocation(systemId, id) ?? null;
    if (!systemEntry) return null;

    const contentPatch = await getContentPatch(campaignId);
    const entryPatch = contentPatch?.patches?.locations?.[id];
    if (!entryPatch) return { ...systemEntry, source: 'system', systemId } as LocationContentItem;

    const merged = applyContentPatch<Location>(systemEntry, entryPatch as Partial<Location>);
    return { ...merged, source: 'system', systemId, patched: true } as LocationContentItem;
  },

  async createEntry(campaignId: string, input: LocationInput): Promise<LocationContentItem> {
    const result = await createCampaignLocation(campaignId, locationInputToBody(input));
    if ('errors' in result) {
      throw new Error(result.errors.map((e) => e.message).join('; '));
    }
    return result.location;
  },

  async updateEntry(campaignId: string, id: string, input: LocationInput): Promise<LocationContentItem> {
    const result = await updateCampaignLocation(campaignId, id, locationInputToBody(input));
    if ('errors' in result) {
      throw new Error(result.errors.map((e) => e.message).join('; '));
    }
    return result.location;
  },

  async deleteEntry(campaignId: string, id: string): Promise<boolean> {
    return deleteCampaignLocation(campaignId, id);
  },
};
