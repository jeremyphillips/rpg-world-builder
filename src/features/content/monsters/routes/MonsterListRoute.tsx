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
  monsterRepo,
  validateMonsterChange,
  buildMonsterCustomColumns,
  buildMonsterCustomFilters,
  type MonsterListRow,
} from '@/features/content/monsters/domain';
import type { CreatureArmorCatalogEntry } from '@/features/mechanics/domain/equipment/armorClass';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { useBreadcrumbs } from '@/app/navigation';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';

export default function MonsterListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const { catalog } = useCampaignRules();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/monsters`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);
  const viewerCharacterIds = campaign?.members?.viewerCharacterIds ?? [];

  const listSummaries = useCallback(
    (cid: string, sid: string) =>
      monsterRepo.listSummaries(cid, sid, { catalog }),
    [catalog],
  );

  const controller = useCampaignContentListController({
    campaignId,
    viewer: campaign?.viewer,
    viewerCharacterIds,
    canManage,
    listSummaries,
    contentKey: 'monsters',
    basePath,
  });

  const { characterNameById } = useCampaignPartyCharacterNameMap(
    campaignId,
    canManage,
  );

  const [validationBlocked, setValidationBlocked] = useState<ValidationBlockedState | null>(null);

  const items = controller.items as MonsterListRow[];
  const hasCampaignSources = items.some((r) => (r as { source?: string }).source === 'campaign');

  const customColumns = useMemo(
    () => buildMonsterCustomColumns(catalog.armorById as Record<string, CreatureArmorCatalogEntry>),
    [catalog.armorById],
  );
  const customFilters = useMemo(() => buildMonsterCustomFilters(), []);

  const handleToggleAllowed = useValidatedAllowedToggle({
    campaignId,
    onToggleAllowed: controller.onToggleAllowed,
    setValidationBlocked,
    validateDisallow: (id) =>
      validateMonsterChange({
        campaignId: campaignId!,
        monsterId: id,
        mode: 'disallow',
      }),
  });

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<MonsterListRow>({
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
      buildCampaignContentFilters<MonsterListRow>({
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
      {validationBlocked &&
        (validationBlocked.blockingEntities.length > 0 ? (
          <ValidationBlockedAlert
            contentType="monster"
            mode="disallow"
            blockingEntities={validationBlocked.blockingEntities}
            onClose={() => setValidationBlocked(null)}
          />
        ) : (
          <AppAlert
            tone="warning"
            onClose={() => setValidationBlocked(null)}
          >
            {validationBlocked.message ?? 'Cannot disable this monster.'}
          </AppAlert>
        ))}
      <ContentTypeListPage<MonsterListRow>
        typeLabel="Monster"
        typeLabelPlural="Monsters"
        headline="Monsters"
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
                (params.row as MonsterListRow).allowedInCampaign === false
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
              Add Monster
            </Button>
          ) : undefined
        }
        searchPlaceholder="Search monsters…"
        searchColumns={['name', 'monsterType']}
        emptyMessage="No monsters found."
        density="compact"
        height={560}
      />
    </Stack>
  );
}
