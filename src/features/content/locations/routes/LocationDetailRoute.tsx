import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { useActiveCampaignViewerContext } from '@/app/providers/useActiveCampaignViewerContext';
import {
  ContentDetailImageKeyValueGrid,
  ContentDetailMetaRow,
  ContentDetailScaffold,
} from '@/features/content/shared/components';
import type { LocationContentItem } from '@/features/content/locations/domain';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { buildContentDetailSectionsFromSpecs } from '@/features/content/shared/forms/registry';
import { locationRepo, listLocationMaps, LOCATION_DETAIL_SPECS } from '@/features/content/locations/domain';

export default function LocationDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const viewerContext = useActiveCampaignViewerContext();
  const { locationId } = useParams<{ locationId: string }>();
  const breadcrumbs = useBreadcrumbs();

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

  const editPath = `/campaigns/${campaignId}/world/locations/${locationId}/edit`;

  const detailCtx = {
    mapGridSummary,
  };

  const { metaItems, mainItems } = buildContentDetailSectionsFromSpecs({
    specs: LOCATION_DETAIL_SPECS,
    item: loc,
    ctx: detailCtx,
    viewerContext,
  });

  return (
    <ContentDetailScaffold
      title={loc.name}
      breadcrumbData={breadcrumbs}
      editPath={editPath}
      canManage={canManage}
      source={loc.source}
      accessPolicy={loc.accessPolicy}
      hideAccessPolicyBadge
    >
      <ContentDetailMetaRow items={metaItems} />
      {loc.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      <ContentDetailImageKeyValueGrid
        imageContentType="location"
        imageKey={loc.imageKey}
        alt={loc.name}
      >
        <KeyValueSection title="Location details" items={mainItems} columns={2} />
      </ContentDetailImageKeyValueGrid>

      {loc.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3, mt: 2 }}>
          {loc.description}
        </Typography>
      )}
    </ContentDetailScaffold>
  );
}
