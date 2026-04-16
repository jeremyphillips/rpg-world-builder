import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { useAuth } from '@/app/providers/AuthProvider';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
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
import { useContentListPreferences } from '@/features/content/shared/hooks/useContentListPreferences';
import {
  locationRepo,
  validateLocationChange,
  buildLocationCustomColumns,
  buildLocationListFilters,
  LOCATION_LIST_TOOLBAR_LAYOUT,
  type LocationListRow,
  type LocationSummary,
} from '@/features/content/locations/domain';
import type { ContentSummary } from '@/features/content/shared/domain/types';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { useBreadcrumbs } from '@/app/navigation';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';

export default function LocationListRoute() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { campaign, campaignId } = useActiveCampaign();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/locations`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);
  const viewerCharacterIds = campaign?.members?.viewerCharacterIds ?? [];

  const listSummaries = useCallback(
    (cid: string, sid: string) =>
      locationRepo.listSummaries(cid, sid) as Promise<ContentSummary[]>,
    [],
  );

  const controller = useCampaignContentListController({
    campaignId,
    viewer: campaign?.viewer,
    viewerCharacterIds,
    canManage,
    listSummaries,
    contentKey: 'locations',
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
      validateLocationChange({
        campaignId: campaignId!,
        locationId: id,
        mode: 'disallow',
      }),
  });

  const items = controller.items as LocationSummary[];
  const hasCampaignSources = items.some((r) => (r as { source?: string }).source === 'campaign');

  const idToName = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of items) m.set(it.id, it.name);
    return m;
  }, [items]);

  const customColumns = useMemo(() => buildLocationCustomColumns(idToName), [idToName]);
  const customFilters = useMemo(() => buildLocationListFilters(items), [items]);

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<LocationListRow>({
        canManage,
        characterNameById: canManage ? characterNameById : undefined,
        onToggleAllowedInCampaign: handleToggleAllowed,
        customColumns,
        hasCampaignSources,
      }),
    [canManage, characterNameById, handleToggleAllowed, customColumns, hasCampaignSources],
  );

  const filters = useMemo(
    () =>
      buildCampaignContentFilters<LocationListRow>({
        canManage,
        onToggleAllowedInCampaign: handleToggleAllowed,
        customFilters,
        hasCampaignSources,
      }),
    [canManage, handleToggleAllowed, customFilters, hasCampaignSources],
  );

  const { initialFilterValues, onFilterValueChange } = useContentListPreferences({
    canManage,
    user,
    refreshUser,
    contentListKey: 'locations',
  });

  if (controller.loading || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {validationBlocked &&
        (validationBlocked.blockingEntities.length > 0 ? (
          <ValidationBlockedAlert
            contentType="location"
            mode="disallow"
            blockingEntities={validationBlocked.blockingEntities}
            onClose={() => setValidationBlocked(null)}
          />
        ) : (
          <AppAlert tone="warning" onClose={() => setValidationBlocked(null)}>
            {validationBlocked.message ?? 'Cannot disable this location.'}
          </AppAlert>
        ))}
      <ContentTypeListPage<LocationSummary>
        typeLabel="Location"
        typeLabelPlural="Locations"
        headline="Locations"
        breadcrumbData={breadcrumbs}
        canManage={canManage}
        onAdd={controller.onAdd}
        addButtonLabel="Add Location"
        rows={items}
        columns={columns}
        filters={filters}
        getRowId={(r) => r.id}
        getDetailLink={controller.getDetailLink}
        getRowClassName={
          canManage
            ? (params: GridRowClassNameParams) =>
                (params.row as LocationListRow).allowedInCampaign === false
                  ? 'AppDataGrid-row--disabled'
                  : ''
            : undefined
        }
        loading={controller.loading}
        error={controller.error}
        searchPlaceholder="Search locations…"
        emptyMessage="No locations found."
        density="compact"
        height={560}
        viewerContext={controller.viewerContext}
        toolbarLayout={LOCATION_LIST_TOOLBAR_LAYOUT}
        initialFilterValues={initialFilterValues}
        onFilterValueChange={onFilterValueChange}
      />
    </Stack>
  );
}
