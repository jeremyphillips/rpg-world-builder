import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import {
  ContentTypeListPage,
  buildCampaignContentColumns,
  buildCampaignContentFilters,
} from '@/features/content/components';
import { raceRepo } from '@/features/content/domain/repo';
import type { RaceSummary } from '@/features/content/domain/types';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';

// TODO: Wire onToggleAllowedInCampaign via useCampaignContentListController
// (src/features/content/hooks/useCampaignContentListController.ts) or a campaign-specific
// repo when ready. Until then, the allowedInCampaign column is omitted.

export default function RaceListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/races`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const [items, setItems] = useState<RaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    setLoading(true);

    raceRepo.listSummaries(campaignId, DEFAULT_SYSTEM_RULESET_ID)
      .then(data => { if (!cancelled) setItems(data); })
      .catch(err => { if (!cancelled) setError((err as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [campaignId]);

  const columns = useMemo(
    () =>
      buildCampaignContentColumns<RaceSummary>({
        canManage,
        onToggleAllowedInCampaign: undefined,
      }),
    [canManage],
  );

  const filters = useMemo(
    () =>
      buildCampaignContentFilters<RaceSummary>({
        canManage,
        onToggleAllowedInCampaign: undefined,
      }),
    [canManage],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ContentTypeListPage<RaceSummary>
      typeLabel="Race"
      typeLabelPlural="Races"
      headline="Races"
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
      getDetailLink={(r) => `${basePath}/${r.id}`}
      loading={loading}
      error={error}
      toolbar={
        canManage ? (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => navigate(`${basePath}/new`)}
          >
            Add Race
          </Button>
        ) : undefined
      }
      searchPlaceholder="Search races…"
      emptyMessage="No races found."
      density="compact"
      height={560}
    />
  );
}
