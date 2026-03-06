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
import { useViewerProficiencies } from '@/features/campaign/hooks';
import { skillProficiencyRepo } from '@/features/content/domain/repo';
import type { SkillProficiencySummary } from '@/features/content/domain/types';
import { ABILITIES } from '@/features/mechanics/domain/core/character/abilities';
import type { AppDataGridColumn, AppDataGridFilter } from '@/ui/patterns';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { validateSkillProficiencyChange } from '@/features/content/domain/validateSkillProficiencyChange';
import { AppAlert } from '@/ui/primitives';
import { filterAllowedIds } from '@/features/content/domain/utils';

const ABILITY_ID_TO_ABBREV = Object.fromEntries(
  ABILITIES.map((a) => [a.id, a.id.toUpperCase()]),
) as Record<string, string>;

function abilityToAbbrev(abilityId: string | undefined): string {
  if (!abilityId) return '—';
  return ABILITY_ID_TO_ABBREV[abilityId] ?? '—';
}

type SkillProficiencyListRow = SkillProficiencySummary & { allowedInCampaign?: boolean };

export default function SkillProficiencyListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const { catalog } = useCampaignRules();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/skill-proficiencies`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);
  const viewerCharacterIds = campaign?.members?.viewerCharacterIds ?? [];

  const { skills: ownedIds } = useViewerProficiencies();

  const listSummaries = useCallback(
    (cid: string, sid: string) =>
      skillProficiencyRepo.listSummaries(cid, sid) as Promise<SkillProficiencySummary[]>,
    [],
  );

  const controller = useCampaignContentListController({
    campaignId,
    viewer: campaign?.viewer,
    viewerCharacterIds,
    canManage,
    listSummaries,
    contentKey: 'skillProficiencies',
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
      const result = await validateSkillProficiencyChange({
        campaignId,
        skillProficiencyId: id,
        mode: 'disallow',
      });
      if (!result.allowed) {
        setValidationError(result.message ?? 'Cannot disable this skill proficiency.');
        return;
      }
      controller.onToggleAllowed(id, false);
    },
    [campaignId, controller.onToggleAllowed],
  );

  const items = controller.items as SkillProficiencyListRow[];

  const abilityOptions = useMemo(() => {
    const abilities = [...new Set(items.map((i) => i.ability).filter(Boolean))].sort();
    return [
      { label: 'All', value: '' },
      ...abilities.map((a) => ({
        label: ABILITY_ID_TO_ABBREV[a] ?? a,
        value: a,
      })),
    ];
  }, [items]);

  const suggestedClassOptions = useMemo(() => {
    const classIds = [...new Set(items.flatMap((i) => i.suggestedClasses ?? []))].sort();
    const allowedClassIds = filterAllowedIds(classIds, catalog.classesById) ?? classIds;

    return allowedClassIds.map((id) => ({
      label: catalog.classesById[id]?.name ?? id,
      value: id,
    }));
  }, [items, catalog.classesById]);

  const tagOptions = useMemo(() => {
    const tags = [...new Set(items.flatMap((i) => i.tags ?? []))].sort();
    return tags.map((tag) => ({ label: tag, value: tag }));
  }, [items]);

  const customColumns: AppDataGridColumn<SkillProficiencyListRow>[] = useMemo(
    () => [
      {
        field: 'ability',
        headerName: 'Ability',
        width: 100,
        valueFormatter: (v) => abilityToAbbrev(v as string | undefined),
      },
      // {
      //   field: 'tags',
      //   headerName: 'Tags',
      //   width: 180,
      //   valueFormatter: (v) => {
      //     const arr = (v as string[] | undefined) ?? [];
      //     return arr.length > 0 ? arr.join(', ') : '—';
      //   },
      // },
      {
        field: 'suggestedClasses',
        headerName: 'Suggested for Class',
        flex: 1,
        minWidth: 200,
        valueFormatter: (v) => {
          const arr = (v as string[] | undefined) ?? [];
          const allowedIds = filterAllowedIds(arr, catalog.classesById ?? {});
          if (!allowedIds?.length) return '—';
          const byId = catalog.classesById ?? {};
          return allowedIds.map((id) => byId[id]?.name ?? id).join(', ');
        },
      },
    ],
    [catalog],
  );

  const customFilters: AppDataGridFilter<SkillProficiencyListRow>[] = useMemo(
    () => [
      {
        id: 'ability',
        label: 'Ability',
        type: 'select' as const,
        options: abilityOptions,
        accessor: (r) => r.ability ?? '',
      },
      {
        id: 'suggestedClasses',
        label: 'Suggested for Class',
        type: 'multiSelect' as const,
        options: suggestedClassOptions,
        accessor: (r) => r.suggestedClasses ?? [],
      },
      {
        id: 'tags',
        label: 'Tag',
        type: 'multiSelect' as const,
        options: tagOptions,
        accessor: (r) => r.tags ?? [],
      },
    ],
    [abilityOptions, suggestedClassOptions, tagOptions],
  );

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<SkillProficiencyListRow>({
        canManage,
        characterNameById: canManage ? characterNameById : undefined,
        onToggleAllowedInCampaign: handleToggleAllowed,
        customColumns,
        ownedIds,
      }),
    [canManage, characterNameById, handleToggleAllowed, customColumns, ownedIds],
  );

  const filters = useMemo(
    () =>
      buildCampaignContentFilters<SkillProficiencyListRow>({
        canManage,
        onToggleAllowedInCampaign: handleToggleAllowed,
        customFilters,
        ownedIds,
      }),
    [canManage, handleToggleAllowed, customFilters, ownedIds],
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
      <ContentTypeListPage<SkillProficiencyListRow>
        typeLabel="Skill Proficiency"
        typeLabelPlural="Skill Proficiencies"
        headline="Skill Proficiencies"
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
                (params.row as SkillProficiencyListRow).allowedInCampaign === false
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
              Add New
            </Button>
          ) : undefined
        }
        searchPlaceholder="Search skills…"
        emptyMessage="No skill proficiencies found."
        density="compact"
        height={560}
      />
    </Stack>
  );
}
