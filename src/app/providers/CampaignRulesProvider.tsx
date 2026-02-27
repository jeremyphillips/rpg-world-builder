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
import type { Ruleset } from '@/data/ruleSets/ruleSets.types';

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

  const staticCtx = useMemo(
    () => resolveCampaignRulesContext(campaign),
    [campaign],
  );

  const [liveRuleset, setLiveRuleset] = useState<Ruleset | null>(null);
  const [campaignContent, setCampaignContent] = useState<Partial<CampaignCatalog>>({});

  useEffect(() => {
    if (!campaignId) {
      setLiveRuleset(null);
      setCampaignContent({});
      return;
    }

    let cancelled = false;

    Promise.all([
      getResolvedCampaignRuleset(campaignId),
      listCampaignRaces(campaignId).catch(() => [] as Race[]),
    ]).then(([resolved, races]) => {
      if (cancelled) return;
      if (resolved) setLiveRuleset(resolved);
      setCampaignContent(buildCampaignContent(races));
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [campaignId]);

  const value = useMemo<CampaignRulesContext>(() => {
    if (liveRuleset) {
      return {
        ruleset: liveRuleset,
        catalog: buildCampaignCatalog(systemCatalog, campaignContent, liveRuleset),
      };
    }
    return staticCtx;
  }, [liveRuleset, campaignContent, staticCtx]);

  return (
    <CampaignRulesCtx.Provider value={value}>
      {children}
    </CampaignRulesCtx.Provider>
  );
};

export const useCampaignRules = (): CampaignRulesContext => {
  const ctx = useContext(CampaignRulesCtx);
  if (!ctx) {
    throw new Error('useCampaignRules must be used within CampaignRulesProvider');
  }
  return ctx;
};
