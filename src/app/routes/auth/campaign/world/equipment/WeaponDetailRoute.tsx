import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { ContentDetailScaffold } from '@/features/content/components';
import { weaponRepo } from '@/features/content/domain/repo';
import type { Weapon } from '@/features/content/domain/types';
import { useCampaignContentEntry } from '@/features/content/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { resolveImageUrl } from '@/utils/image';
import { formatMoney } from '@/shared/money';

export default function WeaponDetailRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { weaponId } = useParams<{ weaponId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

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

  const listPath = `/campaigns/${campaignId}/world/equipment/weapons`;
  const editPath = `${listPath}/${weaponId}/edit`;
  const canEdit = canManage && weapon.source === 'campaign';

  return (
    <ContentDetailScaffold
      title={weapon.name}
      breadcrumbData={breadcrumbs}
      listPath={listPath}
      editPath={editPath}
      canEdit={canEdit || (canManage && weapon.source === 'system')}
      source={weapon.source}
      accessPolicy={weapon.accessPolicy}
    >
      {weapon.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      {weapon.imageKey && (
        <Box sx={{ mb: 2 }}>
          <img src={resolveImageUrl(weapon.imageKey)} alt={weapon.name} style={{ maxHeight: 200 }} />
        </Box>
      )}

      {weapon.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
          {weapon.description}
        </Typography>
      )}

      <KeyValueSection
        title="Weapon Details"
        items={[
          { label: 'Category', value: weapon.category },
          { label: 'Mode', value: weapon.mode },
          { label: 'Cost', value: formatMoney(weapon.cost) },
          { label: 'Damage', value: weapon.damage?.versatile ? `${weapon.damage.default} (${weapon.damage.versatile} versatile)` : weapon.damage?.default },
          { label: 'Damage Type', value: weapon.damageType },
          { label: 'Mastery', value: weapon.mastery },
          { label: 'Properties', value: weapon.properties?.join(', ') || '—' },
          { label: 'Range', value: weapon.range ? `${weapon.range.normal}/${weapon.range.long ?? '—'} ft` : '—' },
          { label: 'Weight', value: weapon.weight ? `${weapon.weight.value} ${weapon.weight.unit}` : '—' },
          { label: 'Source', value: <AppBadge label={weapon.source} tone={weapon.source === 'system' ? 'info' : 'default'} /> },
        ]}
        columns={2}
        sx={{ mt: 2 }}
      />
    </ContentDetailScaffold>
  );
}
