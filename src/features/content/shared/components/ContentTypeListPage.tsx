/**
 * Reusable scaffold for a content-type list page.
 *
 * Thin wrapper that renders AppPageHeader + AppDataGrid with consistent
 * defaults. Columns and filters are passed as props; the caller composes
 * them via buildCampaignContentColumns / buildCampaignContentFilters or
 * custom definitions.
 */
import { useMemo, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';

import { AppDataGrid } from '@/ui/patterns';
import type {
  AppDataGridColumn,
  AppDataGridFilter,
  AppDataGridToolbarLayout,
} from '@/ui/patterns';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { AppPageHeader } from '@/ui/patterns';
import type { BreadcrumbItem } from '@/ui/patterns';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';
import {
  createContentSearchMatcher,
  DEFAULT_CONTENT_SEARCH_NAME_ONLY,
  type ContentSearchConfig,
} from '@/features/content/shared/search';

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
  /** When set with `onAdd`, renders a primary Add button in the page header. */
  canManage?: boolean;
  /** Label for the header Add button (requires {@link canManage} and {@link onAdd}). */
  addButtonLabel?: string;
  rows: T[];
  columns: AppDataGridColumn<T>[];
  filters?: AppDataGridFilter<T>[];
  getRowId: (row: T) => string;
  getDetailLink: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  /** Rendered in toolbar slot (e.g. Add button). Combined with filters. */
  toolbar?: ReactNode;
  /**
   * Add handler. With {@link addButtonLabel} and {@link canManage}, the button is shown in the page header.
   * Without {@link addButtonLabel}, renders "Add Custom {typeLabel}" in the grid toolbar (legacy).
   */
  onAdd?: () => void;
  searchPlaceholder?: string;
  /**
   * Which row fields participate in toolbar search (shared normalization).
   * Defaults to {@link DEFAULT_CONTENT_SEARCH_NAME_ONLY} (name only).
   */
  contentSearch?: ContentSearchConfig<T>;
  emptyMessage?: string;
  density?: 'compact' | 'standard' | 'comfortable';
  height?: number | string;
  /** Optional row class name (e.g. for muted allowedInCampaign=false rows) */
  getRowClassName?: (params: GridRowClassNameParams) => string;
  /**
   * When set, {@link AppDataGrid} renders filters in row order by id (not array order) and shows an active-filter badge row.
   */
  toolbarLayout?: AppDataGridToolbarLayout;
  /** Initial session filter state (passed through to `AppDataGrid`). */
  initialFilterValues?: Record<string, unknown>;
  /** Persist or react to filter changes (passed through to `AppDataGrid`). */
  onFilterValueChange?: (filterId: string, value: unknown) => void;
}

const ContentTypeListPage = <T,>({
  typeLabel,
  typeLabelPlural,
  headline,
  breadcrumbData,
  actions,
  canManage = false,
  addButtonLabel,
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
  contentSearch,
  emptyMessage,
  density = 'compact',
  height = 500,
  getRowClassName,
  toolbarLayout,
  initialFilterValues,
  onFilterValueChange,
}: ContentTypeListPageProps<T>) => {
  const defaultBreadcrumbs = useBreadcrumbs();
  const resolvedBreadcrumbs = breadcrumbData ?? defaultBreadcrumbs;

  const resolvedContentSearch = contentSearch ?? DEFAULT_CONTENT_SEARCH_NAME_ONLY;
  const searchRowMatch = useMemo(
    () => createContentSearchMatcher(resolvedContentSearch as ContentSearchConfig<T>),
    [resolvedContentSearch],
  );

  const resolvedHeadline = headline ?? typeLabelPlural;
  const resolvedSearchPlaceholder = searchPlaceholder ?? `Search ${typeLabelPlural.toLowerCase()}…`;
  const resolvedEmptyMessage = emptyMessage ?? `No ${typeLabelPlural.toLowerCase()} found.`;

  const headerActions = useMemo(() => {
    const base = (actions ?? []).filter(Boolean) as ReactNode[];
    if (canManage && onAdd && addButtonLabel) {
      base.push(
        <Button
          key="add"
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAdd}
        >
          {addButtonLabel}
        </Button>,
      );
    }
    return base;
  }, [actions, addButtonLabel, canManage, onAdd]);

  const toolbarNode =
    toolbar ??
    (onAdd && !addButtonLabel ? (
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
        actions={headerActions}
      />
      <AppDataGrid
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        getDetailLink={getDetailLink}
        toolbarConfig={{
          search: {
            enabled: true,
            placeholder: resolvedSearchPlaceholder,
            rowMatch: searchRowMatch,
          },
          filters: {
            definitions: filters,
            initialValues: initialFilterValues,
            onValueChange: onFilterValueChange,
          },
          layout: toolbarLayout,
          actions: toolbarNode,
        }}
        presentation={{
          loading,
          emptyMessage: resolvedEmptyMessage,
          density,
          height,
          getRowClassName,
        }}
      />
    </Box>
  );
};

export default ContentTypeListPage;
