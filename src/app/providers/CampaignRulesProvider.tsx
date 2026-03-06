/**
 * Provides the active campaign's resolved CampaignRulesContext (ruleset + catalog).
 *
 * Must be rendered inside ActiveCampaignProvider.
 *
 * Load order:
 *   1. Synchronously resolve from static/fallback rulesets (instant, no flash).
 *   2. Kick off an async fetch for both the live ruleset AND campaign content.
 *   3. When the fetches return, rebuild the catalog with merged content.
 *
 * If no DB patch exists or the fetch fails, the static fallback stays active.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useActiveCampaign } from './ActiveCampaignProvider';
import {
  resolveCampaignRulesContext,
  type CampaignRulesContext,
} from '@/features/mechanics/domain/core/rules/resolveCampaignRulesContext';
import { getResolvedCampaignRuleset } from '@/features/mechanics/domain/core/rules/campaignRulesetRepo';
import {
  systemCatalog,
  type CampaignCatalog,
} from '@/features/mechanics/domain/core/rules/systemCatalog';
import {
  buildCampaignCatalog,
  type CampaignCatalogAdmin,
} from '@/features/mechanics/domain/core/rules/buildCampaignCatalog';
import { loadCampaignCatalogOverrides } from '@/features/mechanics/domain/core/rules/loadCampaignCatalogOverrides';
import type { Ruleset } from '@/shared/types/ruleset';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CampaignRulesCtx = createContext<CampaignRulesContext | undefined>(undefined);

export const CampaignRulesProvider = ({ children }: { children: ReactNode }) => {
  const { campaign, campaignId } = useActiveCampaign();

  const [dbRuleset, setDbRuleset] = useState<Ruleset | null>(null);
  const [campaignContent, setCampaignContent] = useState<Partial<CampaignCatalog>>({});

  useEffect(() => {
    if (!campaignId) {
      setDbRuleset(null);
      setCampaignContent({});
      return;
    }

    let cancelled = false;

    Promise.all([
      getResolvedCampaignRuleset(campaignId).catch(() => null),
      loadCampaignCatalogOverrides(campaignId).catch(() => ({} as Partial<CampaignCatalog>)),
    ])
      .then(([resolvedRuleset, overrides]) => {
        if (cancelled) return;
        setDbRuleset(resolvedRuleset);
        setCampaignContent(overrides);
      })
      .catch(() => {
        // swallow (or set an error state if you want)
      });

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const value = useMemo<CampaignRulesContext>(() => {
    const viewerCharacterIds = campaign?.members?.viewerCharacterIds ?? [];
    const ctx = toViewerContext(campaign?.viewer, viewerCharacterIds);
    const canManage = canManageContent(ctx);

    const { ruleset } = resolveCampaignRulesContext({
      ruleset: dbRuleset,
      fallbackSystemId: DEFAULT_SYSTEM_RULESET_ID,
      canManage,
    });

    return {
      ruleset,
      catalog: buildCampaignCatalog(systemCatalog, campaignContent, ruleset),
      canManage,
    };
  }, [campaign, dbRuleset, campaignContent]);

  return (
    <CampaignRulesCtx.Provider value={value}>
      {children}
    </CampaignRulesCtx.Provider>
  );
};

export const useCampaignRules = (): CampaignRulesContext => {
  const ctx = useContext(CampaignRulesCtx);
  if (!ctx) throw new Error('useCampaignRules must be used within CampaignRulesProvider');
  return ctx;
};

/** Safe catalog fields for PC-facing code. Excludes *AllById and *AllowedIds. */
const SAFE_CATALOG_KEYS = [
  'classesById',
  'classIds',
  'racesById',
  'raceIds',
  'weaponsById',
  'armorById',
  'gearById',
  'magicItemsById',
  'enhancementsById',
  'spellsById',
  'skillProficienciesById',
  'monstersById',
] as const;

/**
 * Returns only the filtered catalog view (no admin-only fields).
 * Use for PC-facing code; prevents accidental access to *AllById or *AllowedIds.
 */
export function useCampaignCatalog(): CampaignCatalog {
  const ctx = useContext(CampaignRulesCtx);
  if (!ctx) throw new Error('useCampaignCatalog must be used within CampaignRulesProvider');

  const safe = {} as CampaignCatalog;
  for (const key of SAFE_CATALOG_KEYS) {
    (safe as Record<string, unknown>)[key] = ctx.catalog[key];
  }
  return safe;
}

/**
 * Returns the full admin catalog (*AllById, *AllowedIds).
 * Throws if canManage is false.
 */
export function useCampaignCatalogAdmin(): CampaignCatalogAdmin {
  const ctx = useContext(CampaignRulesCtx);
  if (!ctx) throw new Error('useCampaignCatalogAdmin must be used within CampaignRulesProvider');
  if (!ctx.canManage) {
    throw new Error('useCampaignCatalogAdmin requires canManage (DM/owner). Use useCampaignCatalog for PC-facing code.');
  }
  return ctx.catalog;
}