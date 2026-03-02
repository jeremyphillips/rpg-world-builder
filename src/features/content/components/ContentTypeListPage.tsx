/**
 * Reusable scaffold for a content-type list page.
 *
 * Renders a filterable AppDataGrid of content items (system + campaign) with
 * source badges and optional management controls (allowed toggles, policy
 * filter, "Add Custom" button) gated behind the `canManage` prop.
 *
 * The API enforces accessPolicy on both list and read-by-id endpoints.
 * Client-side filtering here is a UX convenience (avoids flashing items
 * the server already filtered out in edge-case timing windows).
 */
import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import type { GridRenderCellParams } from '@mui/x-data-grid';

import { AppDataGrid, type AppDataGridColumn } from '@/ui/patterns';
import type { ContentSummary } from '@/features/content/domain/types';
import { canBypassVisibility, canViewContent, type ViewerContext } from '@/shared/domain/capabilities';
import { AppPageHeader,VisibilityBadge } from '@/ui/patterns';
import { useBreadcrumbs } from '@/hooks';

export type ContentListItem = ContentSummary & {
  allowed: boolean;
};

type AllowedFilter = 'all' | 'allowed' | 'not_allowed';

export type ContentViewerContext = ViewerContext;

interface ContentTypeListPageProps {
  typeLabel: string;
  typeLabelPlural: string;
  items: ContentListItem[];
  getDetailLink: (item: ContentListItem) => string;
  onToggleAllowed?: (id: string, allowed: boolean) => void;
  onAdd?: () => void;
  /** When true, renders policy filter, allowed toggles, and "Add Custom" button. */
  canManage?: boolean;
  loading?: boolean;
  /** Viewer context used to filter items by accessPolicy for UX. */
  viewerContext?: ContentViewerContext;
}

const SOURCE_FILTER_OPTIONS = [
  { label: 'All Sources', value: 'all' },
  { label: 'System', value: 'system' },
  { label: 'Campaign', value: 'campaign' },
];

const ContentTypeListPage = ({
  typeLabel,
  typeLabelPlural,
  items,
  getDetailLink,
  onToggleAllowed,
  onAdd,
  canManage = false,
  loading,
  viewerContext,
}: ContentTypeListPageProps) => {
  const [allowedFilter, setAllowedFilter] = useState<AllowedFilter>('all');
  const breadcrumbs = useBreadcrumbs();

  const visibleItems = useMemo(() => {
    if (!viewerContext) return items;

    return items.filter(item => canViewContent(viewerContext, item.accessPolicy));
  }, [items, viewerContext]);

  const filteredByAllowed = useMemo(() => {
    if (!canManage) return visibleItems;
    if (allowedFilter === 'allowed') return visibleItems.filter(i => i.allowed);
    if (allowedFilter === 'not_allowed') return visibleItems.filter(i => !i.allowed);
    return visibleItems;
  }, [visibleItems, allowedFilter, canManage]);

  const showPolicyColumn = viewerContext ? canBypassVisibility(viewerContext) : false;

  const columns: AppDataGridColumn<ContentListItem>[] = useMemo(() => {
    const cols: AppDataGridColumn<ContentListItem>[] = [
      {
        field: 'imageKey',
        headerName: '',
        width: 56,
        imageColumn: true,
        imageSize: 32,
        imageShape: 'rounded',
        imageAltField: 'name',
      },
      { field: 'name', headerName: 'Name', flex: 1, linkColumn: true },
      {
        field: 'source',
        headerName: 'Source',
        width: 120,
        renderCell: (params: GridRenderCellParams) => (
          <Chip
            label={params.value as string}
            size="small"
            variant="outlined"
            color={params.value === 'campaign' ? 'primary' : 'default'}
          />
        ),
      },
    ];

    if (showPolicyColumn) {
      cols.push({
        field: 'accessPolicy',
        headerName: 'Visibility',
        width: 130,
        renderCell: (params: GridRenderCellParams) => {
          const policy = params.row.accessPolicy;
          if (!policy || policy.scope === 'public') return null;
          return <VisibilityBadge visibility={policy} />;
        },
      });
    }

    if (canManage && onToggleAllowed) {
      cols.push({
        field: 'allowed',
        headerName: 'Allowed',
        width: 100,
        switchColumn: true,
        onSwitchChange: (row, checked) => onToggleAllowed(row.id, checked),
      });
    }

    return cols;
  }, [canManage, onToggleAllowed, showPolicyColumn]);

  const toolbar = canManage ? (
    <Stack direction="row" spacing={2} alignItems="center">
      <TextField
        select
        size="small"
        value={allowedFilter}
        onChange={(e) => setAllowedFilter(e.target.value as AllowedFilter)}
        label="Policy"
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="allowed">Allowed</MenuItem>
        <MenuItem value="not_allowed">Not Allowed</MenuItem>
      </TextField>

      {onAdd && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
          Add Custom {typeLabel}
        </Button>
      )}
    </Stack>
  ) : undefined;

  return (
    <Box>
      <AppPageHeader
        headline={typeLabelPlural}
        breadcrumbData={breadcrumbs}
      />

      <AppDataGrid
        rows={filteredByAllowed}
        columns={columns}
        getRowId={(row) => row.id}
        getDetailLink={getDetailLink}
        searchable
        searchPlaceholder={`Search ${typeLabelPlural.toLowerCase()}…`}
        searchColumns={['name']}
        filterColumn="source"
        filterOptions={SOURCE_FILTER_OPTIONS}
        filterLabel="Source"
        loading={loading}
        emptyMessage={`No ${typeLabelPlural.toLowerCase()} found.`}
        toolbar={toolbar}
        density="compact"
        height={500}
      />
    </Box>
  );
};

export default ContentTypeListPage;
