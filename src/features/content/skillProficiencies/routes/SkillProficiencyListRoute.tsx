import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { apiFetch } from '@/app/api';
import { useAuth } from '@/app/providers/AuthProvider';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
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
import { useViewerProficiencies } from '@/features/campaign/hooks';
import {
  skillProficiencyRepo,
  validateSkillProficiencyChange,
  buildSkillProficiencyCustomColumns,
  buildSkillProficiencyCustomFilters,
  SKILL_PROFICIENCY_LIST_TOOLBAR_LAYOUT,
  type SkillProficiencyListRow,
} from '@/features/content/skillProficiencies/domain';
import type { SkillProficiencySummary } from '@/features/content/skillProficiencies/domain/types';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { useBreadcrumbs } from '@/app/navigation';
import {
  APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID,
  filterAppDataGridFiltersForViewer,
} from '@/ui/patterns';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';

export default function SkillProficiencyListRoute() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { campaign, campaignId } = useActiveCampaign();
  const { catalog } = useCampaignRules();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/skill-proficiencies`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);
  const viewerCharacterIds = campaign?.members?.viewerCharacterIds ?? [];
  const viewerContext = useMemo(
    () => toViewerContext(campaign?.viewer, viewerCharacterIds),
    [campaign?.viewer, viewerCharacterIds],
  );

  const { skills: ownedIds } = useViewerProficiencies();
  const hasViewer = ownedIds.size > 0;

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

  const [validationBlocked, setValidationBlocked] = useState<ValidationBlockedState | null>(null);

  const handleToggleAllowed = useValidatedAllowedToggle({
    campaignId,
    onToggleAllowed: controller.onToggleAllowed,
    setValidationBlocked,
    validateDisallow: (id) =>
      validateSkillProficiencyChange({
        campaignId: campaignId!,
        skillProficiencyId: id,
        mode: 'disallow',
      }),
  });

  const items = controller.items as SkillProficiencyListRow[];
  const hasCampaignSources = items.some((r) => (r as { source?: string }).source === 'campaign');

  const customColumns = useMemo(
    () => buildSkillProficiencyCustomColumns(catalog.classesById),
    [catalog.classesById],
  );

  const customFilters = useMemo(
    () => buildSkillProficiencyCustomFilters(items, catalog.classesById),
    [items, catalog.classesById],
  );

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<SkillProficiencyListRow>({
        canManage,
        characterNameById: canManage ? characterNameById : undefined,
        onToggleAllowedInCampaign: handleToggleAllowed,
        customColumns,
        ownedIds: hasViewer ? ownedIds : undefined,
        hasCampaignSources,
      }),
    [canManage, characterNameById, handleToggleAllowed, customColumns, hasViewer, ownedIds, hasCampaignSources],
  );

  const filters = useMemo(
    () =>
      filterAppDataGridFiltersForViewer(
        buildCampaignContentFilters<SkillProficiencyListRow>({
          canManage,
          onToggleAllowedInCampaign: handleToggleAllowed,
          customFilters,
          ownedIds: hasViewer ? ownedIds : undefined,
          hasCampaignSources,
        }),
        viewerContext,
      ),
    [
      canManage,
      handleToggleAllowed,
      customFilters,
      hasViewer,
      ownedIds,
      hasCampaignSources,
      viewerContext,
    ],
  );

  const initialFilterValues = useMemo(() => {
    if (!canManage) return undefined;
    const hide = user?.preferences?.ui?.contentLists?.skillProficiencies?.hideDisallowed;
    return {
      allowedInCampaign: hide ? 'true' : 'all',
    };
  }, [canManage, user?.preferences?.ui?.contentLists?.skillProficiencies?.hideDisallowed]);

  const handleFilterValueChange = useCallback(
    async (filterId: string, value: unknown) => {
      if (filterId !== APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID) return;
      const allowed = String(value);
      const hideDisallowed = allowed === 'true';
      try {
        await apiFetch('/api/auth/me', {
          method: 'PATCH',
          body: {
            preferences: {
              ui: {
                contentLists: {
                  skillProficiencies: { hideDisallowed },
                },
              },
            },
          },
        });
        await refreshUser();
      } catch {
        // Runtime filter still applies; preference may not persist.
      }
    },
    [refreshUser],
  );

  if (controller.loading || authLoading) {
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
            contentType="skill proficiency"
            mode="disallow"
            blockingEntities={validationBlocked.blockingEntities}
            onClose={() => setValidationBlocked(null)}
          />
        ) : (
          <AppAlert
            tone="warning"
            onClose={() => setValidationBlocked(null)}
          >
            {validationBlocked.message ?? 'Cannot disable this skill proficiency.'}
          </AppAlert>
        )
      )}
      <ContentTypeListPage<SkillProficiencyListRow>
        typeLabel="Skill Proficiency"
        typeLabelPlural="Skill Proficiencies"
        headline="Skill Proficiencies"
        breadcrumbData={breadcrumbs}
        canManage={canManage}
        onAdd={controller.onAdd}
        addButtonLabel="Add Skill Proficiency"
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
        searchPlaceholder="Search skills…"
        emptyMessage="No skill proficiencies found."
        density="compact"
        height={560}
        toolbarLayout={SKILL_PROFICIENCY_LIST_TOOLBAR_LAYOUT}
        initialFilterValues={initialFilterValues}
        onFilterValueChange={handleFilterValueChange}
      />
    </Stack>
  );
}
