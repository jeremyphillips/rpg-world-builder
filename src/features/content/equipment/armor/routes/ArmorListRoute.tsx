import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { apiFetch } from '@/app/api';
import { useAuth } from '@/app/providers/AuthProvider';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useViewerEquipment } from '@/features/campaign/hooks';
import {
  ContentTypeListPage,
  buildCampaignContentColumns,
  buildCampaignContentFilters,
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
import {
  ARMOR_LIST_TOOLBAR_LAYOUT,
  buildArmorCustomColumns,
  buildArmorCustomFilters,
  type ArmorListRow,
} from '../domain/list';
import type { ContentSummary } from '@/features/content/shared/domain/types/content.types';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { useBreadcrumbs } from '@/app/navigation';
import {
  APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID,
  filterAppDataGridFiltersForViewer,
} from '@/ui/patterns';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';

export default function ArmorListRoute() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { campaign, campaignId } = useActiveCampaign();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/equipment/armor`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);
  const viewerCharacterIds = campaign?.members?.viewerCharacterIds ?? [];
  const viewerContext = useMemo(
    () => toViewerContext(campaign?.viewer, viewerCharacterIds),
    [campaign?.viewer, viewerCharacterIds],
  );

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
      filterAppDataGridFiltersForViewer(
        buildCampaignContentFilters<ArmorListRow>({
          canManage,
          onToggleAllowedInCampaign: handleToggleAllowed,
          ownedIds: hasViewer ? ownedIds : undefined,
          customFilters,
          hasCampaignSources,
        }),
        viewerContext,
      ),
    [
      canManage,
      handleToggleAllowed,
      hasViewer,
      ownedIds,
      customFilters,
      hasCampaignSources,
      viewerContext,
    ],
  );

  const initialFilterValues = useMemo(() => {
    if (!canManage) return undefined;
    const hide = user?.preferences?.ui?.contentLists?.armor?.hideDisallowed;
    return {
      allowedInCampaign: hide ? 'true' : 'all',
    };
  }, [canManage, user?.preferences?.ui?.contentLists?.armor?.hideDisallowed]);

  const handleFilterValueChange = useCallback(
    async (filterId: string, value: unknown) => {
      if (filterId !== APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID) return;
      const allowed = String(value);
      const hideDisallowed = allowed === 'true';
      try {
        await apiFetch('/api/auth/me', {
          method: 'PATCH',
          body: {
            preferences: {
              ui: {
                contentLists: {
                  armor: { hideDisallowed },
                },
              },
            },
          },
        });
        await refreshUser();
      } catch {
        // Runtime filter still applies; preference may not persist.
      }
    },
    [refreshUser],
  );

  if (controller.loading || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {validationBlocked && (
        validationBlocked.blockingEntities.length > 0 ? (
          <ValidationBlockedAlert
            contentType="armor"
            mode="disallow"
            blockingEntities={validationBlocked.blockingEntities}
            onClose={() => setValidationBlocked(null)}
          />
        ) : (
          <AppAlert
            tone="warning"
            onClose={() => setValidationBlocked(null)}
          >
            {validationBlocked.message ?? 'Cannot disable this armor.'}
          </AppAlert>
        )
      )}
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
        getRowClassName={
          canManage
            ? (params: GridRowClassNameParams) =>
                (params.row as ArmorListRow).allowedInCampaign === false
                  ? 'AppDataGrid-row--disabled'
                  : ''
            : undefined
        }
        loading={controller.loading}
        error={controller.error}
        searchPlaceholder="Search armor…"
        emptyMessage="No armor found."
        density="compact"
        height={560}
        toolbarLayout={ARMOR_LIST_TOOLBAR_LAYOUT}
        initialFilterValues={initialFilterValues}
        onFilterValueChange={handleFilterValueChange}
      />
    </Stack>
  );
}
