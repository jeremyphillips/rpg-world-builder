import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from '@/app/providers/AuthProvider';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignViewerCharacterIds } from '@/app/providers/useActiveCampaignViewerCharacterIds';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';
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
  monsterRepo,
  validateMonsterChange,
  buildMonsterCustomColumns,
  buildMonsterCustomFilters,
  deriveSortedChallengeRatingSteps,
  MONSTER_LIST_TOOLBAR_LAYOUT,
  type MonsterListRow,
} from '@/features/content/monsters/domain';
import type { CreatureArmorCatalogEntry } from '@/features/mechanics/domain/equipment/armorClass';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';

export default function MonsterListRoute() {
  const { loading: authLoading } = useAuth();
  const { campaign, campaignId } = useActiveCampaign();
  const { catalog } = useCampaignRules();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/monsters`;

  const canManage = useActiveCampaignCanManageContent();
  const viewerCharacterIds = useActiveCampaignViewerCharacterIds();

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
  const crSteps = useMemo(() => deriveSortedChallengeRatingSteps(items), [items]);

  const customFilters = useMemo(
    () => buildMonsterCustomFilters({ crSteps }),
    [crSteps],
  );

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

  if (controller.loading || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ContentTypeListPage<MonsterListRow>
      typeLabel="Monster"
      typeLabelPlural="Monsters"
      headline="Monsters"
      breadcrumbData={breadcrumbs}
      canManage={canManage}
      onAdd={controller.onAdd}
      addButtonLabel="Add Monster"
      rows={items}
      columns={columns}
      filters={filters}
      getRowId={(r) => r.id}
      getDetailLink={controller.getDetailLink}
      getRowClassName={getMutedRowClassNameForDisallowedCampaignContent<MonsterListRow>(canManage)}
      loading={controller.loading}
      error={controller.error}
      searchPlaceholder="Search monsters…"
      emptyMessage="No monsters found."
      density="compact"
      height={560}
      viewerContext={controller.viewerContext}
      toolbarLayout={MONSTER_LIST_TOOLBAR_LAYOUT}
      contentListPreferencesKey="monsters"
      topBanner={
        validationBlocked ? (
          validationBlocked.blockingEntities.length > 0 ? (
            <ValidationBlockedAlert
              contentType="monster"
              mode="disallow"
              blockingEntities={validationBlocked.blockingEntities}
              onClose={() => setValidationBlocked(null)}
            />
          ) : (
            <AppAlert tone="warning" onClose={() => setValidationBlocked(null)}>
              {validationBlocked.message ?? 'Cannot disable this monster.'}
            </AppAlert>
          )
        ) : undefined
      }
    />
  );
}
