import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from '@/app/providers/AuthProvider';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignViewerCharacterIds } from '@/app/providers/useActiveCampaignViewerCharacterIds';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';
import { useCampaignMembers } from '@/features/campaign/hooks/useCampaignMembers';
import { getOwnedIdsForCampaignContentListKey } from '@/features/character/domain/query';
import {
  ContentTypeListPage,
  buildCampaignContentColumns,
  buildCampaignContentFilters,
  getMutedRowClassNameForDisallowedCampaignContent,
  ValidationBlockedAlert,
} from '@/features/content/shared/components';
import ViewerOwnedCharacterScopeSelect from '@/features/content/shared/components/ViewerOwnedCharacterScopeSelect';
import { useCampaignContentListController } from '@/features/content/shared/hooks/useCampaignContentListController';
import { useDmPartyCharacterOwnedQuery } from '@/features/content/shared/hooks/useDmPartyCharacterOwnedQuery';
import { useCampaignViewerOwnedCharacterQuery } from '@/features/content/shared/hooks/useCampaignViewerOwnedCharacterQuery';
import {
  useValidatedAllowedToggle,
  type ValidationBlockedState,
} from '@/features/content/shared/hooks/useValidatedAllowedToggle';
import { useCampaignPartyCharacterNameMap } from '@/features/content/shared/hooks/useCampaignPartyCharacterNameMap';
import { campaignContentToolbarLayoutForRole } from '@/features/content/shared/toolbar/campaignContentListToolbarLayoutForRole';
import { getCampaignContentListToolbarLayout } from '@/features/content/shared/toolbar/campaignContentListToolbarLayouts';
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
  const { approvedCharacters } = useCampaignMembers();

  const {
    mergedContext: viewerCtx,
    ready: viewerQueryReady,
    showOwnershipScopePicker,
    ownershipScope,
    setOwnershipScope,
    ownershipScopeOptions,
  } = useCampaignViewerOwnedCharacterQuery(campaignId, viewerCharacterIds);
  const ownedIds = getOwnedIdsForCampaignContentListKey(viewerCtx, 'spells');

  const { dmOwnedByCharacterFilterConfig, onDmOwnedByCharacterFilterChange } =
    useDmPartyCharacterOwnedQuery(canManage, approvedCharacters, 'spells');

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
        imageContentType: 'spell',
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
        dmOwnedByCharacter: dmOwnedByCharacterFilterConfig,
        viewerContext: controller.viewerContext,
      }),
    [
      canManage,
      handleToggleAllowed,
      ownedIds,
      customFilters,
      hasCampaignSources,
      dmOwnedByCharacterFilterConfig,
      controller.viewerContext,
    ],
  );

  const toolbarLayout = useMemo(
    () => campaignContentToolbarLayoutForRole(getCampaignContentListToolbarLayout('spells'), canManage),
    [canManage],
  );

  if (controller.loading || authLoading || !viewerQueryReady) {
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
        actions: showOwnershipScopePicker
          ? [
              <ViewerOwnedCharacterScopeSelect
                key="viewer-owned-scope"
                value={ownershipScope}
                onChange={setOwnershipScope}
                characterOptions={ownershipScopeOptions}
              />,
            ]
          : undefined,
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
        toolbarLayout,
      }}
      preferences={{
        contentListPreferencesKey: 'spells',
        onFilterValueChange: onDmOwnedByCharacterFilterChange,
      }}
      viewerContext={controller.viewerContext}
    />
  );
}
