import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import {
  ContentTypeListPage,
  buildCampaignContentColumns,
  buildCampaignContentFilters,
} from '@/features/content/components';
import { useCampaignContentListController } from '@/features/content/hooks/useCampaignContentListController';
import { useCampaignPartyCharacterNameMap } from '@/features/content/hooks/useCampaignPartyCharacterNameMap';
import { classRepo } from '@/features/content/domain/repo';
import { validateClassChange } from '@/features/content/domain/validateClassChange';
import type { ContentSummary } from '@/features/content/domain/types';
import type { ClassSummary } from '@/features/content/domain/repo';

/** Class list row includes allowedInCampaign from controller. */
type ClassListRow = ClassSummary & { allowedInCampaign?: boolean };
import { ABILITIES } from '@/features/mechanics/domain/core/character/abilities';
import type { AppDataGridColumn, AppDataGridFilter } from '@/ui/patterns';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert, AppTooltip } from '@/ui/primitives';

export default function ClassListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/classes`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);
  const viewerCharacterIds = campaign?.members?.viewerCharacterIds ?? [];

  const listSummaries = useCallback(
    (cid: string, sid: string) =>
      classRepo.listSummaries(cid, sid) as Promise<ContentSummary[]>,
    [],
  );

  const controller = useCampaignContentListController({
    campaignId,
    viewer: campaign?.viewer,
    viewerCharacterIds,
    canManage,
    listSummaries,
    contentKey: 'classes',
    basePath,
  });

  const { characterNameById } = useCampaignPartyCharacterNameMap(
    campaignId,
    canManage,
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleToggleAllowed = useCallback(
    async (id: string, allowed: boolean) => {
      setValidationError(null);
      if (allowed) {
        controller.onToggleAllowed(id, true);
        return;
      }
      if (!campaignId) return;
      const result = await validateClassChange({
        campaignId,
        classId: id,
        mode: 'disallow',
      });
      if (!result.allowed) {
        setValidationError(result.message ?? 'Cannot disable this class.');
        return;
      }
      controller.onToggleAllowed(id, false);
    },
    [campaignId, controller.onToggleAllowed],
  );

  const items = controller.items as ClassSummary[];
  const hasCampaignSources = items.some((r) => (r as { source?: string }).source === 'campaign');

  const hitDieOptions = useMemo(() => {
    const dice = [...new Set(items.map((i) => i.progression?.hitDie).filter(Boolean))].sort(
      (a, b) => (a ?? 0) - (b ?? 0),
    );
    return [
      { label: 'All', value: '' },
      ...dice.map((d) => ({ label: `d${d}`, value: String(d) })),
    ];
  }, [items]);

  const customColumns: AppDataGridColumn<ClassSummary>[] = useMemo(
    () => [
      {
        field: 'subclasses',
        headerName: 'Subclasses',
        width: 80,
        accessor: (row) => row.definitions?.options ?? [],
        renderCell: (params) => {
          const options = (params.row as ClassSummary).definitions?.options ?? [];
          const count = options.length;
          const names = options.map((o) => o.name);
          const first3 = names.slice(0, 3);
          const remaining = names.length - 3;
          const tooltipText =
            count > 0
              ? `Subclasses: ${first3.join(', ')}${remaining > 0 ? ' +' + remaining : ''}`
              : '';
          const cellContent = count === 0 ? '—' : String(count);
          if (count > 0) {
            return (
              <AppTooltip title={tooltipText}>
                <Box component="span">{cellContent}</Box>
              </AppTooltip>
            );
          }
          return cellContent;
        },
      },
      {
        field: 'hitDie',
        headerName: 'Hit Die',
        width: 90,
        accessor: (row) => row.progression?.hitDie,
        valueFormatter: (v) => (v != null ? `d${v}` : '—'),
      },
      {
        field: 'spellcasting',
        headerName: 'Spellcasting',
        width: 120,
        accessor: (row) => row.progression?.spellcasting ?? 'none',
        valueFormatter: (v) => (v === 'none' || !v ? '—' : String(v)),
      },
      {
        field: 'primaryAbilities',
        headerName: 'Primary Abilities',
        width: 140,
        accessor: (row) => row.generation?.primaryAbilities ?? [],
        valueFormatter: (v) => {
          const ids = (v as string[]) ?? [];
          if (ids.length === 0) return '—';
          return ids.map((id) => id.toUpperCase()).join(', ');
        },
      },
    ],
    [],
  );

  const customFilters: AppDataGridFilter<ClassSummary>[] = useMemo(
    () => [
      {
        id: 'hitDie',
        label: 'Hit Die',
        type: 'select' as const,
        options: hitDieOptions,
        accessor: (r) =>
          r.progression?.hitDie != null ? String(r.progression.hitDie) : '',
      },
      {
        id: 'spellcasting',
        label: 'Spellcasting',
        type: 'select' as const,
        options: [
          { label: 'All', value: '' },
          { label: 'Full', value: 'full' },
          { label: 'Half', value: 'half' },
          { label: 'Pact', value: 'pact' },
          { label: 'None', value: 'none' },
        ],
        accessor: (r) => r.progression?.spellcasting ?? 'none',
      },
      {
        id: 'primaryAbilities',
        label: 'Primary Abilities',
        type: 'multiSelect' as const,
        options: ABILITIES.map((a) => ({
          value: a.id,
          label: a.id.toUpperCase(),
        })),
        accessor: (r) => r.generation?.primaryAbilities ?? [],
      },
    ],
    [hitDieOptions],
  );

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<ClassListRow>({
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
      buildCampaignContentFilters<ClassListRow>({
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
      {validationError && (
        <AppAlert tone="warning" onClose={() => setValidationError(null)}>
          {validationError}
        </AppAlert>
      )}
      <ContentTypeListPage<ClassSummary>
        typeLabel="Class"
        typeLabelPlural="Classes"
        headline="Classes"
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
                (params.row as ClassListRow).allowedInCampaign === false
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
              Add Class
            </Button>
          ) : undefined
        }
        searchPlaceholder="Search classes…"
        emptyMessage="No classes found."
        density="compact"
        height={560}
      />
    </Stack>
  );
}
