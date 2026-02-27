import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { ContentTypeListPage, type ContentListItem, type ContentViewerContext } from '@/features/content/components';
import { useCampaignMembers } from '@/features/campaign/hooks/useCampaignMembers';
import { raceRepo } from '@/features/content/domain/repo';
import type { RaceSummary } from '@/features/content/domain/types';
import type { ContentPolicy, ContentRule } from '@/data/ruleSets/ruleSets.types';
import {
  getCampaignRulesetPatch,
  saveCampaignRulesetPatch,
  createDefaultCampaignRulesetPatch,
  DEFAULT_SYSTEM_ID,
} from '@/features/mechanics/domain/core/rules/campaignRulesetRepo';
import type { CampaignRulesetPatch } from '@/features/mechanics/domain/core/rules/ruleset.types';
import { toViewerContext, canManageCampaignContent } from '@/shared/domain/capabilities';

function getAllowedSet(rule: ContentRule | undefined, allIds: string[]): Set<string> {
  if (!rule) return new Set(allIds);
  if (rule.policy === 'all_except') {
    const denied = new Set(rule.ids);
    return new Set(allIds.filter(id => !denied.has(id)));
  }
  return new Set(rule.ids);
}

export default function RaceListRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const navigate = useNavigate();
  const { viewerCharacterIds } = useCampaignMembers();

  const viewer = campaign?.viewer;
  const ctx = toViewerContext(viewer);
  const canManage = canManageCampaignContent(ctx);

  const viewerContext = useMemo<ContentViewerContext | undefined>(() => {
    if (!viewer) return undefined;
    return {
      campaignRole: viewer.campaignRole,
      isOwner: viewer.isOwner,
      isPlatformAdmin: viewer.isOwner,
      characterIds: viewerCharacterIds,
    };
  }, [viewer, viewerCharacterIds]);

  const [summaries, setSummaries] = useState<RaceSummary[]>([]);
  const [patch, setPatch] = useState<CampaignRulesetPatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    setLoading(true);

    const summariesPromise = raceRepo.listSummaries(campaignId, DEFAULT_SYSTEM_ID);
    const patchPromise = canManage
      ? getCampaignRulesetPatch(campaignId)
      : Promise.resolve(null);

    Promise.all([summariesPromise, patchPromise])
      .then(([races, loadedPatch]) => {
        if (cancelled) return;
        setSummaries(races);
        if (canManage) {
          setPatch(loadedPatch ?? createDefaultCampaignRulesetPatch(campaignId));
        }
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [campaignId, canManage]);

  const racesRule = patch?.content?.races as ContentRule | undefined;
  const policy: ContentPolicy = racesRule?.policy ?? 'all_except';

  const items: ContentListItem[] = useMemo(() => {
    const allIds = summaries.map(s => s.id);
    const allowed = getAllowedSet(racesRule, allIds);
    return summaries.map(s => ({
      ...s,
      allowed: allowed.has(s.id),
    }));
  }, [summaries, racesRule]);

  const savePolicy = useCallback(async (
    nextPolicy: ContentPolicy,
    nextIds: string[],
  ) => {
    if (!patch) return;

    const nextPatch = {
      ...patch,
      content: {
        ...patch.content,
        races: { policy: nextPolicy, ids: nextIds },
      },
    } as CampaignRulesetPatch;

    const result = await saveCampaignRulesetPatch(nextPatch);
    if (result.validation.ok) {
      setPatch(result.patch);
    }
  }, [patch]);

  const handleToggleAllowed = useCallback((id: string, allowed: boolean) => {
    const currentIds = racesRule?.ids ?? [];
    let nextIds: string[];

    if (policy === 'all_except') {
      nextIds = allowed
        ? currentIds.filter(i => i !== id)
        : [...currentIds, id];
    } else {
      nextIds = allowed
        ? [...currentIds, id]
        : currentIds.filter(i => i !== id);
    }

    savePolicy(policy, nextIds);
  }, [policy, racesRule, savePolicy]);

  const getDetailLink = useCallback((item: ContentListItem) => {
    return `/campaigns/${campaignId}/world/races/${item.id}`;
  }, [campaignId]);

  const handleAdd = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/races/new`);
  }, [navigate, campaignId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <ContentTypeListPage
      typeLabel="Race"
      typeLabelPlural="Races"
      items={items}
      getDetailLink={getDetailLink}
      onToggleAllowed={handleToggleAllowed}
      onAdd={handleAdd}
      canManage={canManage}
      viewerContext={viewerContext}
    />
  );
}
