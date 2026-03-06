/**
 * Shared campaign equipment API — factory for typed CRUD wrappers.
 *
 * Used by weaponRepo, armorRepo, gearRepo, magicItemRepo.
 * All calls go through the API (DB-backed).
 */
import { apiFetch, ApiError } from '@/app/api';
import type { Visibility } from '@/shared/types/visibility';
import type { ContentSource } from '@/features/content/shared/domain/types';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type CampaignEquipmentDto = {
  _id: string;
  campaignId: string;
  equipmentType: string;
  itemId: string;
  name: string;
  description: string;
  imageKey: string;
  accessPolicy?: Visibility;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CampaignEquipmentEntry = {
  id: string;
  name: string;
  description: string;
  imageKey: string;
  source: ContentSource;
  campaignId: string;
  accessPolicy?: Visibility;
  data: Record<string, unknown>;
};

type ValidationError = {
  path: string;
  code: string;
  message: string;
};

type EquipmentRepoConfig = {
  /** API path segment, e.g. 'weapons', 'armor', 'gear', 'magic-items' */
  pathSegment: string;
  /** Response key for single item, e.g. 'weapon', 'armor' */
  responseKey: string;
  /** Response key for list, e.g. 'weapons', 'armors' */
  responsePluralKey: string;
};

// ---------------------------------------------------------------------------
// DTO → domain
// ---------------------------------------------------------------------------

function toEntry(dto: CampaignEquipmentDto): CampaignEquipmentEntry {
  return {
    id: dto.itemId,
    name: dto.name,
    description: dto.description,
    imageKey: dto.imageKey,
    source: 'campaign' as ContentSource,
    campaignId: dto.campaignId,
    accessPolicy: dto.accessPolicy,
    data: dto.data ?? {},
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function makeCampaignEquipmentRepo(config: EquipmentRepoConfig) {
  const { pathSegment, responseKey, responsePluralKey } = config;

  const basePath = (campaignId: string) =>
    `/api/campaigns/${campaignId}/equipment/${pathSegment}`;

  return {
    async list(campaignId: string): Promise<CampaignEquipmentEntry[]> {
      const data = await apiFetch<Record<string, CampaignEquipmentDto[]>>(
        basePath(campaignId),
      );
      return (data[responsePluralKey] ?? []).map(toEntry);
    },

    async get(campaignId: string, itemId: string): Promise<CampaignEquipmentEntry | null> {
      try {
        const data = await apiFetch<Record<string, CampaignEquipmentDto>>(
          `${basePath(campaignId)}/${itemId}`,
        );
        return toEntry(data[responseKey]);
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },

    async create(
      campaignId: string,
      input: Record<string, unknown>,
    ): Promise<{ entry: CampaignEquipmentEntry } | { errors: ValidationError[] }> {
      try {
        const data = await apiFetch<Record<string, CampaignEquipmentDto>>(
          basePath(campaignId),
          { method: 'POST', body: input },
        );
        return { entry: toEntry(data[responseKey]) };
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 400 && err.payload) {
          const payload = err.payload as { errors?: ValidationError[] };
          if (payload.errors) return { errors: payload.errors };
        }
        throw err;
      }
    },

    async update(
      campaignId: string,
      itemId: string,
      input: Record<string, unknown>,
    ): Promise<{ entry: CampaignEquipmentEntry } | { errors: ValidationError[] }> {
      try {
        const data = await apiFetch<Record<string, CampaignEquipmentDto>>(
          `${basePath(campaignId)}/${itemId}`,
          { method: 'PATCH', body: input },
        );
        return { entry: toEntry(data[responseKey]) };
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 400 && err.payload) {
          const payload = err.payload as { errors?: ValidationError[] };
          if (payload.errors) return { errors: payload.errors };
        }
        throw err;
      }
    },

    async remove(campaignId: string, itemId: string): Promise<boolean> {
      try {
        await apiFetch(`${basePath(campaignId)}/${itemId}`, { method: 'DELETE' });
        return true;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) return false;
        throw err;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton instances
// ---------------------------------------------------------------------------

export const campaignWeaponRepo = makeCampaignEquipmentRepo({
  pathSegment: 'weapons',
  responseKey: 'weapon',
  responsePluralKey: 'weapons',
});

export const campaignArmorRepo = makeCampaignEquipmentRepo({
  pathSegment: 'armor',
  responseKey: 'armor',
  responsePluralKey: 'armors',
});

export const campaignGearRepo = makeCampaignEquipmentRepo({
  pathSegment: 'gear',
  responseKey: 'gear',
  responsePluralKey: 'gears',
});

export const campaignMagicItemRepo = makeCampaignEquipmentRepo({
  pathSegment: 'magic-items',
  responseKey: 'magicItem',
  responsePluralKey: 'magicItems',
});
