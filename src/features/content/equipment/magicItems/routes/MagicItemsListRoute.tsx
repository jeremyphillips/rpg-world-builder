import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
import { magicItemRepo } from '../domain/repo/magicItemRepo';
import { validateMagicItemChange } from '../domain/validation/validateMagicItemChange';
import {
  buildMagicItemCustomColumns,
  buildMagicItemCustomFilters,
  type MagicItemListRow,
} from '../domain/list';
import type { ContentSummary } from '@/features/content/shared/domain/types';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { useBreadcrumbs } from '@/app/navigation';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';

export default function MagicItemsListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/equipment/magic-items`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);
  const viewerCharacterIds = campaign?.members?.viewerCharacterIds ?? [];

  const { magicItems: ownedIds } = useViewerEquipment();
  const hasViewer = ownedIds.size > 0;

  const listSummaries = useCallback(
    (cid: string, sid: string) =>
      magicItemRepo.listSummaries(cid, sid) as Promise<ContentSummary[]>,
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

  const items = controller.items as MagicItemListRow[];
  const hasCampaignSources = items.some(
    (r) => (r as { source?: string }).source === 'campaign',
  );

  const handleToggleAllowed = useValidatedAllowedToggle({
    campaignId,
    onToggleAllowed: controller.onToggleAllowed,
    setValidationBlocked,
    validateDisallow: (id) =>
      validateMagicItemChange({
        campaignId: campaignId!,
        magicItemId: id,
        mode: 'disallow',
      }),
  });

  const customColumns = useMemo(() => buildMagicItemCustomColumns(), []);

  const customFilters = useMemo(
    () => buildMagicItemCustomFilters(items),
    [items],
  );

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<MagicItemListRow>({
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
      buildCampaignContentFilters<MagicItemListRow>({
        canManage,
        onToggleAllowedInCampaign: handleToggleAllowed,
        ownedIds: hasViewer ? ownedIds : undefined,
        customFilters,
        hasCampaignSources,
      }),
    [canManage, handleToggleAllowed, hasViewer, ownedIds, customFilters, hasCampaignSources],
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
            contentType="magic item"
            mode="disallow"
            blockingEntities={validationBlocked.blockingEntities}
            onClose={() => setValidationBlocked(null)}
          />
        ) : (
          <AppAlert
            tone="warning"
            onClose={() => setValidationBlocked(null)}
          >
            {validationBlocked.message ?? 'Cannot disable this magic item.'}
          </AppAlert>
        )
      )}
      <ContentTypeListPage<MagicItemListRow>
        typeLabel="Magic Item"
        typeLabelPlural="Magic Items"
        headline="Magic Items"
        breadcrumbData={breadcrumbs}
        actions={[
          <Button
            key="back"
            component={Link}
            to={`/campaigns/${campaignId}/world/equipment`}
            size="small"
            startIcon={<ArrowBackIcon />}
          >
            Equipment
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
                (params.row as MagicItemListRow).allowedInCampaign === false
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
              Add Magic Item
            </Button>
          ) : undefined
        }
        searchPlaceholder="Search magic items…"
        emptyMessage="No magic items found."
        density="compact"
        height={560}
      />
    </Stack>
  );
}
