/**
 * Client-side repository for campaign content patches.
 *
 * Mirrors the race repo campaign CRUD pattern — thin wrapper around apiFetch
 * pointing at the /campaigns/:id/content-patch endpoints.
 *
 * TODO: Other content repos (equipment, spells, etc.) can reuse this
 * same fetcher once they adopt the patching pattern.
 */
import { apiFetch, ApiError } from '@/app/api';
import type {
  CampaignContentPatch,
  ContentPatchMap,
  ContentTypeKey,
} from './patches/contentPatch.types';

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

type ContentPatchDto = {
  campaignId: string;
  patches: ContentPatchMap;
  createdAt?: string;
  updatedAt?: string;
};

type ValidationError = {
  path: string;
  code: string;
  message: string;
};

// ---------------------------------------------------------------------------
// Document-level API
// ---------------------------------------------------------------------------

export async function getContentPatch(
  campaignId: string,
): Promise<CampaignContentPatch> {
  const data = await apiFetch<{ patch: ContentPatchDto }>(
    `/api/campaigns/${campaignId}/content-patch`,
  );
  return data.patch;
}

export async function upsertContentPatch(
  campaignId: string,
  patches: ContentPatchMap,
): Promise<
  { patch: CampaignContentPatch } | { errors: ValidationError[] }
> {
  try {
    const data = await apiFetch<{ patch: ContentPatchDto }>(
      `/api/campaigns/${campaignId}/content-patch`,
      { method: 'PUT', body: { patches } },
    );
    return { patch: data.patch };
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 400 && err.payload) {
      const payload = err.payload as { errors?: ValidationError[] };
      if (payload.errors) return { errors: payload.errors };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Entry-level helpers
// ---------------------------------------------------------------------------
// These are intentionally coarse (whole-object merge/replace) until we add
// a field-level diff UI.

/**
 * Extract the patch for a single entry from a patch document.
 * Returns null if no patch exists for the given content type + entry id.
 */
export function getEntryPatch<T = unknown>(
  patchDoc: CampaignContentPatch | null,
  contentTypeKey: ContentTypeKey,
  entryId: string,
): T | null {
  const entry = patchDoc?.patches?.[contentTypeKey]?.[entryId];
  return (entry as T) ?? null;
}

/**
 * Create or update the patch for a single entry.
 * Always fetches the latest document first so we never overwrite patches
 * belonging to other content types or other entries.
 */
export async function upsertEntryPatch(
  campaignId: string,
  contentTypeKey: ContentTypeKey,
  entryId: string,
  patch: unknown,
): Promise<void> {
  const doc = await getContentPatch(campaignId);
  const current = doc.patches ?? {};

  const updatedPatches: ContentPatchMap = {
    ...current,
    [contentTypeKey]: {
      ...current[contentTypeKey],
      [entryId]: patch,
    },
  };

  const result = await upsertContentPatch(campaignId, updatedPatches);
  if ('errors' in result) {
    throw new Error(result.errors.map(e => e.message).join('; '));
  }
}

/**
 * Remove the patch for a single entry.
 * Cleans up empty content-type maps but keeps the document intact.
 */
export async function removeEntryPatch(
  campaignId: string,
  contentTypeKey: ContentTypeKey,
  entryId: string,
): Promise<void> {
  const doc = await getContentPatch(campaignId);
  const current = { ...doc.patches };

  const typeMap = { ...current[contentTypeKey] };
  delete typeMap[entryId];

  if (Object.keys(typeMap).length === 0) {
    delete current[contentTypeKey];
  } else {
    current[contentTypeKey] = typeMap;
  }

  const result = await upsertContentPatch(campaignId, current);
  if ('errors' in result) {
    throw new Error(result.errors.map(e => e.message).join('; '));
  }
}
