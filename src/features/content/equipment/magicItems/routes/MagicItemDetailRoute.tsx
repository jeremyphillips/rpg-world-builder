import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { ContentDetailScaffold } from '@/features/content/shared/components';
import { magicItemRepo } from '../domain/repo/magicItemRepo';
import type { MagicItem } from '@/features/content/shared/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { resolveImageUrl } from '@/shared/lib/media';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import { MAGIC_ITEM_DETAIL_SPECS } from '../domain/details/magicItemDetail.spec';

export default function MagicItemDetailRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { magicItemId } = useParams<{ magicItemId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const { entry: item, loading, error, notFound } = useCampaignContentEntry<MagicItem>({
    campaignId: campaignId ?? undefined,
    entryId: magicItemId,
    fetchEntry: magicItemRepo.getEntry,
  });

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  if (error || notFound || !item) {
    return <AppAlert tone="danger">{error ?? 'Magic item not found.'}</AppAlert>;
  }

  const listPath = `/campaigns/${campaignId}/world/equipment/magic-items`;
  const editPath = `${listPath}/${magicItemId}/edit`;

  const items = buildDetailItemsFromSpecs(MAGIC_ITEM_DETAIL_SPECS, item, {});

  return (
    <ContentDetailScaffold
      title={item.name}
      breadcrumbData={breadcrumbs}
      listPath={listPath}
      editPath={editPath}
      canEdit={canManage}
      source={item.source}
      accessPolicy={item.accessPolicy}
    >
      {item.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      {item.imageKey && (
        <Box sx={{ mb: 2 }}>
          <img src={resolveImageUrl(item.imageKey)} alt={item.name} style={{ maxHeight: 200 }} />
        </Box>
      )}

      {item.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
          {item.description}
        </Typography>
      )}

      <KeyValueSection
        title="Magic Item Details"
        items={items}
        columns={2}
        sx={{ mt: 2 }}
      />

      {item.effects && item.effects.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Effects
          </Typography>
          <Box component="pre" sx={{ fontFamily: 'monospace', fontSize: 13, bgcolor: 'grey.50', p: 2, borderRadius: 1, overflow: 'auto' }}>
            {JSON.stringify(item.effects, null, 2)}
          </Box>
        </Box>
      )}
    </ContentDetailScaffold>
  );
}
