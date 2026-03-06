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
import { useViewerSpells } from '@/features/campaign/hooks';
import {
  ContentTypeListPage,
  buildCampaignContentColumns,
  buildCampaignContentFilters,
  makeBooleanGlyphColumn,
} from '@/features/content/components';
import { useCampaignContentListController } from '@/features/content/hooks/useCampaignContentListController';
import { useCampaignPartyCharacterNameMap } from '@/features/content/hooks/useCampaignPartyCharacterNameMap';
import { spellRepo } from '@/features/content/domain/repo';
import { validateSpellChange } from '@/features/content/domain/validateSpellChange';
import type { ContentSummary } from '@/features/content/domain/types';
import { filterAllowedIds } from '@/features/content/domain/utils';
import { MAGIC_SCHOOL_OPTIONS } from '@/features/content/domain/vocab/magicSchools.vocab';
import type { SystemRulesetId } from '@/features/mechanics/domain/core/rules';
import type { SpellSummary } from '@/features/content/domain/repo';
import type { AppDataGridColumn, AppDataGridFilter } from '@/ui/patterns';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';

const schoolLabel = (value: string) =>
  MAGIC_SCHOOL_OPTIONS.find((o) => o.value === value)?.label ?? value;

/** Spell list row includes allowedInCampaign from controller. */
type SpellListRow = SpellSummary & { allowedInCampaign?: boolean };

const EMPTY_PLACEHOLDER = '—';

export default function SpellListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const { catalog } = useCampaignRules();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/spells`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);
  const viewerCharacterIds = campaign?.members?.viewerCharacterIds ?? [];

  const ownedIds = useViewerSpells();
  const hasViewer = ownedIds.size > 0;

  const listSummaries = useCallback(
    (cid: string, sid: string) =>
      spellRepo.listSummaries(cid, sid as SystemRulesetId) as Promise<ContentSummary[]>,
    [],
  );

  const controller = useCampaignContentListController({
    campaignId,
    viewer: campaign?.viewer,
    viewerCharacterIds,
    canManage,
    listSummaries,
    contentKey: 'spells',
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
      const result = await validateSpellChange({
        campaignId,
        spellId: id,
        mode: 'disallow',
      });
      if (!result.allowed) {
        setValidationError(result.message ?? 'Cannot disable this spell.');
        return;
      }
      controller.onToggleAllowed(id, false);
    },
    [campaignId, controller.onToggleAllowed],
  );

  const items = controller.items as SpellListRow[];
  const hasCampaignSources = items.some((r) => (r as { source?: string }).source === 'campaign');

  const schoolOptions = useMemo(() => {
    const schools = [...new Set(items.map((i) => i.school))].sort();
    return [
      { label: 'All', value: '' },
      ...schools.map((s) => ({ label: schoolLabel(s), value: s })),
    ];
  }, [items]);

  const levelOptions = useMemo(() => {
    const levels = [...new Set(items.map((i) => i.level))].sort((a, b) => a - b);
    return [
      { label: 'All', value: '' },
      ...levels.map((l) => ({
        label: l === 0 ? 'Cantrip' : String(l),
        value: String(l),
      })),
    ];
  }, [items]);

  const classOptions = useMemo(() => {
    const classIds = [...new Set(items.flatMap((i) => i.classes ?? []))].sort();
    const classesById = catalog.classesById ?? {};
    const allowedClassIds = filterAllowedIds(classIds, classesById) ?? classIds;
    return allowedClassIds.map((id) => ({
      label: classesById[id]?.name ?? id,
      value: id,
    }));
  }, [items, catalog.classesById]);

  const customColumns: AppDataGridColumn<SpellListRow>[] = useMemo(
    () => [
      {
        field: 'school',
        headerName: 'School',
        width: 120,
        valueFormatter: (v) => (v ? schoolLabel(v as string) : '—'),
      },
      {
        field: 'level',
        headerName: 'Level',
        width: 90,
        type: 'number',
        valueFormatter: (v) =>
          v === 0 ? 'Cantrip' : v != null ? String(v) : '—',
      },
      {
        field: 'classes',
        headerName: 'Classes',
        flex: 1,
        minWidth: 180,
        accessor: (row) => {
          const classesById = catalog.classesById ?? {};
          const allowed = filterAllowedIds(row.classes, classesById);
          if (!allowed?.length) return EMPTY_PLACEHOLDER;
          return allowed
            .map((id) => classesById[id]?.name ?? id)
            .join(', ');
        },
        valueFormatter: (v) => (v != null && v !== '' ? String(v) : EMPTY_PLACEHOLDER),
      },
      makeBooleanGlyphColumn<SpellListRow>(
        'ritual',
        'Ritual',
        (row) => Boolean(row.ritual),
      ),
      makeBooleanGlyphColumn<SpellListRow>(
        'concentration',
        'Concentration',
        (row) => Boolean(row.concentration),
      ),
    ],
    [catalog.classesById],
  );

  const customFilters: AppDataGridFilter<SpellListRow>[] = useMemo(
    () => [
      {
        id: 'school',
        label: 'School',
        type: 'select' as const,
        options: schoolOptions,
        accessor: (r) => r.school,
      },
      {
        id: 'level',
        label: 'Level',
        type: 'select' as const,
        options: levelOptions,
        accessor: (r) => String(r.level),
      },
      {
        id: 'classes',
        label: 'Class',
        type: 'multiSelect' as const,
        options: classOptions,
        accessor: (r) => r.classes ?? [],
      },
    ],
    [schoolOptions, levelOptions, classOptions],
  );

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<SpellListRow>({
        canManage,
        characterNameById: canManage ? characterNameById : undefined,
        onToggleAllowedInCampaign: handleToggleAllowed,
        ownedIds: hasViewer ? ownedIds : undefined,
        customColumns,
        hasCampaignSources,
      }),
    [canManage, characterNameById, handleToggleAllowed, hasViewer, ownedIds, customColumns, hasCampaignSources],
  );

  const filters = useMemo(
    () =>
      buildCampaignContentFilters<SpellListRow>({
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
      <ContentTypeListPage<SpellListRow>
        typeLabel="Spell"
        typeLabelPlural="Spells"
        headline="Spells"
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
                (params.row as SpellListRow).allowedInCampaign === false
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
              Add Spell
            </Button>
          ) : undefined
        }
        searchPlaceholder="Search spells…"
        emptyMessage="No spells found."
        density="compact"
        height={560}
      />
    </Stack>
  );
}
