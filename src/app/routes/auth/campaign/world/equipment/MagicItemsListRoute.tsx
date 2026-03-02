// Owned column uses makeOwnedColumn helper; integrate with character equipment state.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useViewerEquipment } from '@/features/campaign/hooks';
import { magicItemRepo } from '@/features/content/domain/repo';
import type { MagicItemSummary } from '@/features/content/domain/types';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules';
import { AppDataGrid } from '@/ui/patterns';
import type { AppDataGridColumn, AppDataGridFilter } from '@/ui/patterns';
import { makeOwnedColumn, makeOwnedFilter } from '@/ui/patterns';
import { AppPageHeader } from '@/ui/patterns';
import { useBreadcrumbs } from '@/hooks';
import { formatCp } from '@/shared/money';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';

export default function MagicItemsListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/equipment/magic-items`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const { magicItems: ownedIds } = useViewerEquipment();
  const hasViewer = ownedIds.size > 0;

  const [items, setItems] = useState<MagicItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    setLoading(true);

    magicItemRepo.listSummaries(campaignId, DEFAULT_SYSTEM_RULESET_ID)
      .then(data => { if (!cancelled) setItems(data); })
      .catch(err => { if (!cancelled) setError((err as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [campaignId]);

  const slotOptions = useMemo(() => {
    const slots = [...new Set(items.map(i => i.slot))].sort();
    return [{ label: 'All', value: '' }, ...slots.map(s => ({ label: s, value: s }))];
  }, [items]);

  const rarityOptions = useMemo(() => {
    const rarities = [...new Set(items.map(i => i.rarity).filter(Boolean) as string[])].sort();
    return [{ label: 'All', value: '' }, ...rarities.map(r => ({ label: r, value: r }))];
  }, [items]);

  const columns: AppDataGridColumn<MagicItemSummary>[] = useMemo(() => {
    const base: AppDataGridColumn<MagicItemSummary>[] = [
      { field: 'imageKey', headerName: '', width: 56, imageColumn: true, imageSize: 32, imageShape: 'rounded', imageAltField: 'name' },
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 160, linkColumn: true },
      { field: 'slot', headerName: 'Slot', width: 110 },
      { field: 'costCp', headerName: 'Cost', width: 110, type: 'number', valueFormatter: (v) => formatCp(v as number) },
      { field: 'rarity', headerName: 'Rarity', width: 120, valueFormatter: (v) => (v as string) ?? '—' },
      { field: 'requiresAttunement', headerName: 'Attunement', width: 120, valueFormatter: (v) => v ? 'Yes' : 'No' },
    ];
    if (hasViewer) base.push(makeOwnedColumn<MagicItemSummary>({ ownedIds }));
    return base;
  }, [ownedIds, hasViewer]);

  const filters: AppDataGridFilter<MagicItemSummary>[] = useMemo(() => {
    const base: AppDataGridFilter<MagicItemSummary>[] = [
      { id: 'slot', label: 'Slot', type: 'select' as const, options: slotOptions, accessor: (r: MagicItemSummary) => r.slot },
      { id: 'rarity', label: 'Rarity', type: 'select' as const, options: rarityOptions, accessor: (r: MagicItemSummary) => r.rarity ?? '' },
      { id: 'attunement', label: 'Attunement', type: 'boolean' as const, accessor: (r: MagicItemSummary) => r.requiresAttunement },
    ];
    if (hasViewer) base.push(makeOwnedFilter<MagicItemSummary>({ ownedIds }));
    return base;
  }, [slotOptions, rarityOptions, ownedIds, hasViewer]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <AppAlert tone="danger">{error}</AppAlert>;
  }

  return (
    <Box>
      <AppPageHeader
        headline="Magic Items"
        breadcrumbData={breadcrumbs}
        actions={[
          <Button key="back" component={Link} to={`/campaigns/${campaignId}/world/equipment`} size="small" startIcon={<ArrowBackIcon />}>Equipment</Button>,
        ]}
      />
      <AppDataGrid
        rows={items}
        columns={columns}
        getRowId={r => r.id}
        getDetailLink={r => `${basePath}/${r.id}`}
        filters={filters}
        searchable
        searchPlaceholder="Search magic items…"
        searchColumns={['name']}
        emptyMessage="No magic items found."
        density="compact"
        height={560}
        toolbar={
          canManage && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate(`${basePath}/new`)}>
            Add Magic Item
            </Button>
          )
        }
      />
    </Box>
  );
}
