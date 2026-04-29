/**
 * Reusable scaffold for a content-type list page.
 *
 * Thin wrapper that renders AppPageHeader + AppDataGrid with consistent
 * defaults. Columns and filters are passed as props; the caller composes
 * them via buildCampaignContentColumns / buildCampaignContentFilters or
 * custom definitions.
 *
 * **Search:** toolbar search uses {@link createContentSearchMatcher} with {@link DEFAULT_CONTENT_SEARCH_NAME_ONLY}
 * unless `grid.contentSearch` overrides it — same normalization path any screen should use for “content list” search UX.
 * Direct `AppDataGrid` usage should pass `search.rowMatch` explicitly when diverging from this behavior.
 */
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';

import {
  AppDataGrid,
  filterAppDataGridColumnsByVisibility,
  filterAppDataGridFiltersByVisibility,
} from '@/ui/patterns';
import type {
  AppDataGridColumn,
  AppDataGridFilter,
  AppDataGridToolbarLayout,
} from '@/ui/patterns';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
import { AppPageHeader } from '@/ui/patterns';
import type { BreadcrumbItem } from '@/ui/patterns';
import { useBreadcrumbs } from '@/app/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { AppAlert } from '@/ui/primitives';
import type { ContentListPreferencesKey } from '@/shared';
import { useContentListPreferences } from '@/features/content/shared/hooks/useContentListPreferences';
import { CAMPAIGN_CONTENT_LIST_TOOLBAR_LAYOUT_BY_PREFS_KEY } from '@/features/content/shared/toolbar/campaignContentListToolbarLayouts';
import { warnToolbarLayoutFilterIdsInDev } from '@/features/content/shared/toolbar/warnToolbarLayoutFilterIds';
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

/** Page shell: header labels, breadcrumbs, optional banner, and add/manage affordances. */
export type ContentTypeListPagePageConfig = {
  typeLabel: string;
  typeLabelPlural: string;
  /** Defaults to typeLabelPlural */
  headline?: string;
  /** Defaults to useBreadcrumbs() when not provided */
  breadcrumbData?: BreadcrumbItem[];
  actions?: ReactNode[];
  /** Optional banner above the page header (e.g. validation blocked alerts). */
  topBanner?: ReactNode;
  /** When set with `onAdd`, renders a primary Add button in the page header. */
  canManage?: boolean;
  /** Label for the header Add button (requires {@link canManage} and {@link onAdd}). */
  addButtonLabel?: string;
  /**
   * Add handler. With {@link addButtonLabel} and {@link canManage}, the button is shown in the page header.
   * Without {@link addButtonLabel}, renders "Add Custom {typeLabel}" in the grid toolbar (legacy).
   */
  onAdd?: () => void;
};

/** Grid: data, columns, filters, toolbar passthrough, and presentation defaults. */
export type ContentTypeListPageGridConfig<T> = {
  rows: T[];
  columns: AppDataGridColumn<T>[];
  filters?: AppDataGridFilter<T>[];
  getRowId: (row: T) => string;
  getDetailLink: (row: T) => string;
  /** Rendered in toolbar slot (e.g. Add button). Combined with filters. */
  toolbar?: ReactNode;
  searchPlaceholder?: string;
  /**
   * Which row fields participate in toolbar search (shared normalization).
   * Defaults to {@link DEFAULT_CONTENT_SEARCH_NAME_ONLY} (name only).
   */
  contentSearch?: ContentSearchConfig<T>;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  density?: 'compact' | 'standard' | 'comfortable';
  height?: number | string;
  /** Optional row class name (e.g. for muted allowedInCampaign=false rows) */
  getRowClassName?: (params: GridRowClassNameParams) => string;
  /**
   * When set, {@link AppDataGrid} renders filters in row order by id (not array order) and shows an active-filter badge row.
   * When {@link ContentTypeListPagePreferencesConfig.contentListPreferencesKey} is set and this is omitted, the layout is taken from
   * {@link CAMPAIGN_CONTENT_LIST_TOOLBAR_LAYOUT_BY_PREFS_KEY} so filter ids stay aligned with prefs.
   */
  toolbarLayout?: AppDataGridToolbarLayout;
};

