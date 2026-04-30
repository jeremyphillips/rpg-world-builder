import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { useActiveCampaignViewerContext } from '@/app/providers/useActiveCampaignViewerContext';
import {
  ContentDetailAdvancedAccordion,
  ContentDetailImageKeyValueGrid,
  ContentDetailMetaRow,
  ContentDetailScaffold,
} from '@/features/content/shared/components';
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets/types/ruleset.types';
import type { LocationContentItem } from '@/features/content/locations/domain';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import {
  buildContentDetailSectionsFromSpecs,
  toDetailSpecViewer,
} from '@/features/content/shared/forms/registry';
import { fetchLocationDetailEntry, listLocationMaps, LOCATION_DETAIL_SPECS } from '@/features/content/locations/domain';

export default function LocationDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const viewerContext = useActiveCampaignViewerContext();
  const { catalog } = useCampaignRules();
  const { locationId } = useParams<{ locationId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const fetchLocationEntry = useCallback(
    (cid: string, sid: SystemRulesetId, key: string) =>
      fetchLocationDetailEntry(cid, sid, key, catalog),
    [catalog],
  );

  const { entry: loc, loading, error, notFound } = useCampaignContentEntry<LocationContentItem>({
    campaignId: campaignId ?? undefined,
    entryKey: locationId,
    fetchEntry: fetchLocationEntry,
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

  const viewer = toDetailSpecViewer(viewerContext);
  const { metaItems, mainItems, advancedItems } = buildContentDetailSectionsFromSpecs({
    specs: LOCATION_DETAIL_SPECS,
    item: loc,
    ctx: detailCtx,
    viewer,
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

      <ContentDetailImageKeyValueGrid
        imageContentType="location"
        imageKey={loc.imageKey}
        alt={loc.name}
      >
        <KeyValueSection title="" items={mainItems} columns={2} />
      </ContentDetailImageKeyValueGrid>

      <ContentDetailAdvancedAccordion
        items={advancedItems}
        sectionTitle="Advanced location data"
        idPrefix="location"
      />
    </ContentDetailScaffold>
  );
}
