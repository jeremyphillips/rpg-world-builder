/**
 * Client-side repository for campaign-owned custom skill proficiencies.
 *
 * All calls go through the API (DB-backed). System skill proficiencies
 * come from systemCatalog.skillProficiencies.ts.
 */
import { apiFetch, ApiError } from '@/app/api';
import type { Visibility } from '@/shared/types/visibility';
import type { ContentSource } from './types';
import type { SkillProficiency } from './types';

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

type CampaignSkillProficiencyDto = {
  _id: string;
  campaignId: string;
  skillProficiencyId: string;
  name: string;
  description: string;
  ability: string;
  suggestedClasses: string[];
  examples: string[];
  tags: string[];
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

function toSkillProficiency(dto: CampaignSkillProficiencyDto): SkillProficiency {
  return {
    id: dto.skillProficiencyId,
    name: dto.name,
    description: dto.description,
    ability: dto.ability as SkillProficiency['ability'],
    suggestedClasses: dto.suggestedClasses ?? [],
    examples: dto.examples ?? [],
    tags: dto.tags ?? [],
    source: 'campaign' as ContentSource,
    campaignId: dto.campaignId,
    accessPolicy: dto.accessPolicy,
  } as SkillProficiency;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function listCampaignSkillProficiencies(
  campaignId: string,
): Promise<SkillProficiency[]> {
  const data = await apiFetch<{
    skillProficiencies: CampaignSkillProficiencyDto[];
  }>(`/api/campaigns/${campaignId}/skill-proficiencies`);
  return (data.skillProficiencies ?? []).map(toSkillProficiency);
}

export async function getCampaignSkillProficiency(
  campaignId: string,
  skillProficiencyId: string,
): Promise<SkillProficiency | null> {
  try {
    const data = await apiFetch<{
      skillProficiency: CampaignSkillProficiencyDto;
    }>(
      `/api/campaigns/${campaignId}/skill-proficiencies/${skillProficiencyId}`,
    );
    return toSkillProficiency(data.skillProficiency);
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function createCampaignSkillProficiency(
  campaignId: string,
  input: Record<string, unknown>,
): Promise<
  | { skillProficiency: SkillProficiency }
  | { errors: ValidationError[] }
> {
  try {
    const data = await apiFetch<{
      skillProficiency: CampaignSkillProficiencyDto;
    }>(`/api/campaigns/${campaignId}/skill-proficiencies`, {
      method: 'POST',
      body: input,
    });
    return { skillProficiency: toSkillProficiency(data.skillProficiency) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

export async function updateCampaignSkillProficiency(
  campaignId: string,
  skillProficiencyId: string,
  input: Record<string, unknown>,
): Promise<
  | { skillProficiency: SkillProficiency }
  | { errors: ValidationError[] }
> {
  try {
    const data = await apiFetch<{
      skillProficiency: CampaignSkillProficiencyDto;
    }>(
      `/api/campaigns/${campaignId}/skill-proficiencies/${skillProficiencyId}`,
      { method: 'PATCH', body: input },
    );
    return { skillProficiency: toSkillProficiency(data.skillProficiency) };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

export async function deleteCampaignSkillProficiency(
  campaignId: string,
  skillProficiencyId: string,
): Promise<boolean> {
  try {
    await apiFetch(
      `/api/campaigns/${campaignId}/skill-proficiencies/${skillProficiencyId}`,
      { method: 'DELETE' },
    );
    return true;
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return false;
    throw err;
  }
}
