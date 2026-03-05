/**
 * Centralized builders for campaign content list pages.
 *
 * Composes shared pre/post columns and filters with route-specific custom
 * columns/filters. Use buildCampaignContentColumns and buildCampaignContentFilters
 * for full composition, or the smaller helpers for custom composition.
 */
import type { AppDataGridColumn, AppDataGridFilter } from '@/ui/patterns';
import { makeOwnedColumn, makeOwnedFilter } from '@/ui/patterns';

// ---------------------------------------------------------------------------
// Row type constraints
// ---------------------------------------------------------------------------

export type CampaignContentListRow = {
  id: string;
  name: string;
  imageKey?: string | null;
  source?: string | null;
};

// ---------------------------------------------------------------------------
// Column helpers
// ---------------------------------------------------------------------------

export function makePreColumns<T extends CampaignContentListRow>(): AppDataGridColumn<T>[] {
  return [
    {
      field: 'imageKey',
      headerName: '',
      width: 56,
      imageColumn: true,
      imageSize: 32,
      imageShape: 'rounded',
      imageAltField: 'name',
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 160,
      linkColumn: true,
    },
  ];
}

export function makePostColumns<T extends CampaignContentListRow>(params: {
  ownedIds?: ReadonlySet<string>;
  canManage?: boolean;
  onToggleAllowedInCampaign?: (id: string, checked: boolean) => void;
  /** Backend may return 'allowed'; use this to map. Default: 'allowedInCampaign' */
  allowedField?: keyof T;
}): AppDataGridColumn<T>[] {
  const {
    ownedIds,
    canManage = false,
    onToggleAllowedInCampaign,
    allowedField = 'allowedInCampaign' as keyof T,
  } = params;

  const cols: AppDataGridColumn<T>[] = [];

  if (ownedIds != null && ownedIds.size > 0) {
    cols.push(makeOwnedColumn<T>({ ownedIds }));
  }

  cols.push({
    field: 'source',
    headerName: 'Source',
    width: 100,
    valueFormatter: (v) => (v != null ? String(v) : '—'),
  });

  if (canManage && onToggleAllowedInCampaign) {
    cols.push({
      field: 'allowedInCampaign',
      headerName: 'Allowed',
      width: 100,
      switchColumn: true,
      accessor: (row) => (row as Record<string, unknown>)[allowedField as string] as boolean,
      onSwitchChange: (row, checked) => onToggleAllowedInCampaign(row.id, checked),
    });
  }

  return cols;
}

export function buildCampaignContentColumns<T extends CampaignContentListRow>(params: {
  customColumns?: AppDataGridColumn<T>[];
  ownedIds?: ReadonlySet<string>;
  canManage?: boolean;
  onToggleAllowedInCampaign?: (id: string, checked: boolean) => void;
  allowedField?: keyof T;
}): AppDataGridColumn<T>[] {
  const { customColumns = [] } = params;
  const pre = makePreColumns<T>();
  const post = makePostColumns<T>(params);
  return [...pre, ...customColumns, ...post];
}

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

export function makePostFilters<T extends CampaignContentListRow>(params: {
  ownedIds?: ReadonlySet<string>;
  canManage?: boolean;
  /** When provided, data is assumed to have allowed field; include allowedInCampaign filter. */
  onToggleAllowedInCampaign?: (id: string, checked: boolean) => void;
  /** Backend may return 'allowed'; use this to map. Default: 'allowedInCampaign' */
  allowedField?: keyof T;
}): AppDataGridFilter<T>[] {
  const {
    ownedIds,
    canManage = false,
    onToggleAllowedInCampaign,
    allowedField = 'allowedInCampaign' as keyof T,
  } = params;

  const filters: AppDataGridFilter<T>[] = [];

  if (ownedIds != null && ownedIds.size > 0) {
    filters.push(makeOwnedFilter<T>({ ownedIds }));
  }

  if (canManage && onToggleAllowedInCampaign) {
    filters.push({
      id: 'allowedInCampaign',
      label: 'Allowed',
      type: 'boolean',
      trueLabel: 'Allowed',
      falseLabel: 'Not Allowed',
      accessor: (row) => Boolean((row as Record<string, unknown>)[allowedField as string]),
    });
  }

  return filters;
}

export function buildCampaignContentFilters<T extends CampaignContentListRow>(params: {
  customFilters?: AppDataGridFilter<T>[];
  ownedIds?: ReadonlySet<string>;
  canManage?: boolean;
  onToggleAllowedInCampaign?: (id: string, checked: boolean) => void;
  allowedField?: keyof T;
}): AppDataGridFilter<T>[] {
  const { customFilters = [] } = params;
  const post = makePostFilters<T>(params);
  return [...customFilters, ...post];
}
