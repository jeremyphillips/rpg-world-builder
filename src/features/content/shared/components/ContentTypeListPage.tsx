/**
 * Reusable scaffold for a content-type list page.
 *
 * Thin wrapper that renders AppPageHeader + AppDataGrid with consistent
 * defaults. Columns and filters are passed as props; the caller composes
 * them via buildCampaignContentColumns / buildCampaignContentFilters or
 * custom definitions.
 */
import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';

import { AppDataGrid } from '@/ui/patterns';
import type {
  AppDataGridColumn,
  AppDataGridFilter,
} from '@/ui/patterns';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { AppPageHeader } from '@/ui/patterns';
import type { BreadcrumbItem } from '@/ui/patterns';
import { useBreadcrumbs } from '@/hooks';
import { AppAlert } from '@/ui/primitives';

export type ContentListItem = {
  id: string;
  name: string;
  allowedInCampaign?: boolean;
  /** Who can see this entry. Missing = public. Compatible with canViewContent. */
  accessPolicy?: { scope: string; allowCharacterIds?: string[] };
};

export type ContentViewerContext = import('@/shared/domain/capabilities').ViewerContext;

export interface ContentTypeListPageProps<T> {
  typeLabel: string;
  typeLabelPlural: string;
  /** Defaults to typeLabelPlural */
  headline?: string;
  /** Defaults to useBreadcrumbs() when not provided */
  breadcrumbData?: BreadcrumbItem[];
  actions?: ReactNode[];
  rows: T[];
  columns: AppDataGridColumn<T>[];
  filters?: AppDataGridFilter<T>[];
  getRowId: (row: T) => string;
  getDetailLink: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  /** Rendered in toolbar slot (e.g. Add button). Combined with filters. */
  toolbar?: ReactNode;
  /** Shorthand: when provided with typeLabel, renders "Add Custom {typeLabel}" button */
  onAdd?: () => void;
  searchPlaceholder?: string;
  searchColumns?: string[];
  emptyMessage?: string;
  density?: 'compact' | 'standard' | 'comfortable';
  height?: number | string;
  /** Optional row class name (e.g. for muted allowedInCampaign=false rows) */
  getRowClassName?: (params: GridRowClassNameParams) => string;
}

const ContentTypeListPage = <T,>({
  typeLabel,
  typeLabelPlural,
  headline,
  breadcrumbData,
  actions,
  rows,
  columns,
  filters = [],
  getRowId,
  getDetailLink,
  loading = false,
  error,
  toolbar,
  onAdd,
  searchPlaceholder,
  searchColumns = ['name'],
  emptyMessage,
  density = 'compact',
  height = 500,
  getRowClassName,
}: ContentTypeListPageProps<T>) => {
  const defaultBreadcrumbs = useBreadcrumbs();
  const resolvedBreadcrumbs = breadcrumbData ?? defaultBreadcrumbs;

  const resolvedHeadline = headline ?? typeLabelPlural;
  const resolvedSearchPlaceholder = searchPlaceholder ?? `Search ${typeLabelPlural.toLowerCase()}…`;
  const resolvedEmptyMessage = emptyMessage ?? `No ${typeLabelPlural.toLowerCase()} found.`;

  const toolbarNode =
    toolbar ??
    (onAdd ? (
      <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={onAdd}>
        Add Custom {typeLabel}
      </Button>
    ) : undefined);

  if (error) {
    return <AppAlert tone="danger">{error}</AppAlert>;
  }

  return (
    <Box>
      <AppPageHeader
        headline={resolvedHeadline}
        breadcrumbData={resolvedBreadcrumbs}
        actions={actions ?? []}
      />
      <AppDataGrid
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        getDetailLink={getDetailLink}
        filters={filters}
        searchable
        searchPlaceholder={resolvedSearchPlaceholder}
        searchColumns={searchColumns}
        loading={loading}
        emptyMessage={resolvedEmptyMessage}
        toolbar={toolbarNode}
        density={density}
        height={height}
        getRowClassName={getRowClassName}
      />
    </Box>
  );
};

export default ContentTypeListPage;
