import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ContentSummary } from '@/features/content/domain/types';
import type { ContentListItem, ContentViewerContext } from '@/features/content/components';
import type { ContentPolicy, ContentRule, RulesetContent } from '@/shared/types/ruleset';
import type { CampaignRulesetPatch } from '@/features/mechanics/domain/core/rules/ruleset.types';
import type { CampaignViewer } from '@/shared/types/campaign.types';
import {
  getCampaignRulesetPatch,
  saveCampaignRulesetPatch,
  createDefaultCampaignRulesetPatch,
} from '@/features/mechanics/domain/core/rules';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';
import { buildItemsWithAllowed, toggleAllowedIds } from '@/features/content/domain/contentPolicy';
import { toContentViewerContext } from '../domain/viewerContext';

export interface UseCampaignContentListControllerOptions {
  campaignId: string | null;
  viewer: CampaignViewer | undefined;
  viewerCharacterIds: string[];
  canManage: boolean;
  listSummaries: (campaignId: string, systemId: string) => Promise<ContentSummary[]>;
  contentKey: keyof RulesetContent;
  basePath: string;
}

export interface UseCampaignContentListControllerResult {
  items: ContentListItem[];
  loading: boolean;
  error: string | null;
  canManage: boolean;
  viewerContext: ContentViewerContext | undefined;
  onToggleAllowed: (id: string, allowed: boolean) => void;
  getDetailLink: (item: ContentListItem) => string;
  addLink: string;
  onAdd: () => void;
}

export function useCampaignContentListController(
  options: UseCampaignContentListControllerOptions,
): UseCampaignContentListControllerResult {
  const {
    campaignId,
    viewer,
    viewerCharacterIds,
    canManage,
    listSummaries,
    contentKey,
    basePath,
  } = options;

  const navigate = useNavigate();

  const viewerContext = useMemo(
    () => toContentViewerContext(viewer, viewerCharacterIds),
    [viewer, viewerCharacterIds],
  );

  const [summaries, setSummaries] = useState<ContentSummary[]>([]);
  const [patch, setPatch] = useState<CampaignRulesetPatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    setLoading(true);

    const summariesPromise = listSummaries(campaignId, DEFAULT_SYSTEM_RULESET_ID);
    const patchPromise = getCampaignRulesetPatch(campaignId)

    Promise.all([summariesPromise, patchPromise])
      .then(([loadedSummaries, loadedPatch]) => {
        if (cancelled) return;
        setSummaries(loadedSummaries);
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
  }, [campaignId, canManage, listSummaries]);

  const contentRule = patch?.content?.[contentKey as keyof RulesetContent] as ContentRule | undefined;
  const policy: ContentPolicy = contentRule?.policy ?? 'all_except';

  const items: ContentListItem[] = useMemo(
    () => buildItemsWithAllowed(summaries, contentRule),
    [summaries, contentRule],
  );

  const savePolicy = useCallback(async (
    nextPolicy: ContentPolicy,
    nextIds: string[],
  ) => {
    if (!patch) return;

    const nextPatch = {
      ...patch,
      content: {
        ...patch.content,
        [contentKey]: { policy: nextPolicy, ids: nextIds },
      },
    } as CampaignRulesetPatch;

    const result = await saveCampaignRulesetPatch(nextPatch);
    if (result.validation.ok) {
      setPatch(result.patch);
    }
  }, [patch, contentKey]);

  const onToggleAllowed = useCallback((id: string, allowed: boolean) => {
    const nextIds = toggleAllowedIds({
      policy,
      currentIds: contentRule?.ids ?? [],
      id,
      allowed,
    });
    savePolicy(policy, nextIds);
  }, [policy, contentRule, savePolicy]);

  const getDetailLink = useCallback(
    (item: ContentListItem) => `${basePath}/${item.id}`,
    [basePath],
  );

  const addLink = `${basePath}/new`;

  const onAdd = useCallback(() => {
    navigate(addLink);
  }, [navigate, addLink]);

  return {
    items,
    loading,
    error,
    canManage,
    viewerContext,
    onToggleAllowed,
    getDetailLink,
    addLink,
    onAdd,
  };
}
