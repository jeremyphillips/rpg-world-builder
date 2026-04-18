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
import { weaponRepo } from '../domain/repo/weaponRepo';
import type { Weapon } from '@/features/content/equipment/weapons/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import {
  buildContentDetailSectionsFromSpecs,
  toDetailSpecViewer,
} from '@/features/content/shared/forms/registry';
import { WEAPON_DETAIL_SPECS } from '../domain/details/weaponDetail.spec';

export default function WeaponDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const viewerContext = useActiveCampaignViewerContext();
  const { weaponId } = useParams<{ weaponId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const { entry: weapon, loading, error, notFound } = useCampaignContentEntry<Weapon>({
    campaignId: campaignId ?? undefined,
    entryId: weaponId,
    fetchEntry: weaponRepo.getEntry,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || notFound || !weapon) {
    return <AppAlert tone="danger">{error ?? 'Weapon not found.'}</AppAlert>;
  }

  const editPath = `/campaigns/${campaignId}/world/equipment/weapons/${weaponId}/edit`;
  const canEdit = canManage && weapon.source === 'campaign';

  const viewer = toDetailSpecViewer(viewerContext);
  const { metaItems, mainItems, advancedItems } = buildContentDetailSectionsFromSpecs({
    specs: WEAPON_DETAIL_SPECS,
    item: weapon,
    ctx: {},
    viewer,
  });

  const showAdvancedSection = Boolean(viewer?.isPlatformAdmin) && advancedItems.length > 0;

  return (
    <ContentDetailScaffold
      title={weapon.name}
      breadcrumbData={breadcrumbs}
      editPath={editPath}
      canManage={canEdit || (canManage && weapon.source === 'system')}
      source={weapon.source}
      accessPolicy={weapon.accessPolicy}
      hideAccessPolicyBadge
    >
      <ContentDetailMetaRow items={metaItems} />

      <ContentDetailImageKeyValueGrid
        imageContentType="weapon"
        imageKey={weapon.imageKey}
        alt={weapon.name}
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
            aria-controls="weapon-advanced-content"
            id="weapon-advanced-header"
          >
            <Typography component="span" variant="subtitle1" fontWeight={600}>
              Advanced
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <KeyValueSection title="Advanced weapon data" items={advancedItems} columns={1} dense />
          </AccordionDetails>
        </Accordion>
      ) : null}
    </ContentDetailScaffold>
  );
}
