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
  makeBooleanGlyphColumn,
} from '@/features/content/components';
import { useCampaignContentListController } from '@/features/content/hooks/useCampaignContentListController';
import { useCampaignPartyCharacterNameMap } from '@/features/content/hooks/useCampaignPartyCharacterNameMap';
import { magicItemRepo } from '@/features/content/domain/repo';
import { validateMagicItemChange } from '@/features/content/domain/validateMagicItemChange';
import type { MagicItemSummary } from '@/features/content/domain/types';
import type { ContentSummary } from '@/features/content/domain/types';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { useBreadcrumbs } from '@/hooks';
import { formatCp } from '@/shared/money';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';

type MagicItemListRow = MagicItemSummary & { allowedInCampaign?: boolean };

const EMPTY_PLACEHOLDER = '—';

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

  const [validationError, setValidationError] = useState<string | null>(null);

  const items = controller.items as MagicItemListRow[];
  const hasCampaignSources = items.some(
    (r) => (r as { source?: string }).source === 'campaign',
  );

  const handleToggleAllowed = useCallback(
    async (id: string, allowed: boolean) => {
      setValidationError(null);
      if (allowed) {
        controller.onToggleAllowed(id, true);
        return;
      }
      if (!campaignId) return;
      const result = await validateMagicItemChange({
        campaignId,
        magicItemId: id,
        mode: 'disallow',
      });
      if (!result.allowed) {
        setValidationError(result.message ?? 'Cannot disable this magic item.');
        return;
      }
      controller.onToggleAllowed(id, false);
    },
    [campaignId, controller.onToggleAllowed],
  );

  const slotOptions = useMemo(() => {
    const slots = [...new Set(items.map((i) => i.slot))].sort();
    return [{ label: 'All', value: '' }, ...slots.map((s) => ({ label: s, value: s }))];
  }, [items]);

  const rarityOptions = useMemo(() => {
    const rarities = [...new Set(items.map((i) => i.rarity).filter(Boolean) as string[])].sort();
    return [{ label: 'All', value: '' }, ...rarities.map((r) => ({ label: r, value: r }))];
  }, [items]);

  const customColumns = useMemo(
    () => [
      {
        field: 'slot',
        headerName: 'Slot',
        width: 110,
      },
      {
        field: 'rarity',
        headerName: 'Rarity',
        width: 120,
        valueFormatter: (v: unknown) =>
          v != null ? String(v) : EMPTY_PLACEHOLDER,
      },
      makeBooleanGlyphColumn<MagicItemListRow>(
        'requiresAttunement',
        'Attunement',
        (row) => Boolean(row.requiresAttunement),
        { tone: 'default' },
      ),
      {
        field: 'costCp',
        headerName: 'Cost',
        width: 110,
        type: 'number' as const,
        valueFormatter: (v: unknown) => formatCp(v as number),
      },
    ],
    [],
  );

  const customFilters = useMemo(
    () => [
      {
        id: 'slot',
        label: 'Slot',
        type: 'select' as const,
        options: slotOptions,
        accessor: (r: MagicItemListRow) => r.slot,
      },
      {
        id: 'rarity',
        label: 'Rarity',
        type: 'select' as const,
        options: rarityOptions,
        accessor: (r: MagicItemListRow) => r.rarity ?? '',
      },
      {
        id: 'attunement',
        label: 'Attunement',
        type: 'boolean' as const,
        accessor: (r: MagicItemListRow) => r.requiresAttunement,
      },
    ],
    [slotOptions, rarityOptions],
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
      {validationError && (
        <AppAlert tone="warning" onClose={() => setValidationError(null)}>
          {validationError}
        </AppAlert>
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
