/**
 * Location repository — merges system locations + campaign locations + content patches.
 */
import { apiFetch, ApiError } from '@/app/api';
import type { Visibility } from '@/shared/types/visibility';
import type { CampaignContentRepo, ListOptions } from '@/features/content/shared/domain/repo/contentRepo.types';
import { isCampaignLocationListScale } from '@/shared/domain/locations';
import type { LocationBuildingMeta, LocationBuildingStructure } from '@/shared/domain/locations';
import type {
  Location,
  LocationBaseFields,
  LocationInput,
  LocationSummary,
} from '@/features/content/locations/domain/model/location';
import { getSystemLocation, getSystemLocations } from '@/features/mechanics/domain/rulesets/system/locations';
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
  connections?: LocationBaseFields['connections'];
  buildingMeta?: LocationBuildingMeta;
  buildingStructure?: LocationBuildingStructure;
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
    buildingMeta: dto.buildingMeta,
    buildingStructure: dto.buildingStructure,
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
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: { message?: string }[] };
      const msg = payload.errors?.map((e) => e.message).filter(Boolean).join(' ');
      if (msg) throw new Error(msg);
    }
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
    buildingMeta: loc.buildingMeta,
    buildingStructure: loc.buildingStructure,
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

  const scale = String(input.scale ?? '').trim();
  if (scale === 'building') {
    if (input.buildingMeta !== undefined) body.buildingMeta = input.buildingMeta;
    if (input.buildingStructure !== undefined) body.buildingStructure = input.buildingStructure;
  }

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

    const campaignIds = new Set(campaign.map((l) => l.id));
    const mergedCore = mergeSystemCampaignWithPatches(
      [...system],
      campaign,
      getPatchMapForType(contentPatch, 'locations'),
    );
    const merged: LocationContentItem[] = mergedCore.map((l): LocationContentItem =>
      campaignIds.has(l.id)
        ? (l as LocationContentItem)
        : ({ ...l, source: 'system', systemId } as LocationContentItem),
    );

    let results = merged
      .map((r) => toSummary(r, true))
      /** Campaign list: buildings as first-class; floor/room only via building (see `locationScaleUi.policy`). */
      .filter((r) => isCampaignLocationListScale(r.scale));

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
    const patched = resolveSystemEntryWithPatch(
      systemEntry,
      getEntryPatch(contentPatch, 'locations', id),
    );
    return { ...patched, source: 'system', systemId } as LocationContentItem;
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
