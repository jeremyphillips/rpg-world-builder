/**
 * Centralized builders for campaign content list pages.
 *
 * Composes shared pre/post columns and filters with route-specific custom
 * columns/filters. Use buildCampaignContentColumns and buildCampaignContentFilters
 * for full composition, or the smaller helpers for custom composition.
 */
import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LockIcon from '@mui/icons-material/Lock';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import type { AppDataGridColumn, AppDataGridFilter } from '@/ui/patterns';
import { AppTooltip } from '@/ui/primitives';
import type { Visibility } from '@/shared/types/visibility';
import type { GridRenderCellParams, GridRowClassNameParams } from '@mui/x-data-grid';
import { canViewContent, type ViewerContext } from '@/shared/domain/capabilities';
import {
  SOURCE_FILTER_OPTIONS,
  getSourceColumnDisplay,
} from '@/features/content/shared/domain/sourceLabels';
import { createOwnedMembershipFilter } from '@/features/content/shared/domain/ownedMembershipFilter';
import { showPcOwnedNameIcon } from '@/features/content/shared/domain/ownedMembership';

/** Default column header helper for the Allowed-in-campaign column (all campaign content lists). */
export const CAMPAIGN_ALLOWED_IN_CAMPAIGN_COLUMN_HEADER_HELPER_TEXT =
  'Whether this entry is usable in play for this campaign. Disallowed rows may appear muted; use Hide disallowed to remove them from the list while browsing.';

/** CSS class applied by campaign list routes for rows with `allowedInCampaign === false` (see AppDataGrid GlobalStyles). */
export const CAMPAIGN_CONTENT_DISALLOWED_ROW_CLASS_NAME = 'AppDataGrid-row--disabled';

/**
 * Muted styling for disallowed campaign content when the viewer can manage the list.
 * Returns `undefined` when `canManage` is false so no extra row class logic runs.
 */
export function getMutedRowClassNameForDisallowedCampaignContent<
  T extends { allowedInCampaign?: boolean },
>(canManage: boolean): ((params: GridRowClassNameParams) => string) | undefined {
  if (!canManage) return undefined;
  return (params) =>
    (params.row as T).allowedInCampaign === false ? CAMPAIGN_CONTENT_DISALLOWED_ROW_CLASS_NAME : '';
}

// ---------------------------------------------------------------------------
// Visibility icon spec (for Name column)
// ---------------------------------------------------------------------------

export type VisibilityIconSpec = {
  icon: ReactNode;
  tooltip: string;
} | null;

export type GetVisibilityIconSpecParams = {
  policy: { scope?: string; allowCharacterIds?: string[] } | undefined;
  canManage: boolean;
  characterNameById?: Record<string, string>;
};

/**
 * Maps access policy scope to an icon + tooltip spec for the Name column.
 * Returns null for public or missing policy (no icon shown).
 * PC (canManage=false): restricted => "Restricted: visible to you"
 * DM (canManage=true): restricted => shows names when available, else count-based fallback
 */
