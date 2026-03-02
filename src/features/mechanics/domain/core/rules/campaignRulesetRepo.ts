/**
 * Campaign ruleset patch repository.
 *
 * Provides a persistence seam with two backends:
 *   - API-backed (real DB) when USE_DB_RULESET_PATCHES is true
 *   - In-memory simulated patches (legacy) when false
 *
 * Toggle the flag to switch. Default: false (in-memory).
 */
import { apiFetch, ApiError } from '@/app/api';
import type { CampaignRulesetPatch, SystemRulesetId } from './ruleset.types';
import type { Ruleset } from '@/shared/types';
import { getSystemRuleset } from './systemCatalog';
import { normalizeCampaignRulesetPatch } from './normalizeCampaignRulesetPatch';
import { validateCampaignRulesetPatch } from './validateCampaignRulesetPatch';
import { resolveCampaignRuleset } from './resolveCampaignRuleset';
import type { ValidationResult } from './validateCampaignRulesetPatch';
import { DEFAULT_SYSTEM_RULESET_ID } from './systemIds';
import { assertSystemRulesetId } from '@/features/mechanics/domain/core/rules';

// ---------------------------------------------------------------------------
// Feature flag
// ---------------------------------------------------------------------------
/** @deprecated Use the API-backed implementation instead. */
export const USE_DB_RULESET_PATCHES = true;


// ---------------------------------------------------------------------------
// Draft factory
// ---------------------------------------------------------------------------

export function createDefaultCampaignRulesetPatch(
  campaignId: string,
  systemId: SystemRulesetId = DEFAULT_SYSTEM_RULESET_ID,
): CampaignRulesetPatch {
  return {
    _id: `draft-${campaignId}`,
    campaignId,
    systemId,
  } as CampaignRulesetPatch;
}

// ---------------------------------------------------------------------------
// In-memory store (used when flag is false)
// ---------------------------------------------------------------------------

const memoryStore = new Map<string, CampaignRulesetPatch>();

let seeded = false;

export function seedMemoryStore(patches: CampaignRulesetPatch[]): void {
  if (seeded) return;
  seeded = true;
  for (const p of patches) {
    memoryStore.set(p.campaignId, p);
  }
}

// ---------------------------------------------------------------------------
// API-backed implementation
// ---------------------------------------------------------------------------

async function apiGet(campaignId: string): Promise<CampaignRulesetPatch | null> {
  try {
    const data = await apiFetch<{ patch: CampaignRulesetPatch }>(
      `/api/campaigns/${campaignId}/ruleset-patch`,
    );
    return data.patch ?? null;
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function apiSave(patch: CampaignRulesetPatch): Promise<CampaignRulesetPatch> {
  const data = await apiFetch<{ patch: CampaignRulesetPatch }>(
    `/api/campaigns/${patch.campaignId}/ruleset-patch`,
    { method: 'PUT', body: patch },
  );
  return data.patch;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getCampaignRulesetPatch(
  campaignId: string,
): Promise<CampaignRulesetPatch | null> {
  const patch = USE_DB_RULESET_PATCHES
    ? await apiGet(campaignId)
    : (memoryStore.get(campaignId) ?? null);

  if (!patch) return null;

  assertSystemRulesetId(patch.systemId);

  return patch;
}

export async function saveCampaignRulesetPatch(
  patch: CampaignRulesetPatch,
): Promise<{ patch: CampaignRulesetPatch; validation: ValidationResult }> {
  const normalized = normalizeCampaignRulesetPatch(patch);
  const system = getSystemRuleset(normalized.systemId);
  const validation = validateCampaignRulesetPatch(normalized, system);

  if (!validation.ok) {
    return { patch: normalized, validation };
  }

  if (USE_DB_RULESET_PATCHES) {
    const saved = await apiSave(normalized);
    return { patch: saved, validation };
  }

  memoryStore.set(normalized.campaignId, normalized);
  return { patch: normalized, validation };
}

export async function getResolvedCampaignRuleset(
  campaignId: string,
): Promise<Ruleset | null> {
  const patch = await getCampaignRulesetPatch(campaignId);
  if (!patch) return null;

  const system = getSystemRuleset(patch.systemId);
  const normalized = normalizeCampaignRulesetPatch(patch);
  return resolveCampaignRuleset(system, normalized);
}