/** Persisted list prefs and explicit filter overrides (merged with auth prefs when key is set). */
export type ContentTypeListPagePreferencesConfig = {
  /**
   * When set, persists toolbar list preferences (e.g. hide disallowed) via {@link useContentListPreferences}.
   * Omit when the list does not use persisted campaign content list prefs.
   */
  contentListPreferencesKey?: ContentListPreferencesKey;
  /** Initial session filter state (passed through to `AppDataGrid`). */
  initialFilterValues?: Record<string, unknown>;
  /** Persist or react to filter changes (passed through to `AppDataGrid`). */
  onFilterValueChange?: (filterId: string, value: unknown) => void;
};

export interface ContentTypeListPageProps<T> {
  page: ContentTypeListPagePageConfig;
  grid: ContentTypeListPageGridConfig<T>;
  preferences?: ContentTypeListPagePreferencesConfig;
  /** Viewer used to apply AppDataGrid `visibility` rules before rendering. */
  viewerContext: ContentViewerContext | undefined;
}

const ContentTypeListPage = <T,>({
  page,
  grid,
  preferences = {},
  viewerContext,
}: ContentTypeListPageProps<T>) => {
  const {
    typeLabel,
    typeLabelPlural,
    headline,
    breadcrumbData,
    actions,
    topBanner,
    canManage = false,
    addButtonLabel,
    onAdd,
  } = page;

  const {
    rows,
    columns,
    filters = [],
    getRowId,
    getDetailLink,
    toolbar,
    searchPlaceholder,
    contentSearch,
    loading = false,
    error,
    emptyMessage,
    density = 'compact',
    height = 500,
    getRowClassName,
    toolbarLayout,
  } = grid;

  const { contentListPreferencesKey, initialFilterValues, onFilterValueChange } = preferences;

  const { user, refreshUser } = useAuth();
  const prefsFromAuth = useContentListPreferences({
    canManage,
    user,
    refreshUser,
    contentListKey: contentListPreferencesKey,
  });

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
  const resolvedColumns = useMemo(
    () => filterAppDataGridColumnsByVisibility(columns, viewerContext),
    [columns, viewerContext],
  );
  const resolvedFilters = useMemo(
    () => filterAppDataGridFiltersByVisibility(filters, viewerContext),
    [filters, viewerContext],
  );

  const resolvedToolbarLayout =
    toolbarLayout ??
    (contentListPreferencesKey
      ? CAMPAIGN_CONTENT_LIST_TOOLBAR_LAYOUT_BY_PREFS_KEY[contentListPreferencesKey]
      : undefined);

  useEffect(() => {
    warnToolbarLayoutFilterIdsInDev(resolvedToolbarLayout, resolvedFilters);
  }, [resolvedToolbarLayout, resolvedFilters]);

  const mergedInitialFilterValues = useMemo(
    () => ({
      ...(prefsFromAuth.initialFilterValues ?? {}),
      ...(initialFilterValues ?? {}),
    }),
    [prefsFromAuth.initialFilterValues, initialFilterValues],
  );

  const mergedOnFilterValueChange = useCallback(
    async (id: string, value: unknown) => {
      await onFilterValueChange?.(id, value);
      await prefsFromAuth.onFilterValueChange(id, value);
    },
    [onFilterValueChange, prefsFromAuth.onFilterValueChange],
  );

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

  const gridSection = (
    <>
      <AppPageHeader
        headline={resolvedHeadline}
        breadcrumbData={resolvedBreadcrumbs}
        actions={headerActions}
      />
      <AppDataGrid
        rows={rows}
        columns={resolvedColumns}
        getRowId={getRowId}
        getDetailLink={getDetailLink}
        toolbarConfig={{
          search: {
            enabled: true,
            placeholder: resolvedSearchPlaceholder,
            rowMatch: searchRowMatch,
          },
          filters: {
            definitions: resolvedFilters,
            initialValues: mergedInitialFilterValues,
            onValueChange: mergedOnFilterValueChange,
          },
          layout: resolvedToolbarLayout,
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
    </>
  );

  return topBanner ? (
    <Stack spacing={2}>
      {topBanner}
      {gridSection}
    </Stack>
  ) : (
    <Box>{gridSection}</Box>
  );
};

export default ContentTypeListPage;