export function getVisibilityIconSpec(params: GetVisibilityIconSpecParams): VisibilityIconSpec {
  const { policy, canManage, characterNameById } = params;
  if (!policy?.scope || policy.scope === 'public') return null;

  if (policy.scope === 'restricted') {
    let tooltip: string;
    if (!canManage) {
      tooltip = 'Restricted: visible to you';
    } else {
      const ids = policy.allowCharacterIds ?? [];
      const count = ids.length;
      if (characterNameById && ids.length > 0) {
        const names = ids
          .map((id) => characterNameById[id] ?? null)
          .filter((n): n is string => n != null);
        if (names.length > 0) {
          const first3 = names.slice(0, 3).join(', ');
          const remaining = ids.length - 3;
          tooltip =
            remaining > 0
              ? `Restricted: visible to ${first3} +${remaining}`
              : `Restricted: visible to ${first3}`;
        } else {
          tooltip = `Restricted: visible to ${count} character${count === 1 ? '' : 's'}`;
        }
      } else {
        tooltip = `Restricted: visible to ${count} character${count === 1 ? '' : 's'}`;
      }
    }
    return {
      icon: (
        <LockIcon
          fontSize="small"
          sx={{
            color: 'warning.main',
            opacity: 0.85,
            ml: 0.75,
            verticalAlign: 'middle',
          }}
        />
      ),
      tooltip,
    };
  }

  if (policy.scope === 'dm') {
    return {
      icon: (
        <VisibilityOffIcon
          fontSize="small"
          sx={{
            color: 'error.main',
            opacity: 0.85,
            ml: 0.75,
            verticalAlign: 'middle',
          }}
        />
      ),
      tooltip: 'DM only',
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Row type constraints
// ---------------------------------------------------------------------------

export type CampaignContentListRow = {
  id: string;
  name: string;
  imageKey?: string | null;
  source?: string | null;
  accessPolicy?: Visibility;
};

// ---------------------------------------------------------------------------
// Visibility filter (managers only; no dedicated Visibility column)
// ---------------------------------------------------------------------------

const VISIBILITY_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Public', value: 'public' },
  { label: 'Restricted', value: 'restricted' },
  { label: 'DM only', value: 'dm' },
] as const;

// ---------------------------------------------------------------------------
// Column helpers
// ---------------------------------------------------------------------------

export function makePreColumns<T extends CampaignContentListRow>(params: {
  canManage?: boolean;
  characterNameById?: Record<string, string>;
  /** When set with a PC viewer, shows an owned icon in the Name column (no owned column). */
  ownedIds?: ReadonlySet<string>;
  viewerContext?: ViewerContext;
}): AppDataGridColumn<T>[] {
  const { canManage = false, characterNameById, ownedIds, viewerContext } = params;
  const nameColumn: AppDataGridColumn<T> = {
    field: 'name',
    headerName: 'Name',
    flex: 1,
    minWidth: 160,
    linkColumn: true,
    renderCell: (params: GridRenderCellParams) => {
      const row = params.row as T & { accessPolicy?: { scope?: string; allowCharacterIds?: string[] } };
      const name = (params.value as string) ?? (row.name as string) ?? '';
      const spec = getVisibilityIconSpec({
        policy: row.accessPolicy,
        canManage,
        characterNameById,
      });
      const iconWithTooltip = spec ? (
        <Box component="span" sx={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
          <AppTooltip title={spec.tooltip}>
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
              {spec.icon}
            </Box>
          </AppTooltip>
        </Box>
      ) : null;
      const showOwnedIcon = showPcOwnedNameIcon({
        viewerContext,
        ownedIds,
        rowId: row.id,
      });
      const ownedIconWithTooltip = showOwnedIcon ? (
        <Box component="span" sx={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
          <AppTooltip title="You own this">
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
              <Inventory2OutlinedIcon
                fontSize="small"
                sx={{
                  color: 'success.main',
                  opacity: 0.9,
                  ml: 0.75,
                  verticalAlign: 'middle',
                }}
              />
            </Box>
          </AppTooltip>
        </Box>
      ) : null;
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <Typography component="span" noWrap variant="body2">
            {name}
          </Typography>
          {iconWithTooltip}
          {ownedIconWithTooltip}
        </Box>
      );
    },
  };

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
    nameColumn,
  ];
}

export function makePostColumns<T extends CampaignContentListRow>(params: {
  canManage?: boolean;
  onToggleAllowedInCampaign?: (id: string, checked: boolean) => void;
  /** Backend may return 'allowed'; use this to map. Default: 'allowedInCampaign' */
  allowedField?: keyof T;
  /** When false, hide Source column (no campaign items). Default: true. */
  hasCampaignSources?: boolean;
  /** Overrides {@link CAMPAIGN_ALLOWED_IN_CAMPAIGN_COLUMN_HEADER_HELPER_TEXT} for the Allowed column. */
  allowedColumnHeaderHelperText?: string;
}): AppDataGridColumn<T>[] {
  const {
    canManage = false,
    onToggleAllowedInCampaign,
    allowedField = 'allowedInCampaign' as keyof T,
    hasCampaignSources = true,
    allowedColumnHeaderHelperText,
  } = params;

  const resolvedAllowedColumnHeaderHelperText =
    allowedColumnHeaderHelperText ?? CAMPAIGN_ALLOWED_IN_CAMPAIGN_COLUMN_HEADER_HELPER_TEXT;

  const cols: AppDataGridColumn<T>[] = [];

  if (canManage && hasCampaignSources) {
    cols.push({
      field: 'source',
      headerName: 'Source',
      width: 100,
      renderCell: (params) => {
        const { text, sx } = getSourceColumnDisplay(
          (params.value as string) ?? (params.row as CampaignContentListRow).source,
        );
        if (!text) return '';
        return (
          <Typography component="span" variant="body2" sx={sx}>
            {text}
          </Typography>
        );
      },
    });
  }

  if (canManage && onToggleAllowedInCampaign) {
    cols.push({
      field: 'allowedInCampaign',
      headerName: 'Allowed',
      columnHeaderHelperText: resolvedAllowedColumnHeaderHelperText,
      width: 100,
      switchColumn: true,
      sortable: false,
      accessor: (row) => (row as Record<string, unknown>)[allowedField as string] as boolean,
      onSwitchChange: (row, checked) => onToggleAllowedInCampaign(row.id, checked),
    });
  }

  return cols;
}

export function buildCampaignContentColumns<T extends CampaignContentListRow>(params: {
  customColumns?: AppDataGridColumn<T>[];
  ownedIds?: ReadonlySet<string>;
  viewerContext?: ViewerContext;
  canManage?: boolean;
  characterNameById?: Record<string, string>;
  onToggleAllowedInCampaign?: (id: string, checked: boolean) => void;
  allowedField?: keyof T;
  /** When false, hide Source column (no campaign items). Default: true. */
  hasCampaignSources?: boolean;
  /** Overrides default Allowed column header helper text. */
  allowedColumnHeaderHelperText?: string;
}): AppDataGridColumn<T>[] {
  const { customColumns = [] } = params;
  const pre = makePreColumns<T>({
    canManage: params.canManage,
    characterNameById: params.characterNameById,
    ownedIds: params.ownedIds,
    viewerContext: params.viewerContext,
  });
  const post = makePostColumns<T>(params);
  return [...pre, ...customColumns, ...post];
}

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

export function makePostFilters<T extends CampaignContentListRow>(params: {
  ownedIds?: ReadonlySet<string>;
  canManage?: boolean;
  /** When provided with canManage, include allowedInCampaign column. Filter shows when canManage. */
  onToggleAllowedInCampaign?: (id: string, checked: boolean) => void;
  /** Backend may return 'allowed'; use this to map. Default: 'allowedInCampaign' */
  allowedField?: keyof T;
  /** When false, hide Source filter (no campaign items). Default: true. */
  hasCampaignSources?: boolean;
  /**
   * When true and canManage is false, add "Private to me" boolean filter.
   * Requires viewerContext. Opt-in per route (e.g. NPC lists).
   */
  enablePrivateToMeFilter?: boolean;
  /** Required when enablePrivateToMeFilter is true. Used to determine restricted items visible to viewer. */
  viewerContext?: ViewerContext;
}): AppDataGridFilter<T>[] {
  const {
    ownedIds,
    canManage = false,
    allowedField = 'allowedInCampaign' as keyof T,
    hasCampaignSources = true,
    enablePrivateToMeFilter = false,
    viewerContext,
  } = params;

  const filters: AppDataGridFilter<T>[] = [];

  if (ownedIds !== undefined) {
    filters.push(createOwnedMembershipFilter<T>(ownedIds));
  }

  if (enablePrivateToMeFilter && !canManage && viewerContext) {
    filters.push({
      id: 'privateToMe',
      label: 'Private to me',
      type: 'boolean',
      defaultValue: 'all',
      trueLabel: 'Only private',
      accessor: (row) => {
        const policy = (row as T & { accessPolicy?: Visibility }).accessPolicy;
        if (!policy) return false;
        if (policy.scope !== 'restricted') return false;
        return canViewContent(viewerContext, policy);
      },
    });
  }

  if (canManage) {
    if (hasCampaignSources) {
      filters.push({
        id: 'source',
        label: 'Source',
        type: 'select',
        options: [...SOURCE_FILTER_OPTIONS],
        accessor: (row) => (row as CampaignContentListRow).source ?? 'system',
        defaultValue: 'all',
      });
    }
    filters.push({
      id: 'visibility',
      label: 'Visibility',
      type: 'select',
      options: [...VISIBILITY_FILTER_OPTIONS],
      accessor: (row) => {
        const policy = (row as T & { accessPolicy?: { scope?: string } }).accessPolicy;
        return policy?.scope ?? 'public';
      },
      defaultValue: 'all',
    });
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
  /** When provided with canManage, include allowedInCampaign column. Filter shows when canManage. */
  onToggleAllowedInCampaign?: (id: string, checked: boolean) => void;
  allowedField?: keyof T;
  /** When false, hide Source column/filter (no campaign items). Default: true. */
  hasCampaignSources?: boolean;
  /**
   * When true and canManage is false, add "Private to me" boolean filter.
   * Requires viewerContext. Opt-in per route (e.g. NPC lists).
   */
  enablePrivateToMeFilter?: boolean;
  /** Required when enablePrivateToMeFilter is true. */
  viewerContext?: ViewerContext;
}): AppDataGridFilter<T>[] {
  const { customFilters = [] } = params;
  const post = makePostFilters<T>(params);
  return [...customFilters, ...post];
}
