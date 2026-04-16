import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from '@/app/providers/AuthProvider';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignViewerCharacterIds } from '@/app/providers/useActiveCampaignViewerCharacterIds';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
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
import { gearRepo } from '../domain/repo/gearRepo';
import { validateGearChange } from '../domain/validation/validateGearChange';
import { buildGearCustomColumns, buildGearCustomFilters, type GearListRow } from '../domain/list';
import type { ContentSummary } from '@/features/content/shared/domain/types/content.types';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';

export default function GearListRoute() {
  const { loading: authLoading } = useAuth();
  const { campaign, campaignId } = useActiveCampaign();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/equipment/gear`;

  const canManage = useActiveCampaignCanManageContent();
  const viewerCharacterIds = useActiveCampaignViewerCharacterIds();

  const { mergedContext: viewerCtx, ready: viewerQueryReady } = useViewerCharacterQuery();
  const ownedIds = viewerCtx.inventory.gearIds;

  const listSummaries = useCallback(
    (cid: string, sid: string) =>
      gearRepo.listSummaries(cid, sid) as Promise<ContentSummary[]>,
    [],
  );

  const controller = useCampaignContentListController({
    campaignId,
    viewer: campaign?.viewer,
    viewerCharacterIds,
    canManage,
    listSummaries,
    contentKey: 'equipment',
    basePath,
  });

  const { characterNameById } = useCampaignPartyCharacterNameMap(
    campaignId,
    canManage,
  );

  const [validationBlocked, setValidationBlocked] = useState<ValidationBlockedState | null>(null);

  const items = controller.items as GearListRow[];
  const hasCampaignSources = items.some(
    (r) => (r as { source?: string }).source === 'campaign',
  );

  const handleToggleAllowed = useValidatedAllowedToggle({
    campaignId,
    onToggleAllowed: controller.onToggleAllowed,
    setValidationBlocked,
    validateDisallow: (id) =>
      validateGearChange({
        campaignId: campaignId!,
        gearId: id,
        mode: 'disallow',
      }),
  });

  const customColumns = useMemo(() => buildGearCustomColumns(), []);

  const customFilters = useMemo(
    () => buildGearCustomFilters(items),
    [items],
  );

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<GearListRow>({
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
      buildCampaignContentFilters<GearListRow>({
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

  if (controller.loading || authLoading || !viewerQueryReady) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ContentTypeListPage<GearListRow>
      page={{
        typeLabel: 'Gear',
        typeLabelPlural: 'Gear',
        headline: 'Gear',
        breadcrumbData: breadcrumbs,
        canManage,
        onAdd: controller.onAdd,
        addButtonLabel: 'Add Gear',
        topBanner:
          validationBlocked ? (
            validationBlocked.blockingEntities.length > 0 ? (
              <ValidationBlockedAlert
                contentType="gear"
                mode="disallow"
                blockingEntities={validationBlocked.blockingEntities}
                onClose={() => setValidationBlocked(null)}
              />
            ) : (
              <AppAlert tone="warning" onClose={() => setValidationBlocked(null)}>
                {validationBlocked.message ?? 'Cannot disable this gear.'}
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
        getRowClassName: getMutedRowClassNameForDisallowedCampaignContent<GearListRow>(canManage),
        loading: controller.loading,
        error: controller.error,
        searchPlaceholder: 'Search gear…',
        emptyMessage: 'No gear found.',
        density: 'compact',
        height: 560,
      }}
      preferences={{ contentListPreferencesKey: 'gear' }}
      viewerContext={controller.viewerContext}
    />
  );
}
