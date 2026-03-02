import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useViewerEquipment } from '@/features/campaign/hooks';
import { armorRepo } from '@/features/content/domain/repo';
import type { ArmorSummary } from '@/features/content/domain/types';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';
import { AppDataGrid } from '@/ui/patterns';
export type { AppDataGridProps, AppDataGridColumn, AppDataGridFilter } from '@/ui/patterns';
import { makeOwnedColumn, makeOwnedFilter } from '@/ui/patterns';
import { AppPageHeader } from '@/ui/patterns';
import { useBreadcrumbs } from '@/hooks';
import { formatCp } from '@/shared/money';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';

export default function ArmorListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/equipment/armor`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const { armor: ownedIds } = useViewerEquipment();
  const hasViewer = ownedIds.size > 0;

  const [items, setItems] = useState<ArmorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    setLoading(true);

    armorRepo.listSummaries(campaignId, DEFAULT_SYSTEM_RULESET_ID)
      .then(data => { if (!cancelled) setItems(data); })
      .catch(err => { if (!cancelled) setError((err as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [campaignId]);

  const categoryOptions = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category))].sort();
    return [{ label: 'All', value: '' }, ...cats.map(c => ({ label: c, value: c }))];
  }, [items]);

  const columns: AppDataGridColumn<ArmorSummary>[] = useMemo(() => {
    const base: AppDataGridColumn<ArmorSummary>[] = [
      { field: 'imageKey', headerName: '', width: 56, imageColumn: true, imageSize: 32, imageShape: 'rounded', imageAltField: 'name' },
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 160, linkColumn: true },
      { field: 'costCp', headerName: 'Cost', width: 110, type: 'number', valueFormatter: (v) => formatCp(v as number) },
      { field: 'category', headerName: 'Category', width: 110 },
      { field: 'baseAC', headerName: 'AC', width: 80, type: 'number', valueFormatter: (v) => v != null ? String(v) : '—' },
      { field: 'acBonus', headerName: 'AC Bonus', width: 100, type: 'number', valueFormatter: (v) => v != null ? `+${v}` : '—' },
      { field: 'stealthDisadvantage', headerName: 'Stealth Disadv.', width: 140, valueFormatter: (v) => v ? 'Yes' : 'No' },
    ];
    if (hasViewer) base.push(makeOwnedColumn<ArmorSummary>({ ownedIds }));
    return base;
  }, [ownedIds, hasViewer]);

  const filters: AppDataGridFilter<ArmorSummary>[] = useMemo(() => {
    const base: AppDataGridFilter<ArmorSummary>[] = [
      { id: 'category', label: 'Category', type: 'select' as const, options: categoryOptions, accessor: (r: ArmorSummary) => r.category },
      { id: 'stealth', label: 'Stealth Disadvantage', type: 'boolean' as const, accessor: (r: ArmorSummary) => r.stealthDisadvantage },
    ];
    if (hasViewer) base.push(makeOwnedFilter<ArmorSummary>({ ownedIds }));
    return base;
  }, [categoryOptions, ownedIds, hasViewer]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <AppAlert tone="danger">{error}</AppAlert>;
  }

  return (
    <Box>
      <AppPageHeader
        headline="Armor"
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
        searchPlaceholder="Search armor…"
        searchColumns={['name']}
        emptyMessage="No armor found."
        density="compact"
        height={560}
        toolbar={
          canManage && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate(`${basePath}/new`)}>
              Add Armor
            </Button>
          )
        }
      />
    </Box>
  );
}
