import { useParams } from 'react-router-dom';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { useActiveCampaignViewerContext } from '@/app/providers/useActiveCampaignViewerContext';
import {
  ContentDetailImageKeyValueGrid,
  ContentDetailMetaRow,
  ContentDetailScaffold,
} from '@/features/content/shared/components';
import { gearRepo } from '../domain/repo/gearRepo';
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
  const { gearId } = useParams<{ gearId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const { entry: gear, loading, error, notFound } = useCampaignContentEntry<Gear>({
    campaignId: campaignId ?? undefined,
    entryId: gearId,
    fetchEntry: gearRepo.getEntry,
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

  const showAdvancedSection = Boolean(viewer?.isPlatformAdmin) && advancedItems.length > 0;

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

      {showAdvancedSection ? (
        <Accordion
          defaultExpanded={false}
          disableGutters
          sx={{ mt: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="gear-advanced-content"
            id="gear-advanced-header"
          >
            <Typography component="span" variant="subtitle1" fontWeight={600}>
              Advanced
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <KeyValueSection title="Advanced gear data" items={advancedItems} columns={1} dense />
          </AccordionDetails>
        </Accordion>
      ) : null}
    </ContentDetailScaffold>
  );
}
