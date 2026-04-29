import type { CampaignContentPatch, ContentTypeKey } from './contentPatch.types';
import { applyContentPatch } from './applyContentPatch';
import { getPatchMapForType } from '../contentPatchRepo';

/**
 * Merge system entries with campaign-owned overrides and per-id content patches.
 * Campaign rows replace system rows with the same id; remaining system rows
 * get `applyContentPatch` when a patch exists, with `patched: true`.
 */
export function mergeSystemCampaignWithPatches<T extends { id: string }>(
  system: T[],
  campaign: T[],
  patchesById: Record<string, unknown>,
): T[] {
  const campaignIds = new Set(campaign.map((c) => c.id));
  const patchedSystem = system
    .filter((s) => !campaignIds.has(s.id))
    .map((s): T => {
      const patch = patchesById[s.id] as Partial<T> | undefined;
      if (!patch) return s;
      const merged = applyContentPatch(s, patch);
      return { ...merged, patched: true };
    });
  return [...patchedSystem, ...campaign];
}

/**
 * Apply a campaign patch to a single system entry, or return the entry unchanged.
 */
export function resolveSystemEntryWithPatch<T>(
  systemEntry: T,
  patch: unknown,
): T {
  if (patch == null) return systemEntry;
  const merged = applyContentPatch(systemEntry, patch as Partial<T>);
  return { ...merged, patched: true };
}

type CatalogEntryForPatch = {
  id: string;
  source: string;
  patched?: boolean;
};

/**
 * Build list rows from a catalog map + patch doc (e.g. races/monsters list routes).
 * Sets `patched` when the entry is system-owned and a patch exists for its id.
 */
export function summariesFromCatalogWithPatches<
  TEntry extends CatalogEntryForPatch,
  TSummary,
>(args: {
  catalogById: Record<string, TEntry>;
  patchDoc: CampaignContentPatch | null | undefined;
  contentTypeKey: ContentTypeKey;
  allowedIds: string[] | undefined;
  toSummary: (entry: TEntry, allowedInCampaign: boolean) => TSummary;
}): TSummary[] {
  const { catalogById, patchDoc, contentTypeKey, allowedIds, toSummary } = args;
  const patchesMap = getPatchMapForType(patchDoc, contentTypeKey);
  const allowedSet = new Set(allowedIds ?? []);
  const treatAllAsAllowed = allowedIds === undefined;

  return Object.values(catalogById).map((entry) => {
    const patchedFromPatch =
      entry.source === 'system' && Boolean(patchesMap[entry.id]);
    const withPatchFlag = {
      ...entry,
      patched: patchedFromPatch || Boolean(entry.patched),
    } as TEntry;
    return toSummary(
      withPatchFlag,
      treatAllAsAllowed || allowedSet.has(entry.id),
    );
  });
}
