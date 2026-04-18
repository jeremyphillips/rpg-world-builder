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
import { armorRepo } from '../domain/repo/armorRepo';
import type { Armor } from '@/features/content/equipment/armor/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import {
  buildContentDetailSectionsFromSpecs,
  toDetailSpecViewer,
} from '@/features/content/shared/forms/registry';
import { ARMOR_DETAIL_SPECS } from '../domain/details/armorDetail.spec';

export default function ArmorDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const viewerContext = useActiveCampaignViewerContext();
  const { armorId } = useParams<{ armorId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const { entry: armor, loading, error, notFound } = useCampaignContentEntry<Armor>({
    campaignId: campaignId ?? undefined,
    entryId: armorId,
    fetchEntry: armorRepo.getEntry,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || notFound || !armor) {
    return <AppAlert tone="danger">{error ?? 'Armor not found.'}</AppAlert>;
  }

  const editPath = `/campaigns/${campaignId}/world/equipment/armor/${armorId}/edit`;

  const dexLabel = armor.dex
    ? armor.dex.mode === 'full'
      ? 'Full'
      : armor.dex.mode === 'capped'
        ? `Capped (+${armor.dex.maxBonus})`
        : 'None'
    : '—';

  const detailCtx = { dexLabel };

  const viewer = toDetailSpecViewer(viewerContext);
  const { metaItems, mainItems, advancedItems } = buildContentDetailSectionsFromSpecs({
    specs: ARMOR_DETAIL_SPECS,
    item: armor,
    ctx: detailCtx,
    viewer,
  });

  const showAdvancedSection = Boolean(viewer?.isPlatformAdmin) && advancedItems.length > 0;

  return (
    <ContentDetailScaffold
      title={armor.name}
      breadcrumbData={breadcrumbs}
      editPath={editPath}
      canManage={canManage}
      source={armor.source}
      accessPolicy={armor.accessPolicy}
      hideAccessPolicyBadge
    >
      <ContentDetailMetaRow items={metaItems} />

      <ContentDetailImageKeyValueGrid
        imageContentType="armor"
        imageKey={armor.imageKey}
        alt={armor.name}
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
            aria-controls="armor-advanced-content"
            id="armor-advanced-header"
          >
            <Typography component="span" variant="subtitle1" fontWeight={600}>
              Advanced
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <KeyValueSection title="Advanced armor data" items={advancedItems} columns={1} dense />
          </AccordionDetails>
        </Accordion>
      ) : null}
    </ContentDetailScaffold>
  );
}
