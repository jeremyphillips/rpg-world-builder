import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ContentSummary } from '@/features/content/shared/domain/types';
import type { ContentListItem, ContentViewerContext } from '@/features/content/shared/components';
import type { ContentPolicy, ContentRule, RulesetContent } from '@/shared/types/ruleset';
import type { CampaignRulesetPatch } from '@/features/mechanics/domain/core/rules/ruleset.types';
import type { CampaignViewer } from '@/shared/types/campaign.types';
import {
  getCampaignRulesetPatch,
  saveCampaignRulesetPatch,
  createDefaultCampaignRulesetPatch,
} from '@/features/mechanics/domain/core/rules';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';
import { buildItemsWithAllowed, toggleAllowedIds } from '@/features/content/shared/domain/contentPolicy';
import { canViewContent, type ViewerContext } from '@/shared/domain/capabilities';
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

/**
 * Controller for campaign content list pages.
 *
 * TODO: Add unit test or in-file sanity checks:
 * - Given canManage=false, items with allowedInCampaign=false are removed.
 * - Given canManage=false, items with accessPolicy.scope='dm' are removed.
 * - Given canManage=true, nothing is removed.
 */
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
        if (loadedPatch) {
          setPatch(loadedPatch);
        } else if (canManage) {
          setPatch(createDefaultCampaignRulesetPatch(campaignId));
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

  const items: ContentListItem[] = useMemo(() => {
    // Prefer catalog's allowedInCampaign when contentRule is absent (patch not loaded or no content).
    // Use buildItemsWithAllowed when we have contentRule (patch is source of truth for optimistic updates).
    const withAllowed: ContentListItem[] =
      contentRule != null
        ? buildItemsWithAllowed(summaries, contentRule)
        : summaries.map((s) => {
            const item = s as ContentListItem;
            const allowed =
              item.allowedInCampaign ?? (item as { allowed?: boolean }).allowed ?? true;
            return { ...item, allowedInCampaign: allowed };
          });

    if (canManage) return withAllowed;

    // PC/non-manager: filter out disabled and non-visible content
    const ctx: ViewerContext = viewerContext ?? {
      campaignRole: null,
      isOwner: false,
      isPlatformAdmin: false,
      characterIds: [],
    };

    return withAllowed.filter((item) => {
      const allowed = item.allowedInCampaign !== false;
      const visible = canViewContent(ctx, item.accessPolicy);
      return allowed && visible;
    });
  }, [summaries, contentRule, canManage, viewerContext]);

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
