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
import { weaponRepo } from '../domain/repo/weaponRepo';
import type { Weapon } from '@/features/content/equipment/weapons/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { buildContentDetailSectionsFromSpecs } from '@/features/content/shared/forms/registry';
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
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  if (error || notFound || !weapon) {
    return <AppAlert tone="danger">{error ?? 'Weapon not found.'}</AppAlert>;
  }

  const editPath = `/campaigns/${campaignId}/world/equipment/weapons/${weaponId}/edit`;
  const canEdit = canManage && weapon.source === 'campaign';

  const { metaItems, mainItems } = buildContentDetailSectionsFromSpecs({
    specs: WEAPON_DETAIL_SPECS,
    item: weapon,
    ctx: {},
    viewerContext,
  });

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
        <KeyValueSection title="Weapon Details" items={mainItems} columns={2} />
      </ContentDetailImageKeyValueGrid>

      {weapon.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3, mt: 2 }}>
          {weapon.description}
        </Typography>
      )}
    </ContentDetailScaffold>
  );
}
