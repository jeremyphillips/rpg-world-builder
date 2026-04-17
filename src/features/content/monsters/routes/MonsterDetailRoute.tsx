import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';
import { ContentDetailScaffold } from '@/features/content/shared/components';
import type { Monster } from '@/features/content/monsters/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { monsterRepo, MONSTER_DETAIL_SPECS, type MonsterDetailCtx } from '@/features/content/monsters/domain';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import { resolveImageUrl } from '@/shared/lib/media';

export default function MonsterDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const { catalog } = useCampaignRules();
  const { monsterId } = useParams<{ monsterId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const { entry: monster, loading, error, notFound } = useCampaignContentEntry<Monster>({
    campaignId: campaignId ?? undefined,
    entryId: monsterId,
    fetchEntry: monsterRepo.getEntry,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || notFound || !monster) {
    return <AppAlert tone="danger">{error ?? 'Monster not found.'}</AppAlert>;
  }

  const editPath = `/campaigns/${campaignId}/world/monsters/${monsterId}/edit`;

  const items = buildDetailItemsFromSpecs(MONSTER_DETAIL_SPECS, monster, {
    armorById: catalog.armorById,
  } satisfies MonsterDetailCtx);

  return (
    <ContentDetailScaffold
      title={monster.name}
      breadcrumbData={breadcrumbs}
      editPath={editPath}
      canManage={canManage}
      source={monster.source}
      accessPolicy={monster.accessPolicy}
    >
      {monster.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      
        <Grid container columns={12} spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, md: 8 }} sx={{ order: { xs: 2, md: 1 } }}>
            <KeyValueSection title="Monster Details" items={items} columns={2} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ order: { xs: 1, md: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {monster.imageKey && (
              <img
                src={resolveImageUrl(monster.imageKey)}
                alt={monster.name}
                style={{ maxHeight: 500, width: '100%', objectFit: 'contain' }}
              />
             )}  
            </Box>
          </Grid>
        </Grid>
      
    </ContentDetailScaffold>
  );
}
