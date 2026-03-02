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
import { gearRepo } from '@/features/content/domain/repo';
import type { GearSummary } from '@/features/content/domain/types';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules';
import { AppDataGrid } from '@/ui/patterns';
import type { AppDataGridColumn, AppDataGridFilter } from '@/ui/patterns';
import { makeOwnedColumn, makeOwnedFilter } from '@/ui/patterns';
import { AppPageHeader } from '@/ui/patterns';
import { useBreadcrumbs } from '@/hooks';
import { formatCp } from '@/shared/money';
import { canManageContent, toViewerContext } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';

export default function GearListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/equipment/gear`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const { gear: ownedIds } = useViewerEquipment();
  const hasViewer = ownedIds.size > 0;

  const [items, setItems] = useState<GearSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    setLoading(true);

    gearRepo.listSummaries(campaignId, DEFAULT_SYSTEM_RULESET_ID)
      .then(data => { if (!cancelled) setItems(data); })
      .catch(err => { if (!cancelled) setError((err as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [campaignId]);

  const categoryOptions = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category))].sort();
    return [{ label: 'All', value: '' }, ...cats.map(c => ({ label: c, value: c }))];
  }, [items]);

  const columns: AppDataGridColumn<GearSummary>[] = useMemo(() => {
    const base: AppDataGridColumn<GearSummary>[] = [
      { field: 'imageKey', headerName: '', width: 56, imageColumn: true, imageSize: 32, imageShape: 'rounded', imageAltField: 'name' },
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 160, linkColumn: true },
      { field: 'category', headerName: 'Category', width: 160 },
      { field: 'costCp', headerName: 'Cost', width: 110, type: 'number', valueFormatter: (v) => formatCp(v as number) },
      { field: 'weightLb', headerName: 'Weight (lb)', width: 120, type: 'number', valueFormatter: (v) => v ? `${v} lb` : '—' },
    ];
    if (hasViewer) base.push(makeOwnedColumn<GearSummary>({ ownedIds }));
    return base;
  }, [ownedIds, hasViewer]);

  const filters: AppDataGridFilter<GearSummary>[] = useMemo(() => {
    const base: AppDataGridFilter<GearSummary>[] = [
      { id: 'category', label: 'Category', type: 'select' as const, options: categoryOptions, accessor: (r: GearSummary) => r.category },
    ];
    if (hasViewer) base.push(makeOwnedFilter<GearSummary>({ ownedIds }));
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
        headline="Gear"
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
        searchPlaceholder="Search gear…"
        searchColumns={['name']}
        emptyMessage="No gear found."
        density="compact"
        height={560}
        toolbar={
          canManage && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate(`${basePath}/new`)}>
              Add Gear
            </Button>
          )
        }
      />
    </Box>
  );
}
