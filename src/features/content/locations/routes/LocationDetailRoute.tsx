import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { ContentDetailScaffold } from '@/features/content/shared/components';
import type { LocationContentItem } from '@/features/content/locations/domain';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { resolveImageUrl } from '@/shared/lib/media';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import { locationRepo, listLocationMaps, LOCATION_DETAIL_SPECS } from '@/features/content/locations/domain';

export default function LocationDetailRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { locationId } = useParams<{ locationId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const { entry: loc, loading, error, notFound } = useCampaignContentEntry<LocationContentItem>({
    campaignId: campaignId ?? undefined,
    entryId: locationId,
    fetchEntry: locationRepo.getEntry,
  });

  const [campaignMapSummary, setCampaignMapSummary] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId || !locationId || !loc || loc.source !== 'campaign') {
      return;
    }
    let cancelled = false;
    listLocationMaps(campaignId, locationId).then((maps) => {
      if (cancelled) return;
      const def = maps.find((m) => m.isDefault) ?? maps[0];
      setCampaignMapSummary(
        def
          ? `Grid: ${def.grid.width} × ${def.grid.height}, ${def.grid.cellUnit}`
          : null,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [campaignId, locationId, loc]);

  const mapGridSummary =
    campaignId && locationId && loc && loc.source === 'campaign'
      ? campaignMapSummary
      : null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || notFound || !loc) {
    return <AppAlert tone="danger">{error ?? 'Location not found.'}</AppAlert>;
  }

  const listPath = `/campaigns/${campaignId}/world/locations`;
  const editPath = `${listPath}/${locationId}/edit`;

  const items = buildDetailItemsFromSpecs(LOCATION_DETAIL_SPECS, loc, {
    mapGridSummary,
  });

  return (
    <ContentDetailScaffold
      title={loc.name}
      breadcrumbData={breadcrumbs}
      listPath={listPath}
      editPath={editPath}
      canEdit={canManage}
      source={loc.source}
      accessPolicy={loc.accessPolicy}
    >
      {loc.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      {loc.imageKey && (
        <Box sx={{ mb: 2 }}>
          <img src={resolveImageUrl(loc.imageKey)} alt={loc.name} style={{ maxHeight: 500 }} />
        </Box>
      )}

      {loc.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
          {loc.description}
        </Typography>
      )}

      <KeyValueSection
        title="Location details"
        items={items}
        columns={2}
        sx={{ mt: 2 }}
      />
    </ContentDetailScaffold>
  );
}
