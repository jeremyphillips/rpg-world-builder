import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from '@/app/providers/AuthProvider';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignViewerCharacterIds } from '@/app/providers/useActiveCampaignViewerCharacterIds';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';
import { useViewerCharacterQuery } from '@/features/campaign/hooks';
import {
  ContentTypeListPage,
  buildCampaignContentColumns,
  buildCampaignContentFilters,
  getMutedRowClassNameForDisallowedCampaignContent,
  ValidationBlockedAlert,
} from '@/features/content/shared/components';
import { useCampaignContentListController } from '@/features/content/shared/hooks/useCampaignContentListController';
import {
  useValidatedAllowedToggle,
  type ValidationBlockedState,
} from '@/features/content/shared/hooks/useValidatedAllowedToggle';
import { useCampaignPartyCharacterNameMap } from '@/features/content/shared/hooks/useCampaignPartyCharacterNameMap';
import {
  spellRepo,
  validateSpellChange,
  buildSpellCustomColumns,
  buildSpellCustomFilters,
  type SpellListRow,
} from '@/features/content/spells/domain';
import type { ContentSummary } from '@/features/content/shared/domain/types';
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';

export default function SpellListRoute() {
  const { loading: authLoading } = useAuth();
  const { campaign, campaignId } = useActiveCampaign();
  const { catalog } = useCampaignRules();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/spells`;

  const canManage = useActiveCampaignCanManageContent();
  const viewerCharacterIds = useActiveCampaignViewerCharacterIds();

  const { context: viewerCtx, loading: viewerQueryLoading } = useViewerCharacterQuery();
  const ownedIds = viewerCtx.spells.knownSpellIds;

  const listSummaries = useCallback(
    (cid: string, sid: string) =>
      spellRepo.listSummaries(cid, sid as SystemRulesetId) as Promise<ContentSummary[]>,
    [],
  );

  const controller = useCampaignContentListController({
    campaignId,
    viewer: campaign?.viewer,
    viewerCharacterIds,
    canManage,
    listSummaries,
    contentKey: 'spells',
    basePath,
  });

  const { characterNameById } = useCampaignPartyCharacterNameMap(
    campaignId,
    canManage,
  );

  const [validationBlocked, setValidationBlocked] = useState<ValidationBlockedState | null>(null);

  const handleToggleAllowed = useValidatedAllowedToggle({
    campaignId,
    onToggleAllowed: controller.onToggleAllowed,
    setValidationBlocked,
    validateDisallow: (id) =>
      validateSpellChange({
        campaignId: campaignId!,
        spellId: id,
        mode: 'disallow',
      }),
  });

  const items = controller.items as SpellListRow[];
  const hasCampaignSources = items.some((r) => (r as { source?: string }).source === 'campaign');

  const customColumns = useMemo(
    () => buildSpellCustomColumns(catalog.classesById),
    [catalog.classesById],
  );

  const customFilters = useMemo(
    () => buildSpellCustomFilters(items, catalog.classesById),
    [items, catalog.classesById],
  );

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<SpellListRow>({
        canManage,
        characterNameById: canManage ? characterNameById : undefined,
        onToggleAllowedInCampaign: handleToggleAllowed,
        ownedIds,
        viewerContext: controller.viewerContext,
        customColumns,
        hasCampaignSources,
      }),
    [
      canManage,
      characterNameById,
      handleToggleAllowed,
      ownedIds,
      controller.viewerContext,
      customColumns,
      hasCampaignSources,
    ],
  );

  const filters = useMemo(
    () =>
      buildCampaignContentFilters<SpellListRow>({
        canManage,
        onToggleAllowedInCampaign: handleToggleAllowed,
        ownedIds,
        customFilters,
        hasCampaignSources,
      }),
    [
      canManage,
      handleToggleAllowed,
      ownedIds,
      customFilters,
      hasCampaignSources,
    ],
  );

  if (controller.loading || authLoading || viewerQueryLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ContentTypeListPage<SpellListRow>
      page={{
        typeLabel: 'Spell',
        typeLabelPlural: 'Spells',
        headline: 'Spells',
        breadcrumbData: breadcrumbs,
        canManage,
        onAdd: controller.onAdd,
        addButtonLabel: 'Add Spell',
        topBanner:
          validationBlocked ? (
            validationBlocked.blockingEntities.length > 0 ? (
              <ValidationBlockedAlert
                contentType="spell"
                mode="disallow"
                blockingEntities={validationBlocked.blockingEntities}
                onClose={() => setValidationBlocked(null)}
              />
            ) : (
              <AppAlert tone="warning" onClose={() => setValidationBlocked(null)}>
                {validationBlocked.message ?? 'Cannot disable this spell.'}
              </AppAlert>
            )
          ) : undefined,
      }}
      grid={{
        rows: items,
        columns,
        filters,
        getRowId: (r) => r.id,
        getDetailLink: controller.getDetailLink,
        getRowClassName: getMutedRowClassNameForDisallowedCampaignContent<SpellListRow>(canManage),
        loading: controller.loading,
        error: controller.error,
        searchPlaceholder: 'Search spells…',
        emptyMessage: 'No spells found.',
        density: 'compact',
        height: 560,
      }}
      preferences={{ contentListPreferencesKey: 'spells' }}
      viewerContext={controller.viewerContext}
    />
  );
}
