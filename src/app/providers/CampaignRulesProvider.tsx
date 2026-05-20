/**
 * Provides the active campaign's resolved CampaignRulesContext (ruleset + catalog).
 *
 * Must be rendered inside ActiveCampaignProvider.
 *
 * Load order:
 *   1. Resolve ruleset from DB patch or system fallback (sync, no SRD catalog bytes).
 *   2. Dynamic-import `systemCatalog` (SRD spells/monsters/equipment data) in parallel.
 *   3. Fetch campaign ruleset patch + content overrides when `campaignId` is set.
 *   4. `buildCampaignCatalog(systemCatalog, overrides, ruleset)` when base catalog is ready.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useActiveCampaign } from './ActiveCampaignProvider';
import { useActiveCampaignCanManageContent } from './useActiveCampaignCanManageContent';
import type { CampaignRulesContext } from '@/features/mechanics/domain/rulesets/resolve/context';
import { getResolvedCampaignRuleset } from '@/features/mechanics/domain/rulesets/campaign/repo';
import type { CampaignCatalog } from '@/features/mechanics/domain/rulesets/system/catalog';
import {
  buildCampaignCatalog,
  type CampaignCatalogAdmin,
} from '@/features/mechanics/domain/rulesets/campaign/buildCatalog';
import { emptyCampaignCatalog } from '@/features/mechanics/domain/rulesets/system/emptyCampaignCatalog';
import { getSystemRuleset } from '@/features/mechanics/domain/rulesets/system/systemRulesets';
import { loadCampaignCatalogOverrides } from '@/features/mechanics/domain/rulesets/campaign/patch/loadOverrides';
import { loadSystemCatalog, prefetchSystemCatalog } from './loadSystemCatalog';
import { RouteContentSuspenseFallback } from '@/app/RouteContentSuspenseFallback';
import type { Ruleset } from '@/shared/types/ruleset';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CampaignRulesCtx = createContext<CampaignRulesContext | undefined>(undefined);

export const CampaignRulesProvider = ({ children }: { children: ReactNode }) => {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();

  const [baseCatalog, setBaseCatalog] = useState<CampaignCatalog | null>(null);
  const [catalogLoadError, setCatalogLoadError] = useState(false);
  const [dbRuleset, setDbRuleset] = useState<Ruleset | null>(null);
  const [campaignContent, setCampaignContent] = useState<Partial<CampaignCatalog>>({});

  useEffect(() => {
    prefetchSystemCatalog();
    let cancelled = false;

    loadSystemCatalog()
      .then((catalog) => {
        if (!cancelled) {
          setBaseCatalog(catalog);
          setCatalogLoadError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCatalogLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const catalogLoading = baseCatalog === null && !catalogLoadError;

  const value = useMemo<CampaignRulesContext>(() => {
    const ruleset = dbRuleset ?? getSystemRuleset(DEFAULT_SYSTEM_RULESET_ID);
    const system = baseCatalog ?? emptyCampaignCatalog;

    return {
      ruleset,
      catalog: buildCampaignCatalog(system, campaignContent, ruleset),
      canManage,
      catalogLoading,
    };
  }, [baseCatalog, dbRuleset, campaignContent, canManage, catalogLoading]);

  const stallForCatalog =
    Boolean(campaignId) && catalogLoading;

  if (stallForCatalog) {
    return (
      <CampaignRulesCtx.Provider value={value}>
        <RouteContentSuspenseFallback />
      </CampaignRulesCtx.Provider>
    );
  }

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

/** True while the SRD system catalog chunk is loading. */
export function useCampaignCatalogLoading(): boolean {
  return useCampaignRules().catalogLoading;
}

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
  'skillProficiencyIds',
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
