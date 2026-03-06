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
} from '@/features/content/components';
import { useCampaignContentListController } from '@/features/content/hooks/useCampaignContentListController';
import { useCampaignPartyCharacterNameMap } from '@/features/content/hooks/useCampaignPartyCharacterNameMap';
import { raceRepo } from '@/features/content/domain/repo';
import { validateRaceChange } from '@/features/content/domain/validateRaceChange';
import type { RaceSummary } from '@/features/content/domain/types';
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

  const [validationError, setValidationError] = useState<string | null>(null);

  const items = controller.items as RaceSummary[];
  const hasCampaignSources = items.some((r) => (r as { source?: string }).source === 'campaign');

  const handleToggleAllowed = useCallback(
    async (id: string, allowed: boolean) => {
      setValidationError(null);
      if (allowed) {
        controller.onToggleAllowed(id, true);
        return;
      }
      if (!campaignId) return;
      const result = await validateRaceChange({ campaignId, raceId: id, mode: 'disallow' });
      if (!result.allowed) {
        setValidationError(result.message ?? 'Cannot disable this race.');
        return;
      }
      controller.onToggleAllowed(id, false);
    },
    [campaignId, controller.onToggleAllowed],
  );

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<RaceSummary>({
        canManage,
        characterNameById: canManage ? characterNameById : undefined,
        onToggleAllowedInCampaign: handleToggleAllowed,
        hasCampaignSources,
      }),
    [canManage, characterNameById, handleToggleAllowed, hasCampaignSources],
  );

  const filters = useMemo(
    () =>
      buildCampaignContentFilters<RaceSummary>({
        canManage,
        onToggleAllowedInCampaign: handleToggleAllowed,
        hasCampaignSources,
      }),
    [canManage, handleToggleAllowed, hasCampaignSources],
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
      {validationError && (
        <AppAlert tone="warning" onClose={() => setValidationError(null)}>
          {validationError}
        </AppAlert>
      )}
      <ContentTypeListPage<RaceSummary>
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
      rows={controller.items as RaceSummary[]}
      columns={columns}
      filters={filters}
      getRowId={(r) => r.id}
      getDetailLink={controller.getDetailLink}
      getRowClassName={
        canManage
          ? (params: GridRowClassNameParams) =>
              (params.row as RaceSummary).allowedInCampaign === false
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
