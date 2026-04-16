import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { ContentDetailScaffold } from '@/features/content/shared/components';
import { spellRepo } from '@/features/content/spells/domain';
import type { Spell } from '@/features/content/spells/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import { SPELL_DETAIL_SPECS } from '@/features/content/spells/domain';

export default function SpellDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const { spellId } = useParams<{ spellId: string }>();
  const breadcrumbs = useBreadcrumbs();

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

  const editPath = `/campaigns/${campaignId}/world/spells/${spellId}/edit`;

  const items = buildDetailItemsFromSpecs(SPELL_DETAIL_SPECS, spell, {});

  return (
    <ContentDetailScaffold
      title={spell.name}
      breadcrumbData={breadcrumbs}
      editPath={editPath}
      canManage={canManage}
      source={spell.source}
      accessPolicy={spell.accessPolicy}
    >
      {spell.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      <KeyValueSection
        items={items}
        columns={4}
        sx={{ mt: 2, mb: 8 }}
      />

      {spell.description.full && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
          {spell.description.full}
        </Typography>
      )}
    </ContentDetailScaffold>
  );
}
