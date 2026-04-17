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
import { magicItemRepo } from '../domain/repo/magicItemRepo';
import type { MagicItem } from '@/features/content/equipment/magicItems/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { buildContentDetailSectionsFromSpecs } from '@/features/content/shared/forms/registry';
import { MAGIC_ITEM_DETAIL_SPECS } from '../domain/details/magicItemDetail.spec';

export default function MagicItemDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const viewerContext = useActiveCampaignViewerContext();
  const { magicItemId } = useParams<{ magicItemId: string }>();
  const breadcrumbs = useBreadcrumbs();

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

  const editPath = `/campaigns/${campaignId}/world/equipment/magic-items/${magicItemId}/edit`;

  const { metaItems, mainItems } = buildContentDetailSectionsFromSpecs({
    specs: MAGIC_ITEM_DETAIL_SPECS,
    item,
    ctx: {},
    viewerContext,
  });

  return (
    <ContentDetailScaffold
      title={item.name}
      breadcrumbData={breadcrumbs}
      editPath={editPath}
      canManage={canManage}
      source={item.source}
      accessPolicy={item.accessPolicy}
      hideAccessPolicyBadge
    >
      <ContentDetailMetaRow items={metaItems} />
      {item.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      <ContentDetailImageKeyValueGrid
        imageContentType="equipment"
        imageKey={item.imageKey}
        alt={item.name}
      >
        <KeyValueSection title="" items={mainItems} columns={2} />
      </ContentDetailImageKeyValueGrid>

      {item.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3, mt: 2 }}>
          {item.description}
        </Typography>
      )}

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
