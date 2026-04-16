import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from '@/app/providers/AuthProvider';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignViewerCharacterIds } from '@/app/providers/useActiveCampaignViewerCharacterIds';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { useViewerEquipment } from '@/features/campaign/hooks';
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
import { armorRepo } from '../domain/repo/armorRepo';
import { validateArmorChange } from '../domain/validation/validateArmorChange';
import { buildArmorCustomColumns, buildArmorCustomFilters, type ArmorListRow } from '../domain/list';
import type { ContentSummary } from '@/features/content/shared/domain/types/content.types';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';

export default function ArmorListRoute() {
  const { loading: authLoading } = useAuth();
  const { campaign, campaignId } = useActiveCampaign();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/equipment/armor`;

  const canManage = useActiveCampaignCanManageContent();
  const viewerCharacterIds = useActiveCampaignViewerCharacterIds();

  const { armor: ownedIds } = useViewerEquipment();
  const hasViewer = ownedIds.size > 0;

  const listSummaries = useCallback(
    (cid: string, sid: string) =>
      armorRepo.listSummaries(cid, sid) as Promise<ContentSummary[]>,
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

  const items = controller.items as ArmorListRow[];
  const hasCampaignSources = items.some(
    (r) => (r as { source?: string }).source === 'campaign',
  );

  const handleToggleAllowed = useValidatedAllowedToggle({
    campaignId,
    onToggleAllowed: controller.onToggleAllowed,
    setValidationBlocked,
    validateDisallow: (id) =>
      validateArmorChange({
        campaignId: campaignId!,
        armorId: id,
        mode: 'disallow',
      }),
  });

  const customColumns = useMemo(() => buildArmorCustomColumns(), []);

  const customFilters = useMemo(
    () => buildArmorCustomFilters(items),
    [items],
  );

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<ArmorListRow>({
        canManage,
        characterNameById: canManage ? characterNameById : undefined,
        onToggleAllowedInCampaign: handleToggleAllowed,
        ownedIds: hasViewer ? ownedIds : undefined,
        customColumns,
        hasCampaignSources,
      }),
    [
      canManage,
      characterNameById,
      handleToggleAllowed,
      hasViewer,
      ownedIds,
      customColumns,
      hasCampaignSources,
    ],
  );

  const filters = useMemo(
    () =>
      buildCampaignContentFilters<ArmorListRow>({
        canManage,
        onToggleAllowedInCampaign: handleToggleAllowed,
        ownedIds: hasViewer ? ownedIds : undefined,
        customFilters,
        hasCampaignSources,
      }),
    [
      canManage,
      handleToggleAllowed,
      hasViewer,
      ownedIds,
      customFilters,
      hasCampaignSources,
    ],
  );

  if (controller.loading || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ContentTypeListPage<ArmorListRow>
      typeLabel="Armor"
      typeLabelPlural="Armor"
      headline="Armor"
      breadcrumbData={breadcrumbs}
      canManage={canManage}
      onAdd={controller.onAdd}
      addButtonLabel="Add Armor"
      rows={items}
      columns={columns}
      filters={filters}
      getRowId={(r) => r.id}
      getDetailLink={controller.getDetailLink}
      getRowClassName={getMutedRowClassNameForDisallowedCampaignContent<ArmorListRow>(canManage)}
      loading={controller.loading}
      error={controller.error}
      searchPlaceholder="Search armor…"
      emptyMessage="No armor found."
      density="compact"
      height={560}
      viewerContext={controller.viewerContext}
      contentListPreferencesKey="armor"
      topBanner={
        validationBlocked ? (
          validationBlocked.blockingEntities.length > 0 ? (
            <ValidationBlockedAlert
              contentType="armor"
              mode="disallow"
              blockingEntities={validationBlocked.blockingEntities}
              onClose={() => setValidationBlocked(null)}
            />
          ) : (
            <AppAlert tone="warning" onClose={() => setValidationBlocked(null)}>
              {validationBlocked.message ?? 'Cannot disable this armor.'}
            </AppAlert>
          )
        ) : undefined
      }
    />
  );
}
