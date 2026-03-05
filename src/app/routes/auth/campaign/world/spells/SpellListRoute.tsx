import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useViewerSpells } from '@/features/campaign/hooks';
import { spellRepo } from '@/features/content/domain/repo';
import type { SpellSummary } from '@/features/content/domain/repo';
import { MAGIC_SCHOOL_OPTIONS } from '@/features/content/domain/vocab';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';
import { classIdToName } from '@/features/mechanics/domain/core/rules/systemCatalog.classes';
import { AppDataGrid } from '@/ui/patterns';
import type { AppDataGridColumn, AppDataGridFilter } from '@/ui/patterns';
import { makeOwnedColumn, makeOwnedFilter } from '@/ui/patterns';
import { AppPageHeader } from '@/ui/patterns';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert, AppBadge } from '@/ui/primitives';

const schoolLabel = (value: string) =>
  MAGIC_SCHOOL_OPTIONS.find((o) => o.value === value)?.label ?? value;

const classLabel = (id: string) => classIdToName(DEFAULT_SYSTEM_RULESET_ID, id);

export default function SpellListRoute() {
  const { campaign, campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();
  const basePath = `/campaigns/${campaignId}/world/spells`;

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const ownedIds = useViewerSpells();
  const hasViewer = ownedIds.size > 0;

  const [items, setItems] = useState<SpellSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    setLoading(true);

    spellRepo
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

  const schoolOptions = useMemo(() => {
    const schools = [...new Set(items.map((i) => i.school))].sort();
    return [
      { label: 'All', value: '' },
      ...schools.map((s) => ({ label: schoolLabel(s), value: s })),
    ];
  }, [items]);

  const levelOptions = useMemo(() => {
    const levels = [...new Set(items.map((i) => i.level))].sort((a, b) => a - b);
    return [
      { label: 'All', value: '' },
      ...levels.map((l) => ({
        label: l === 0 ? 'Cantrip' : String(l),
        value: String(l),
      })),
    ];
  }, [items]);

  const classOptions = useMemo(() => {
    const classIds = [...new Set(items.flatMap((i) => i.classes))].sort();
    return classIds.map((id) => ({
      label: classLabel(id),
      value: id,
    }));
  }, [items]);

  const columns: AppDataGridColumn<SpellSummary>[] = useMemo(() => {
    const base: AppDataGridColumn<SpellSummary>[] = [
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 160, linkColumn: true },
      {
        field: 'school',
        headerName: 'School',
        width: 120,
        valueFormatter: (v) => (v ? schoolLabel(v as string) : '—'),
      },
      {
        field: 'level',
        headerName: 'Level',
        width: 90,
        type: 'number',
        valueFormatter: (v) =>
          v === 0 ? 'Cantrip' : v != null ? String(v) : '—',
      },
      {
        field: 'classes',
        headerName: 'Classes',
        flex: 1,
        minWidth: 250,
        renderCell: (params) => {
          const arr = params.value as string[] | undefined;
          if (!arr?.length) return '—';
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {arr.map((id) => (
                <AppBadge
                  key={id}
                  label={classLabel(id)}
                  tone="default"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          );
        },
        valueFormatter: (v) =>
          Array.isArray(v) && v.length > 0 ? (v as string[]).map((c) => classLabel(c)).join(', ') : '—',
      },
      {
        field: 'ritual',
        headerName: 'Ritual',
        width: 80,
        valueFormatter: (v) => (v ? 'Yes' : 'No'),
      },
      {
        field: 'concentration',
        headerName: 'Concentration',
        width: 110,
        valueFormatter: (v) => (v ? 'Yes' : 'No'),
      },
    ];
    if (hasViewer) base.push(makeOwnedColumn<SpellSummary>({ ownedIds }));
    return base;
  }, [ownedIds, hasViewer]);

  const filters: AppDataGridFilter<SpellSummary>[] = useMemo(() => {
    const base: AppDataGridFilter<SpellSummary>[] = [
      {
        id: 'school',
        label: 'School',
        type: 'select' as const,
        options: schoolOptions,
        accessor: (r: SpellSummary) => r.school,
      },
      {
        id: 'level',
        label: 'Level',
        type: 'select' as const,
        options: levelOptions,
        accessor: (r: SpellSummary) => String(r.level),
      },
      {
        id: 'classes',
        label: 'Class',
        type: 'multiSelect' as const,
        options: classOptions,
        accessor: (r: SpellSummary) => r.classes ?? [],
      },
    ];
    if (hasViewer) base.push(makeOwnedFilter<SpellSummary>({ ownedIds }));
    return base;
  }, [schoolOptions, levelOptions, classOptions, ownedIds, hasViewer]);

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

  return (
    <Box>
      <AppPageHeader
        headline="Spells"
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
        searchPlaceholder="Search spells…"
        searchColumns={['name']}
        emptyMessage="No spells found."
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
              Add Spell
            </Button>
          )
        }
      />
    </Box>
  );
}
