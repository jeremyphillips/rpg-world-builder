import { useCallback } from 'react';
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
import type { Race } from '@/features/content/races/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import {
  buildContentDetailSectionsFromSpecs,
  toDetailSpecViewer,
} from '@/features/content/shared/forms/registry';
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets/types/ruleset.types';
import { RACE_DETAIL_SPECS, fetchRaceDetailEntry } from '@/features/content/races/domain';

export default function RaceDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const viewerContext = useActiveCampaignViewerContext();
  const { catalog } = useCampaignRules();
  const { raceId } = useParams<{ raceId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const fetchRace = useCallback(
    (cid: string, sid: SystemRulesetId, key: string) =>
      fetchRaceDetailEntry(cid, sid, key, catalog),
    [catalog],
  );

  const { entry: race, loading, error, notFound } = useCampaignContentEntry<Race>({
    campaignId: campaignId ?? undefined,
    entryKey: raceId,
    fetchEntry: fetchRace,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || notFound || !race) {
    return <AppAlert tone="danger">{error ?? 'Race not found.'}</AppAlert>;
  }

  const editPath = `/campaigns/${campaignId}/world/races/${raceId}/edit`;

  const viewer = toDetailSpecViewer(viewerContext);
  const { metaItems, mainItems, advancedItems } = buildContentDetailSectionsFromSpecs({
    specs: RACE_DETAIL_SPECS,
    item: race,
    ctx: {},
    viewer,
  });

  return (
    <ContentDetailScaffold
      title={race.name}
      breadcrumbData={breadcrumbs}
      editPath={editPath}
      canManage={canManage}
      source={race.source}
      accessPolicy={race.accessPolicy}
      hideAccessPolicyBadge
    >
      <ContentDetailMetaRow items={metaItems} />

      <ContentDetailImageKeyValueGrid
        imageContentType="race"
        imageKey={race.imageKey}
        alt={race.name}
      >
        <KeyValueSection title="" items={mainItems} columns={2} />
      </ContentDetailImageKeyValueGrid>

      <ContentDetailAdvancedAccordion
        items={advancedItems}
        sectionTitle="Advanced race data"
        idPrefix="race"
      />
    </ContentDetailScaffold>
  );
}
