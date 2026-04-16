import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from '@/app/providers/AuthProvider';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignViewerCharacterIds } from '@/app/providers/useActiveCampaignViewerCharacterIds';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import {
  ContentTypeListPage,
  buildCampaignContentColumns,
  buildCampaignContentFilters,
  getMutedRowClassNameForDisallowedCampaignContent,
  ValidationBlockedAlert,
} from '@/features/content/shared/components';
import { useCampaignContentListController } from '@/features/content/shared/hooks/useCampaignContentListController';
import {
  useValidatedAllowedToggle,
  type ValidationBlockedState,
} from '@/features/content/shared/hooks/useValidatedAllowedToggle';
import { useCampaignPartyCharacterNameMap } from '@/features/content/shared/hooks/useCampaignPartyCharacterNameMap';
import { useViewerCharacterQuery } from '@/features/campaign/hooks';
import {
  skillProficiencyRepo,
  validateSkillProficiencyChange,
  buildSkillProficiencyCustomColumns,
  buildSkillProficiencyCustomFilters,
  type SkillProficiencyListRow,
} from '@/features/content/skillProficiencies/domain';
import type { SkillProficiencySummary } from '@/features/content/skillProficiencies/domain/types';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';

export default function SkillProficiencyListRoute() {
  const { loading: authLoading } = useAuth();
  const { campaign, campaignId } = useActiveCampaign();
  const { catalog } = useCampaignRules();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/skill-proficiencies`;

  const canManage = useActiveCampaignCanManageContent();
  const viewerCharacterIds = useActiveCampaignViewerCharacterIds();

  const { mergedContext: viewerCtx, ready: viewerQueryReady } = useViewerCharacterQuery();
  const ownedIds = viewerCtx.proficiencies.skillIds;

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
        ownedIds,
        viewerContext: controller.viewerContext,
        hasCampaignSources,
      }),
    [
      canManage,
      characterNameById,
      handleToggleAllowed,
      customColumns,
      ownedIds,
      controller.viewerContext,
      hasCampaignSources,
    ],
  );

  const filters = useMemo(
    () =>
      buildCampaignContentFilters<SkillProficiencyListRow>({
        canManage,
        onToggleAllowedInCampaign: handleToggleAllowed,
        customFilters,
        ownedIds,
        hasCampaignSources,
      }),
    [
      canManage,
      handleToggleAllowed,
      customFilters,
      ownedIds,
      hasCampaignSources,
    ],
  );

  if (controller.loading || authLoading || !viewerQueryReady) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ContentTypeListPage<SkillProficiencyListRow>
      page={{
        typeLabel: 'Skill Proficiency',
        typeLabelPlural: 'Skill Proficiencies',
        headline: 'Skill Proficiencies',
        breadcrumbData: breadcrumbs,
        canManage,
        onAdd: controller.onAdd,
        addButtonLabel: 'Add Skill Proficiency',
        topBanner:
          validationBlocked ? (
            validationBlocked.blockingEntities.length > 0 ? (
              <ValidationBlockedAlert
                contentType="skill proficiency"
                mode="disallow"
                blockingEntities={validationBlocked.blockingEntities}
                onClose={() => setValidationBlocked(null)}
              />
            ) : (
              <AppAlert tone="warning" onClose={() => setValidationBlocked(null)}>
                {validationBlocked.message ?? 'Cannot disable this skill proficiency.'}
              </AppAlert>
            )
          ) : undefined,
      }}
      grid={{
        rows: items,
        columns,
        filters,
        getRowId: (r) => r.id,
        getDetailLink: controller.getDetailLink,
        getRowClassName: getMutedRowClassNameForDisallowedCampaignContent<SkillProficiencyListRow>(
          canManage,
        ),
        loading: controller.loading,
        error: controller.error,
        searchPlaceholder: 'Search skills…',
        emptyMessage: 'No skill proficiencies found.',
        density: 'compact',
        height: 560,
      }}
      preferences={{ contentListPreferencesKey: 'skillProficiencies' }}
      viewerContext={controller.viewerContext}
    />
  );
}
