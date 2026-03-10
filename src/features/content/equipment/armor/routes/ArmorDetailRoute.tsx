import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { ContentDetailScaffold } from '@/features/content/shared/components';
import { armorRepo } from '../domain/repo/armorRepo';
import type { Armor } from '@/features/content/shared/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { resolveImageUrl } from '@/shared/lib/media';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import { ARMOR_DETAIL_SPECS } from '../domain/details/armorDetail.spec';

export default function ArmorDetailRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { armorId } = useParams<{ armorId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const { entry: armor, loading, error, notFound } = useCampaignContentEntry<Armor>({
    campaignId: campaignId ?? undefined,
    entryId: armorId,
    fetchEntry: armorRepo.getEntry,
  });

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  if (error || notFound || !armor) {
    return <AppAlert tone="danger">{error ?? 'Armor not found.'}</AppAlert>;
  }

  const listPath = `/campaigns/${campaignId}/world/equipment/armor`;
  const editPath = `${listPath}/${armorId}/edit`;

  const dexLabel = armor.dex
    ? armor.dex.mode === 'full' ? 'Full' : armor.dex.mode === 'capped' ? `Capped (+${armor.dex.maxBonus})` : 'None'
    : '—';

  const items = buildDetailItemsFromSpecs(ARMOR_DETAIL_SPECS, armor, {
    dexLabel,
  });

  return (
    <ContentDetailScaffold
      title={armor.name}
      breadcrumbData={breadcrumbs}
      listPath={listPath}
      editPath={editPath}
      canEdit={canManage}
      source={armor.source}
      accessPolicy={armor.accessPolicy}
    >
      {armor.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      {armor.imageKey && (
        <Box sx={{ mb: 2 }}>
          <img src={resolveImageUrl(armor.imageKey)} alt={armor.name} style={{ maxHeight: 200 }} />
        </Box>
      )}

      {armor.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
          {armor.description}
        </Typography>
      )}

      <KeyValueSection
        title="Armor Details"
        items={items}
        columns={2}
        sx={{ mt: 2 }}
      />
    </ContentDetailScaffold>
  );
}
