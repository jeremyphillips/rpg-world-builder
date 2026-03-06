import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { ContentDetailScaffold } from '@/features/content/shared/components';
import { gearRepo } from '@/features/content/domain/repo';
import type { Gear } from '@/features/content/shared/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { resolveImageUrl } from '@/utils/image';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import { GEAR_DETAIL_SPECS } from '@/features/content/equipment/gear/domain';
import { AppAlert } from '@/ui/primitives';

export default function GearDetailRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { gearId } = useParams<{ gearId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

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

  const listPath = `/campaigns/${campaignId}/world/equipment/gear`;
  const editPath = `${listPath}/${gearId}/edit`;

  const items = buildDetailItemsFromSpecs(GEAR_DETAIL_SPECS, gear, {});

  return (
    <ContentDetailScaffold
      title={gear.name}
      breadcrumbData={breadcrumbs}
      listPath={listPath}
      editPath={editPath}
      canEdit={canManage}
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
