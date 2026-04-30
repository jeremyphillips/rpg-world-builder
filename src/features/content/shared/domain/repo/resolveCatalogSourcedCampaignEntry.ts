import {
  getContentPatch,
  getEntryPatch,
} from '@/features/content/shared/domain/contentPatchRepo';
import type { ContentTypeKey } from '@/features/content/shared/domain/patches/contentPatch.types';
import { resolveSystemEntryWithPatch } from '@/features/content/shared/domain/patches/patchedContentResolution';

/**
 * Applies the campaign content-patch for a catalog-only / ruleset-meta row (no system code row).
 * Same pattern as {@link loadCatalogOnlyMonster}.
 */
export async function patchedCatalogMetaEntry<T>(
  campaignId: string,
  patchKey: string,
  meta: T,
  contentTypeKey: ContentTypeKey,
): Promise<T> {
  const contentPatch = await getContentPatch(campaignId);
  const patch = getEntryPatch(contentPatch, contentTypeKey, patchKey);
  if (patch == null) return meta;
  return resolveSystemEntryWithPatch(meta, patch);
}

type CatalogSourcedDomain = { source?: 'campaign' | 'system' };

/**
 * Common detail-resolution branching from merged catalog metadata (`*AllById[].source`).
 * When `meta` is absent (e.g. catalog still loading), falls back to campaign GET then system.
 */
export async function resolveCatalogSourcedCampaignEntry<
  TResult extends CatalogSourcedDomain,
  TMeta extends TResult,
>(params: {
  meta: TMeta | undefined;
  getCampaign: () => Promise<TResult | null>;
  loadSystemWithPatch: () => Promise<TResult | null>;
  systemRowExists: () => boolean;
  loadCatalogOnly: (meta: TMeta) => Promise<TResult>;
}): Promise<TResult | null> {
  const {
    meta,
    getCampaign,
    loadSystemWithPatch,
    systemRowExists,
    loadCatalogOnly,
  } = params;

  if (meta?.source === 'campaign') {
    return getCampaign();
  }

  if (meta?.source === 'system') {
    return loadSystemWithPatch();
  }

  if (meta) {
    if (systemRowExists()) return loadSystemWithPatch();
    return loadCatalogOnly(meta);
  }

  const campaignEntry = await getCampaign();
  if (campaignEntry) return campaignEntry;
  return loadSystemWithPatch();
}
