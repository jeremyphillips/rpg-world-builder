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
} from '@/features/content/components';
import { useCampaignContentListController } from '@/features/content/hooks/useCampaignContentListController';
import { useCampaignPartyCharacterNameMap } from '@/features/content/hooks/useCampaignPartyCharacterNameMap';
import { weaponRepo } from '@/features/content/domain/repo';
import { validateWeaponChange } from '@/features/content/domain/validateWeaponChange';
import type { WeaponSummary } from '@/features/content/domain/types';
import type { ContentSummary } from '@/features/content/domain/types';
import type { AppDataGridFilter } from '@/ui/patterns';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { useBreadcrumbs } from '@/hooks';
import { formatCp } from '@/shared/money';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';

type WeaponListRow = WeaponSummary & { allowedInCampaign?: boolean };

const EMPTY_PLACEHOLDER = '—';

export default function WeaponsListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/equipment/weapons`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);
  const viewerCharacterIds = campaign?.members?.viewerCharacterIds ?? [];

  const { weapons: ownedIds } = useViewerEquipment();
  const hasViewer = ownedIds.size > 0;

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

  const [validationError, setValidationError] = useState<string | null>(null);

  const items = controller.items as WeaponListRow[];
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
      const result = await validateWeaponChange({
        campaignId,
        weaponId: id,
        mode: 'disallow',
      });
      if (!result.allowed) {
        setValidationError(result.message ?? 'Cannot disable this weapon.');
        return;
      }
      controller.onToggleAllowed(id, false);
    },
    [campaignId, controller.onToggleAllowed],
  );

  const categoryOptions = useMemo(() => {
    const cats = [...new Set(items.map((i) => i.category))].sort();
    return [{ label: 'All', value: '' }, ...cats.map((c) => ({ label: c, value: c }))];
  }, [items]);

  const propertyOptions = useMemo(() => {
    const props = [...new Set(items.flatMap((i) => i.properties ?? []))].sort();
    return props.map((p) => ({ label: p, value: p }));
  }, [items]);

  const customColumns = useMemo(
    () => [
      {
        field: 'category',
        headerName: 'Category',
        width: 110,
      },
      {
        field: 'damage',
        headerName: 'Damage',
        width: 80,
        valueFormatter: (v: unknown) =>
          v != null ? String(v) : EMPTY_PLACEHOLDER,
      },
      {
        field: 'damageType',
        headerName: 'Damage Type',
        width: 120,
        valueFormatter: (v: unknown) =>
          v != null ? String(v) : EMPTY_PLACEHOLDER,
      },
      {
        field: 'properties',
        headerName: 'Properties',
        width: 180,
        valueFormatter: (v: unknown) =>
          Array.isArray(v) ? (v as string[]).join(', ') : EMPTY_PLACEHOLDER,
      },
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

  const customFilters: AppDataGridFilter<WeaponListRow>[] = useMemo(
    () => [
      {
        id: 'category',
        label: 'Category',
        type: 'select' as const,
        options: categoryOptions,
        accessor: (r: WeaponListRow) => r.category,
      },
      {
        id: 'property',
        label: 'Property',
        type: 'multiSelect' as const,
        options: propertyOptions,
        accessor: (r: WeaponListRow) => r.properties ?? [],
      },
    ],
    [categoryOptions, propertyOptions],
  );

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<WeaponListRow>({
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
      buildCampaignContentFilters<WeaponListRow>({
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
      <ContentTypeListPage<WeaponListRow>
        typeLabel="Weapon"
        typeLabelPlural="Weapons"
        headline="Weapons"
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
                (params.row as WeaponListRow).allowedInCampaign === false
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
              Add Weapon
            </Button>
          ) : undefined
        }
        searchPlaceholder="Search weapons…"
        emptyMessage="No weapons found."
        density="compact"
        height={560}
      />
    </Stack>
  );
}
