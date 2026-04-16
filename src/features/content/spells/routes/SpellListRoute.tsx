import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';

import { apiFetch } from '@/app/api';
import { useAuth } from '@/app/providers/AuthProvider';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';
import { useViewerSpells } from '@/features/campaign/hooks';
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
import {
  spellRepo,
  validateSpellChange,
  buildSpellCustomColumns,
  buildSpellCustomFilters,
  SPELL_LIST_TOOLBAR_LAYOUT,
  type SpellListRow,
} from '@/features/content/spells/domain';
import type { ContentSummary } from '@/features/content/shared/domain/types';
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { useBreadcrumbs } from '@/app/navigation';
import {
  APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID,
  filterAppDataGridFiltersForViewer,
} from '@/ui/patterns';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';

export default function SpellListRoute() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { campaign, campaignId } = useActiveCampaign();
  const { catalog } = useCampaignRules();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/spells`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);
  const viewerCharacterIds = campaign?.members?.viewerCharacterIds ?? [];
  const viewerContext = useMemo(
    () => toViewerContext(campaign?.viewer, viewerCharacterIds),
    [campaign?.viewer, viewerCharacterIds],
  );

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

  const [validationBlocked, setValidationBlocked] = useState<ValidationBlockedState | null>(null);

  const handleToggleAllowed = useValidatedAllowedToggle({
    campaignId,
    onToggleAllowed: controller.onToggleAllowed,
    setValidationBlocked,
    validateDisallow: (id) =>
      validateSpellChange({
        campaignId: campaignId!,
        spellId: id,
        mode: 'disallow',
      }),
  });

  const items = controller.items as SpellListRow[];
  const hasCampaignSources = items.some((r) => (r as { source?: string }).source === 'campaign');

  const customColumns = useMemo(
    () => buildSpellCustomColumns(catalog.classesById),
    [catalog.classesById],
  );

  const customFilters = useMemo(
    () => buildSpellCustomFilters(items, catalog.classesById),
    [items, catalog.classesById],
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
      filterAppDataGridFiltersForViewer(
        buildCampaignContentFilters<SpellListRow>({
          canManage,
          onToggleAllowedInCampaign: handleToggleAllowed,
          ownedIds: hasViewer ? ownedIds : undefined,
          customFilters,
          hasCampaignSources,
        }),
        viewerContext,
      ),
    [
      canManage,
      handleToggleAllowed,
      hasViewer,
      ownedIds,
      customFilters,
      hasCampaignSources,
      viewerContext,
    ],
  );

  const initialFilterValues = useMemo(() => {
    if (!canManage) return undefined;
    const hide = user?.preferences?.ui?.contentLists?.spells?.hideDisallowed;
    return {
      allowedInCampaign: hide ? 'true' : 'all',
    };
  }, [canManage, user?.preferences?.ui?.contentLists?.spells?.hideDisallowed]);

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
                  spells: { hideDisallowed },
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
            contentType="spell"
            mode="disallow"
            blockingEntities={validationBlocked.blockingEntities}
            onClose={() => setValidationBlocked(null)}
          />
        ) : (
          <AppAlert
            tone="warning"
            onClose={() => setValidationBlocked(null)}
          >
            {validationBlocked.message ?? 'Cannot disable this spell.'}
          </AppAlert>
        )
      )}
      <ContentTypeListPage<SpellListRow>
        typeLabel="Spell"
        typeLabelPlural="Spells"
        headline="Spells"
        breadcrumbData={breadcrumbs}
        actions={[
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
        searchPlaceholder="Search spells…"
        emptyMessage="No spells found."
        density="compact"
        height={560}
        toolbarLayout={SPELL_LIST_TOOLBAR_LAYOUT}
        initialFilterValues={initialFilterValues}
        onFilterValueChange={handleFilterValueChange}
      />
    </Stack>
  );
}
