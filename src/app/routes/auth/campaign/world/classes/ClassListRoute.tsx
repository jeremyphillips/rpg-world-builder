import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { classRepo } from '@/features/content/domain/repo';
import type { ClassSummary } from '@/features/content/domain/repo';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';
import { AppDataGrid } from '@/ui/patterns';
import type { AppDataGridColumn, AppDataGridFilter } from '@/ui/patterns';
import { AppPageHeader } from '@/ui/patterns';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert, AppBadge } from '@/ui/primitives';
import Stack from '@mui/material/Stack';

export default function ClassListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/classes`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const [items, setItems] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    setLoading(true);

    classRepo
      .listSummaries(campaignId, DEFAULT_SYSTEM_RULESET_ID)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const hitDieOptions = useMemo(() => {
    const dice = [...new Set(items.map((i) => i.progression?.hitDie).filter(Boolean))].sort(
      (a, b) => (a ?? 0) - (b ?? 0)
    );
    return [
      { label: 'All', value: '' },
      ...dice.map((d) => ({ label: `d${d}`, value: String(d) })),
    ];
  }, [items]);

  const columns: AppDataGridColumn<ClassSummary>[] = useMemo(
    () => [
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 160, linkColumn: true },
      {
        field: 'subclasses',
        headerName: 'Subclasses',
        flex: 1,
        minWidth: 200,
        accessor: (row) => row.definitions?.options ?? [],
        renderCell: (params) => {
          const options = (params.row as ClassSummary).definitions?.options ?? [];
          if (options.length === 0) return '—';
          return (
            <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap>
              {options.map((opt) => (
                <AppBadge key={opt.id} label={opt.name} tone="default" size="small" />
              ))}
            </Stack>
          );
        },
      },
      {
        field: 'hitDie',
        headerName: 'Hit Die',
        width: 90,
        accessor: (row) => row.progression?.hitDie,
        valueFormatter: (v) => (v != null ? `d${v}` : '—'),
      },
      {
        field: 'spellcasting',
        headerName: 'Spellcasting',
        width: 120,
        accessor: (row) => row.progression?.spellcasting ?? 'none',
        valueFormatter: (v) => (v ? String(v) : '—'),
      },
    ],
    []
  );

  const filters: AppDataGridFilter<ClassSummary>[] = useMemo(
    () => [
      {
        id: 'hitDie',
        label: 'Hit Die',
        type: 'select' as const,
        options: hitDieOptions,
        accessor: (r: ClassSummary) => (r.progression?.hitDie != null ? String(r.progression.hitDie) : ''),
      },
      {
        id: 'spellcasting',
        label: 'Spellcasting',
        type: 'select' as const,
        options: [
          { label: 'All', value: '' },
          { label: 'Full', value: 'full' },
          { label: 'Half', value: 'half' },
          { label: 'Pact', value: 'pact' },
          { label: 'None', value: 'none' },
        ],
        accessor: (r: ClassSummary) => r.progression?.spellcasting ?? 'none',
      },
    ],
    [hitDieOptions]
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <AppAlert tone="danger">{error}</AppAlert>;
  }

  if (!campaignId) {
    return null;
  }

  return (
    <Box>
      <AppPageHeader
        headline="Classes"
        breadcrumbData={breadcrumbs}
        actions={[
          <Button
            key="back"
            component={Link}
            to={`/campaigns/${campaignId}/world`}
            size="small"
            startIcon={<ArrowBackIcon />}
          >
            World
          </Button>,
        ]}
      />
      <AppDataGrid
        rows={items}
        columns={columns}
        getRowId={(r) => r.id}
        getDetailLink={(r) => `${basePath}/${r.id}`}
        filters={filters}
        searchable
        searchPlaceholder="Search classes…"
        searchColumns={['name']}
        emptyMessage="No classes found."
        density="compact"
        height={560}
        toolbar={
          canManage && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate(`${basePath}/new`)}
            >
              Add Class
            </Button>
          )
        }
      />
    </Box>
  );
}
