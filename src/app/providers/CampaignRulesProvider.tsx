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
import { systemCatalog, type CampaignCatalog } from '@/features/mechanics/domain/core/rules/systemCatalog';
import { buildCampaignCatalog } from '@/features/mechanics/domain/core/rules/buildCampaignCatalog';
import { listCampaignRaces } from '@/features/content/domain/campaignRaceRepo';
import type { Race } from '@/features/content/domain/types';
import type { Ruleset } from '@/shared/types/ruleset';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function keyById<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  const map: Record<string, T> = {};
  for (const item of items) map[item.id] = item;
  return map;
}

function buildCampaignContent(races: Race[]): Partial<CampaignCatalog> {
  if (races.length === 0) return {};
  return { racesById: keyById(races) };
}

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
      listCampaignRaces(campaignId).catch(() => [] as Race[]),
    ])
      .then(([resolvedRuleset, races]) => {
        if (cancelled) return;
        setDbRuleset(resolvedRuleset);
        setCampaignContent(buildCampaignContent(races));
      })
      .catch(() => {
        // swallow (or set an error state if you want)
      });

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const value = useMemo<CampaignRulesContext>(() => {
    const { ruleset } = resolveCampaignRulesContext({
      campaign,
      ruleset: dbRuleset,
      fallbackSystemId: DEFAULT_SYSTEM_RULESET_ID,
    });

    return {
      ruleset,
      catalog: buildCampaignCatalog(systemCatalog, campaignContent, ruleset),
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