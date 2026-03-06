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
import { weaponRepo } from '@/features/content/domain/repo';
import type { WeaponSummary } from '@/features/content/domain/types';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';
import { AppDataGrid } from '@/ui/patterns';
import type { AppDataGridColumn, AppDataGridFilter } from '@/ui/patterns';
import { makeOwnedColumn, makeOwnedFilter } from '@/ui/patterns';
import { AppPageHeader } from '@/ui/patterns';
import { useBreadcrumbs } from '@/hooks';
import { formatCp } from '@/shared/money';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert } from '@/ui/primitives';

export default function WeaponsListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/equipment/weapons`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const { weapons: ownedIds } = useViewerEquipment();
  const hasViewer = ownedIds.size > 0;

  const [items, setItems] = useState<WeaponSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    setLoading(true);

    weaponRepo.listSummaries(campaignId, DEFAULT_SYSTEM_RULESET_ID)
      .then(data => { if (!cancelled) setItems(data); })
      .catch(err => { if (!cancelled) setError((err as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [campaignId]);

  const categoryOptions = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category))].sort();
    return [{ label: 'All', value: '' }, ...cats.map(c => ({ label: c, value: c }))];
  }, [items]);

  const propertyOptions = useMemo(() => {
    const props = [...new Set(items.flatMap(i => i.properties))].sort();
    return [{ label: 'All', value: '' }, ...props.map(p => ({ label: p, value: p }))];
  }, [items]);

  const columns: AppDataGridColumn<WeaponSummary>[] = useMemo(() => {
    const base: AppDataGridColumn<WeaponSummary>[] = [
      { field: 'imageKey', headerName: '', width: 56, imageColumn: true, imageSize: 32, imageShape: 'rounded', imageAltField: 'name' },
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 160, linkColumn: true },
      { field: 'costCp', headerName: 'Cost', width: 80, type: 'number', valueFormatter: (v) => formatCp(v as number) },
      { field: 'category', headerName: 'Category', width: 110 },
      { field: 'damage', headerName: 'Damage', width: 80 },
      { field: 'damageType', headerName: 'Damage Type', width: 120 },
      { field: 'properties', headerName: 'Properties', width: 180, valueFormatter: (v) => (v as string[]).join(', ') },
    ];
    if (hasViewer) base.push(makeOwnedColumn<WeaponSummary>({ ownedIds }));
    return base;
  }, [ownedIds, hasViewer]);

  const filters: AppDataGridFilter<WeaponSummary>[] = useMemo(() => {
    const base: AppDataGridFilter<WeaponSummary>[] = [
      { id: 'category', label: 'Category', type: 'select' as const, options: categoryOptions, accessor: (r: WeaponSummary) => r.category },
      { id: 'property', label: 'Property', type: 'select' as const, options: propertyOptions, accessor: (r: WeaponSummary) => r.properties.length > 0 ? r.properties[0] : '' },
    ];
    if (hasViewer) base.push(makeOwnedFilter<WeaponSummary>({ ownedIds }));
    return base;
  }, [categoryOptions, propertyOptions, ownedIds, hasViewer]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <AppAlert tone="danger">{error}</AppAlert>;
  }

  return (
    <Box>
      <AppPageHeader
        headline="Weapons"
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
        searchPlaceholder="Search weapons…"
        searchColumns={['name']}
        emptyMessage="No weapons found."
        density="compact"
        height={560}
        toolbar={
          canManage && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate(`${basePath}/new`)}>
            Add Weapon
            </Button>
          )
        }
      />
    </Box>
  );
}
