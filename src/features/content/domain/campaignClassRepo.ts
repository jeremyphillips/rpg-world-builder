/**
 * Client-side repository for campaign-owned custom classes.
 *
 * All calls go through the API (DB-backed). System classes come from
 * systemCatalog.classes.ts.
 */
import { apiFetch, ApiError } from '@/app/api';
import type { Visibility } from '@/shared/types/visibility';
import type { ContentSource } from './types';
import type { CharacterClass } from '@/features/classes/domain/types';

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

function toCharacterClass(dto: CampaignClassDto): CharacterClass & { source: ContentSource; campaignId: string; accessPolicy?: Visibility } {
  const d = dto.data ?? {};
  return {
    id: dto.classId,
    name: dto.name,
    description: dto.description,
    source: 'campaign' as ContentSource,
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
// Public API
// ---------------------------------------------------------------------------

export async function listCampaignClasses(
  campaignId: string,
): Promise<(CharacterClass & { source: 'campaign'; campaignId: string; accessPolicy?: Visibility })[]> {
  const data = await apiFetch<{ classes: CampaignClassDto[] }>(
    `/api/campaigns/${campaignId}/classes`,
  );
  return (data.classes ?? []).map(toCharacterClass);
}

export async function getCampaignClass(
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

export async function createCampaignClass(
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

export async function updateCampaignClass(
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

export async function deleteCampaignClass(
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
