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
import { weaponRepo } from '../domain/repo/weaponRepo';
import { validateWeaponChange } from '../domain/validation/validateWeaponChange';
import { buildWeaponCustomColumns, buildWeaponCustomFilters, type WeaponListRow } from '../domain/list';
import type { ContentSummary } from '@/features/content/shared/domain/types/content.types';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';

export default function WeaponsListRoute() {
  const { loading: authLoading } = useAuth();
  const { campaign, campaignId } = useActiveCampaign();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/equipment/weapons`;

  const canManage = useActiveCampaignCanManageContent();
  const viewerCharacterIds = useActiveCampaignViewerCharacterIds();

  const { context: viewerCtx, loading: viewerQueryLoading } = useViewerCharacterQuery();
  const ownedIds = viewerCtx.inventory.weaponIds;

  const listSummaries = useCallback(
    (cid: string, sid: string) =>
      weaponRepo.listSummaries(cid, sid) as Promise<ContentSummary[]>,
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

  const items = controller.items as WeaponListRow[];
  const hasCampaignSources = items.some(
    (r) => (r as { source?: string }).source === 'campaign',
  );

  const handleToggleAllowed = useValidatedAllowedToggle({
    campaignId,
    onToggleAllowed: controller.onToggleAllowed,
    setValidationBlocked,
    validateDisallow: (id) =>
      validateWeaponChange({
        campaignId: campaignId!,
        weaponId: id,
        mode: 'disallow',
      }),
  });

  const customColumns = useMemo(() => buildWeaponCustomColumns(), []);

  const customFilters = useMemo(
    () => buildWeaponCustomFilters(items),
    [items],
  );

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<WeaponListRow>({
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
      buildCampaignContentFilters<WeaponListRow>({
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
    <ContentTypeListPage<WeaponListRow>
      page={{
        typeLabel: 'Weapon',
        typeLabelPlural: 'Weapons',
        headline: 'Weapons',
        breadcrumbData: breadcrumbs,
        canManage,
        onAdd: controller.onAdd,
        addButtonLabel: 'Add Weapon',
        topBanner:
          validationBlocked ? (
            validationBlocked.blockingEntities.length > 0 ? (
              <ValidationBlockedAlert
                contentType="weapon"
                mode="disallow"
                blockingEntities={validationBlocked.blockingEntities}
                onClose={() => setValidationBlocked(null)}
              />
            ) : (
              <AppAlert tone="warning" onClose={() => setValidationBlocked(null)}>
                {validationBlocked.message ?? 'Cannot disable this weapon.'}
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
        getRowClassName: getMutedRowClassNameForDisallowedCampaignContent<WeaponListRow>(canManage),
        loading: controller.loading,
        error: controller.error,
        searchPlaceholder: 'Search weapons…',
        emptyMessage: 'No weapons found.',
        density: 'compact',
        height: 560,
      }}
      preferences={{ contentListPreferencesKey: 'weapons' }}
      viewerContext={controller.viewerContext}
    />
  );
}
