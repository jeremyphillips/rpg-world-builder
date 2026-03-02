/**
 * Client-side repository for campaign-owned custom races.
 *
 * All calls go through the API (DB-backed). System races are not stored here —
 * they come from systemCatalog.races.ts.
 */
import { apiFetch, ApiError } from '@/app/api';
import type { Visibility } from '@/shared/types';
import type { Race, RaceInput } from './types';
import type { ContentSource } from './types';

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

type CampaignRaceDto = {
  _id: string;
  campaignId: string;
  raceId: string;
  name: string;
  description: string;
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
    source: 'campaign' as ContentSource,
    campaignId: dto.campaignId,
    accessPolicy: dto.accessPolicy,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function listCampaignRaces(campaignId: string): Promise<Race[]> {
  const data = await apiFetch<{ races: CampaignRaceDto[] }>(
    `/api/campaigns/${campaignId}/races`,
  );
  return data.races.map(toRace);
}

export async function getCampaignRace(
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

export async function createCampaignRace(
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

export async function updateCampaignRace(
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

export async function deleteCampaignRace(
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
