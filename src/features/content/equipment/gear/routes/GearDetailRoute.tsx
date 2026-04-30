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
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets/types/ruleset.types';
import { fetchGearDetailEntry } from '../domain/repo/gearRepo';
import type { Gear } from '@/features/content/equipment/gear/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import {
  buildContentDetailSectionsFromSpecs,
  toDetailSpecViewer,
} from '@/features/content/shared/forms/registry';
import { GEAR_DETAIL_SPECS } from '../domain/details/gearDetail.spec';

export default function GearDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const viewerContext = useActiveCampaignViewerContext();
  const { catalog } = useCampaignRules();
  const { gearId } = useParams<{ gearId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const fetchGearEntry = useCallback(
    (cid: string, sid: SystemRulesetId, key: string) =>
      fetchGearDetailEntry(cid, sid, key, catalog),
    [catalog],
  );

  const { entry: gear, loading, error, notFound } = useCampaignContentEntry<Gear>({
    campaignId: campaignId ?? undefined,
    entryKey: gearId,
    fetchEntry: fetchGearEntry,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || notFound || !gear) {
    return <AppAlert tone="danger">{error ?? 'Gear not found.'}</AppAlert>;
  }

  const editPath = `/campaigns/${campaignId}/world/equipment/gear/${gearId}/edit`;

  const viewer = toDetailSpecViewer(viewerContext);
  const { metaItems, mainItems, advancedItems } = buildContentDetailSectionsFromSpecs({
    specs: GEAR_DETAIL_SPECS,
    item: gear,
    ctx: {},
    viewer,
  });

  return (
    <ContentDetailScaffold
      title={gear.name}
      breadcrumbData={breadcrumbs}
      editPath={editPath}
      canManage={canManage}
      source={gear.source}
      accessPolicy={gear.accessPolicy}
      hideAccessPolicyBadge
    >
      <ContentDetailMetaRow items={metaItems} />

      <ContentDetailImageKeyValueGrid
        imageContentType="gear"
        imageKey={gear.imageKey}
        alt={gear.name}
      >
        <KeyValueSection title="" items={mainItems} columns={2} />
      </ContentDetailImageKeyValueGrid>

      <ContentDetailAdvancedAccordion
        items={advancedItems}
        sectionTitle="Advanced gear data"
        idPrefix="gear"
      />
    </ContentDetailScaffold>
  );
}
