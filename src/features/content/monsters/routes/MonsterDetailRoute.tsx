import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { useActiveCampaignViewerContext } from '@/app/providers/useActiveCampaignViewerContext';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';
import {
  ContentDetailAdvancedAccordion,
  ContentDetailImageKeyValueGrid,
  ContentDetailMetaRow,
  ContentDetailScaffold,
} from '@/features/content/shared/components';
import type { Monster } from '@/features/content/monsters/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { monsterRepo, MONSTER_DETAIL_SPECS, type MonsterDetailCtx } from '@/features/content/monsters/domain';
import {
  buildContentDetailSectionsFromSpecs,
  toDetailSpecViewer,
} from '@/features/content/shared/forms/registry';

export default function MonsterDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const viewerContext = useActiveCampaignViewerContext();
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

  const detailCtx = {
    armorById: catalog.armorById,
  } satisfies MonsterDetailCtx;

  const viewer = toDetailSpecViewer(viewerContext);
  const { metaItems, mainItems, advancedItems } = buildContentDetailSectionsFromSpecs({
    specs: MONSTER_DETAIL_SPECS,
    item: monster,
    ctx: detailCtx,
    viewer,
  });

  return (
    <ContentDetailScaffold
      title={monster.name}
      breadcrumbData={breadcrumbs}
      editPath={editPath}
      canManage={canManage}
      source={monster.source}
      accessPolicy={monster.accessPolicy}
      hideAccessPolicyBadge
    >
      <ContentDetailMetaRow items={metaItems} />

      <ContentDetailImageKeyValueGrid
        imageContentType="monster"
        imageKey={monster.imageKey}
        alt={monster.name}
      >
        <KeyValueSection title="" items={mainItems} columns={2} />
      </ContentDetailImageKeyValueGrid>

      <ContentDetailAdvancedAccordion
        items={advancedItems}
        sectionTitle="Advanced Monster Data"
        idPrefix="monster"
      />
    </ContentDetailScaffold>
  );
}
