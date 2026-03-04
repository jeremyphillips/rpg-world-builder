import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { weaponRepo, armorRepo, gearRepo, magicItemRepo } from '@/features/content/domain/repo';
import { AppPageHeader } from '@/ui/patterns';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';

interface EquipmentCategoryCard {
  title: string;
  description: string;
  count: number | null;
  loading: boolean;
  browsePath: string;
  addPath?: string;
}

const EquipmentCategoryCardView = ({ card, canManageContent }: { 
  card: EquipmentCategoryCard, 
  canManageContent: boolean 
}) => (
  <Card>
    <CardContent>
      <Typography variant="h6" fontWeight={600}>
        {card.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {card.description}
      </Typography>
      <Typography variant="h4" sx={{ mt: 2 }}>
        {card.loading ? <CircularProgress size={24} /> : card.count}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        entries
      </Typography>
    </CardContent>
    <CardActions sx={{ px: 2, pb: 2 }}>
      <Button component={Link} to={card.browsePath} variant="contained" size="small">
        Browse
      </Button>
      {card?.addPath && canManageContent && (
        <Button component={Link} to={card.addPath} variant="outlined" size="small">
        Add
        </Button>
      )}
    </CardActions>
  </Card>
);

export default function EquipmentHubRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/equipment`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const [counts, setCounts] = useState<Record<string, number | null>>({
    weapons: null,
    armor: null,
    gear: null,
    magicItems: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;

    const fetchCounts = async () => {
      const [w, a, g, m] = await Promise.all([
        weaponRepo.listSummaries(campaignId, DEFAULT_SYSTEM_RULESET_ID),
        armorRepo.listSummaries(campaignId, DEFAULT_SYSTEM_RULESET_ID),
        gearRepo.listSummaries(campaignId, DEFAULT_SYSTEM_RULESET_ID),
        magicItemRepo.listSummaries(campaignId, DEFAULT_SYSTEM_RULESET_ID),
      ]);
      if (!cancelled) {
        setCounts({
          weapons: w.length,
          armor: a.length,
          gear: g.length,
          magicItems: m.length,
        });
        setLoading(false);
      }
    };

    fetchCounts().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [campaignId]);

  const cards: EquipmentCategoryCard[] = [
    {
      title: 'Weapons',
      description: 'Swords, bows, and instruments of war.',
      count: counts.weapons,
      loading,
      browsePath: `${basePath}/weapons`,
      addPath: `${basePath}/weapons/new`,
    },
    {
      title: 'Armor',
      description: 'Shields, mail, and protective gear.',
      count: counts.armor,
      loading,
      browsePath: `${basePath}/armor`,
      addPath: `${basePath}/armor/new`,
    },
    {
      title: 'Gear',
      description: 'Adventuring supplies and tools.',
      count: counts.gear,
      loading,
      browsePath: `${basePath}/gear`,
      addPath: `${basePath}/gear/new`,
    },
    {
      title: 'Magic Items',
      description: 'Enchanted objects and wondrous items.',
      count: counts.magicItems,
      loading,
      browsePath: `${basePath}/magic-items`,
      addPath: `${basePath}/magic-items/new`
    },
  ];

  return (
    <Box>
      <AppPageHeader headline="Equipment" breadcrumbData={breadcrumbs} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mt: 2,
        }}
      >
        {cards.map(card => (
          <EquipmentCategoryCardView key={card.title} card={card} canManageContent={canManage} />
        ))}
      </Box>
    </Box>
  );
}
