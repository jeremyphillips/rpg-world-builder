import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { ContentDetailScaffold } from '@/features/content/shared/components';
import { spellRepo } from '@/features/content/spells/domain';
import type { Spell } from '@/features/content/spells/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import { SPELL_DETAIL_SPECS } from '@/features/content/spells/domain';

export default function SpellDetailRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { spellId } = useParams<{ spellId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const { entry: spell, loading, error, notFound } = useCampaignContentEntry<Spell>({
    campaignId: campaignId ?? undefined,
    entryId: spellId,
    fetchEntry: spellRepo.getEntry,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || notFound || !spell) {
    return <AppAlert tone="danger">{error ?? 'Spell not found.'}</AppAlert>;
  }

  const listPath = `/campaigns/${campaignId}/world/spells`;
  const editPath = `${listPath}/${spellId}/edit`;

  const items = buildDetailItemsFromSpecs(SPELL_DETAIL_SPECS, spell, {});

  return (
    <ContentDetailScaffold
      title={spell.name}
      breadcrumbData={breadcrumbs}
      listPath={listPath}
      editPath={editPath}
      canEdit={canManage}
      source={spell.source}
      accessPolicy={spell.accessPolicy}
    >
      {spell.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      {spell.description.full && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
          {spell.description.full}
        </Typography>
      )}

      <KeyValueSection
        title="Spell Details"
        items={items}
        columns={2}
        sx={{ mt: 2 }}
      />
    </ContentDetailScaffold>
  );
}
