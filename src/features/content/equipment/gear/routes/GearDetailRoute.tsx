import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { ContentDetailScaffold } from '@/features/content/shared/components';
import { gearRepo } from '../domain/repo/gearRepo';
import type { Gear } from '@/features/content/equipment/gear/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { resolveImageUrl } from '@/shared/lib/media';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import { GEAR_DETAIL_SPECS } from '../domain/details/gearDetail.spec';
import { AppAlert } from '@/ui/primitives';

export default function GearDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const { gearId } = useParams<{ gearId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const { entry: gear, loading, error, notFound } = useCampaignContentEntry<Gear>({
    campaignId: campaignId ?? undefined,
    entryId: gearId,
    fetchEntry: gearRepo.getEntry,
  });

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  if (error || notFound || !gear) {
    return <AppAlert tone="danger">{error ?? 'Gear not found.'}</AppAlert>;
  }

  const editPath = `/campaigns/${campaignId}/world/equipment/gear/${gearId}/edit`;

  const items = buildDetailItemsFromSpecs(GEAR_DETAIL_SPECS, gear, {});

  return (
    <ContentDetailScaffold
      title={gear.name}
      breadcrumbData={breadcrumbs}
      editPath={editPath}
      canManage={canManage}
      source={gear.source}
      accessPolicy={gear.accessPolicy}
    >
      {gear.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      {gear.imageKey && (
        <Box sx={{ mb: 2 }}>
          <img src={resolveImageUrl(gear.imageKey)} alt={gear.name} style={{ maxHeight: 200 }} />
        </Box>
      )}

      {gear.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
          {gear.description}
        </Typography>
      )}

      <KeyValueSection
        title="Gear Details"
        items={items}
        columns={2}
        sx={{ mt: 2 }}
      />
    </ContentDetailScaffold>
  );
}
