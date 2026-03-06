import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';
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
import {
  raceRepo,
  validateRaceChange,
  buildRaceCustomColumns,
  buildRaceCustomFilters,
  type RaceListRow,
} from '@/features/content/races/domain';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';

export default function RaceListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const { catalog } = useCampaignRules();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/races`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);
  const viewerCharacterIds = campaign?.members?.viewerCharacterIds ?? [];

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

  if (controller.loading) {
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
            contentType="race"
            mode="disallow"
            blockingEntities={validationBlocked.blockingEntities}
            onClose={() => setValidationBlocked(null)}
          />
        ) : (
          <AppAlert
            tone="warning"
            onClose={() => setValidationBlocked(null)}
          >
            {validationBlocked.message ?? 'Cannot disable this race.'}
          </AppAlert>
        )
      )}
      <ContentTypeListPage<RaceListRow>
      typeLabel="Race"
      typeLabelPlural="Races"
      headline="Races"
      breadcrumbData={breadcrumbs}
      actions={[
        <Button
          key="back"
          component={Link}
          to={`/campaigns/${campaignId}/world`}
          size="small"
          startIcon={<ArrowBackIcon />}
        >
          World
        </Button>,
      ]}
      rows={items}
      columns={columns}
      filters={filters}
      getRowId={(r) => r.id}
      getDetailLink={controller.getDetailLink}
      getRowClassName={
        canManage
          ? (params: GridRowClassNameParams) =>
              (params.row as RaceListRow).allowedInCampaign === false
                ? 'AppDataGrid-row--disabled'
                : ''
          : undefined
      }
      loading={controller.loading}
      error={controller.error}
      toolbar={
        canManage ? (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={controller.onAdd}
          >
            Add Race
          </Button>
        ) : undefined
      }
      searchPlaceholder="Search races…"
      emptyMessage="No races found."
      density="compact"
      height={560}
    />
    </Stack>
  );
}
