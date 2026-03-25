import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';
import { ContentDetailScaffold } from '@/features/content/shared/components';
import type { Monster } from '@/features/content/monsters/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { monsterRepo, MONSTER_DETAIL_SPECS, type MonsterDetailCtx } from '@/features/content/monsters/domain';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import { resolveImageUrl } from '@/shared/lib/media';

export default function MonsterDetailRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { catalog } = useCampaignRules();
  const { monsterId } = useParams<{ monsterId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

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

  const listPath = `/campaigns/${campaignId}/world/monsters`;
  const editPath = `${listPath}/${monsterId}/edit`;

  const items = buildDetailItemsFromSpecs(MONSTER_DETAIL_SPECS, monster, {
    armorById: catalog.armorById,
  } satisfies MonsterDetailCtx);

  return (
    <ContentDetailScaffold
      title={monster.name}
      breadcrumbData={breadcrumbs}
      listPath={listPath}
      editPath={editPath}
      canEdit={canManage}
      source={monster.source}
      accessPolicy={monster.accessPolicy}
    >
      {monster.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      {monster?.imageKey && (
        <Box sx={{ mb: 2 }}>
          <img src={resolveImageUrl(monster.imageKey)} alt={monster.name} style={{ maxHeight: 500 }} />
        </Box>
      )}

      <KeyValueSection
        title="Monster Details"
        items={items}
        columns={2}
        sx={{ mt: 2 }}
      />
    </ContentDetailScaffold>
  );
}
