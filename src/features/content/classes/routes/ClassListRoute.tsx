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
import {
  classRepo,
  validateClassChange,
  buildClassCustomColumns,
  buildClassListFilters,
  type ClassListRow,
  type ClassSummary,
} from '@/features/content/classes/domain';
import type { ContentSummary } from '@/features/content/shared/domain/types';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';

export default function ClassListRoute() {
  const { loading: authLoading } = useAuth();
  const { campaign, campaignId } = useActiveCampaign();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/classes`;

  const canManage = useActiveCampaignCanManageContent();
  const viewerCharacterIds = useActiveCampaignViewerCharacterIds();

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

  const [validationBlocked, setValidationBlocked] = useState<ValidationBlockedState | null>(null);

  const handleToggleAllowed = useValidatedAllowedToggle({
    campaignId,
    onToggleAllowed: controller.onToggleAllowed,
    setValidationBlocked,
    validateDisallow: (id) =>
      validateClassChange({
        campaignId: campaignId!,
        classId: id,
        mode: 'disallow',
      }),
  });

  const items = controller.items as ClassSummary[];
  const hasCampaignSources = items.some((r) => (r as { source?: string }).source === 'campaign');

  const customColumns = useMemo(() => buildClassCustomColumns(), []);
  const customFilters = useMemo(
    () => buildClassListFilters(items),
    [items],
  );

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<ClassListRow>({
        imageContentType: 'class',
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
        viewerContext: controller.viewerContext,
      }),
    [canManage, handleToggleAllowed, customFilters, hasCampaignSources, controller.viewerContext],
  );

  if (controller.loading || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ContentTypeListPage<ClassSummary>
      page={{
        typeLabel: 'Class',
        typeLabelPlural: 'Classes',
        headline: 'Classes',
        breadcrumbData: breadcrumbs,
        canManage,
        onAdd: controller.onAdd,
        addButtonLabel: 'Add Class',
        topBanner:
          validationBlocked ? (
            validationBlocked.blockingEntities.length > 0 ? (
              <ValidationBlockedAlert
                contentType="class"
                mode="disallow"
                blockingEntities={validationBlocked.blockingEntities}
                onClose={() => setValidationBlocked(null)}
              />
            ) : (
              <AppAlert tone="warning" onClose={() => setValidationBlocked(null)}>
                {validationBlocked.message ?? 'Cannot disable this class.'}
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
        getRowClassName: getMutedRowClassNameForDisallowedCampaignContent<ClassListRow>(canManage),
        loading: controller.loading,
        error: controller.error,
        searchPlaceholder: 'Search classes…',
        emptyMessage: 'No classes found.',
        density: 'compact',
        height: 560,
      }}
      preferences={{ contentListPreferencesKey: 'classes' }}
      viewerContext={controller.viewerContext}
    />
  );
}
