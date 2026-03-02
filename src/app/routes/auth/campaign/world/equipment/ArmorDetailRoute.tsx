import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { ContentDetailScaffold } from '@/features/content/components';
import { armorRepo } from '@/features/content/domain/repo';
import type { Armor } from '@/features/content/domain/types';
import { useCampaignContentEntry } from '@/features/content/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { resolveImageUrl } from '@/utils/image';
import { formatMoney } from '@/shared/money';

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
    return <Box sx={{ maxWidth: 520, mx: 'auto', mt: 6 }}><AppAlert tone="danger">{error ?? 'Armor not found.'}</AppAlert></Box>;
  }

  const listPath = `/campaigns/${campaignId}/world/equipment/armor`;
  const editPath = `${listPath}/${armorId}/edit`;

  const dexLabel = armor.dex
    ? armor.dex.mode === 'full' ? 'Full' : armor.dex.mode === 'capped' ? `Capped (+${armor.dex.maxBonus})` : 'None'
    : '—';

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
        items={[
          { label: 'Category', value: armor.category },
          { label: 'Material', value: armor.material },
          { label: 'Cost', value: formatMoney(armor.cost) },
          { label: 'Base AC', value: armor.baseAC != null ? String(armor.baseAC) : '—' },
          { label: 'AC Bonus', value: armor.acBonus != null ? `+${armor.acBonus}` : '—' },
          { label: 'Dex Contribution', value: dexLabel },
          { label: 'Stealth Disadvantage', value: armor.stealthDisadvantage ? 'Yes' : 'No' },
          { label: 'Min Strength', value: armor.minStrength ? String(armor.minStrength) : '—' },
          { label: 'Weight', value: armor.weight ? `${armor.weight.value} ${armor.weight.unit}` : '—' },
          { label: 'Source', value: <AppBadge label={armor.source} tone={armor.source === 'system' ? 'info' : 'default'} /> },
        ]}
        columns={2}
        sx={{ mt: 2 }}
      />
    </ContentDetailScaffold>
  );
}
