import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from '@/app/providers/AuthProvider';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignViewerCharacterIds } from '@/app/providers/useActiveCampaignViewerCharacterIds';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';
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
  raceRepo,
  validateRaceChange,
  buildRaceCustomColumns,
  buildRaceCustomFilters,
  RACE_LIST_TOOLBAR_LAYOUT,
  type RaceListRow,
} from '@/features/content/races/domain';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';

export default function RaceListRoute() {
  const { loading: authLoading } = useAuth();
  const { campaign, campaignId } = useActiveCampaign();
  const { catalog } = useCampaignRules();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/races`;

  const canManage = useActiveCampaignCanManageContent();
  const viewerCharacterIds = useActiveCampaignViewerCharacterIds();

  const listSummaries = useCallback(
    (cid: string, sid: string) =>
      raceRepo.listSummaries(cid, sid, { catalog }),
    [catalog],
  );

  const controller = useCampaignContentListController({
    campaignId,
    viewer: campaign?.viewer,
    viewerCharacterIds,
    canManage,
    listSummaries,
    contentKey: 'races',
    basePath,
  });

  const { characterNameById } = useCampaignPartyCharacterNameMap(
    campaignId,
    canManage,
  );

  const [validationBlocked, setValidationBlocked] = useState<ValidationBlockedState | null>(null);

  const items = controller.items as RaceListRow[];
  const hasCampaignSources = items.some((r) => (r as { source?: string }).source === 'campaign');

  const customColumns = useMemo(() => buildRaceCustomColumns(), []);
  const customFilters = useMemo(() => buildRaceCustomFilters(), []);

  const handleToggleAllowed = useValidatedAllowedToggle({
    campaignId,
    onToggleAllowed: controller.onToggleAllowed,
    setValidationBlocked,
    validateDisallow: (id) =>
      validateRaceChange({
        campaignId: campaignId!,
        raceId: id,
        mode: 'disallow',
      }),
  });

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<RaceListRow>({
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
      buildCampaignContentFilters<RaceListRow>({
        canManage,
        onToggleAllowedInCampaign: handleToggleAllowed,
        customFilters,
        hasCampaignSources,
      }),
    [canManage, handleToggleAllowed, customFilters, hasCampaignSources],
  );

  if (controller.loading || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ContentTypeListPage<RaceListRow>
      typeLabel="Race"
      typeLabelPlural="Races"
      headline="Races"
      breadcrumbData={breadcrumbs}
      canManage={canManage}
      onAdd={controller.onAdd}
      addButtonLabel="Add Race"
      rows={items}
      columns={columns}
      filters={filters}
      getRowId={(r) => r.id}
      getDetailLink={controller.getDetailLink}
      getRowClassName={getMutedRowClassNameForDisallowedCampaignContent<RaceListRow>(canManage)}
      loading={controller.loading}
      error={controller.error}
      searchPlaceholder="Search races…"
      emptyMessage="No races found."
      density="compact"
      height={560}
      viewerContext={controller.viewerContext}
      toolbarLayout={RACE_LIST_TOOLBAR_LAYOUT}
      contentListPreferencesKey="races"
      topBanner={
        validationBlocked ? (
          validationBlocked.blockingEntities.length > 0 ? (
            <ValidationBlockedAlert
              contentType="race"
              mode="disallow"
              blockingEntities={validationBlocked.blockingEntities}
              onClose={() => setValidationBlocked(null)}
            />
          ) : (
            <AppAlert tone="warning" onClose={() => setValidationBlocked(null)}>
              {validationBlocked.message ?? 'Cannot disable this race.'}
            </AppAlert>
          )
        ) : undefined
      }
    />
  );
}
