import type { ReactNode } from 'react'
import type { GridRenderCellParams, GridRowClassNameParams } from '@mui/x-data-grid'

import type { ImageContentType } from '@/shared/lib/media'
import type { AppDataGridToolbarFieldSizes } from '@/ui/sizes'

import type { AppDataGridFilter } from './appDataGridFilter.types'
import type { AppDataGridToolbarLayout } from './appDataGridToolbar.types'
import type { AppDataGridVisibility } from './appDataGridVisibility.types'

export interface AppDataGridColumn<T> {
  /**
   * Field key used as the MUI DataGrid column identifier.
   * When `accessor` is provided this does not need to be a key of T.
   */
  field: string
  /** Column header label */
  headerName: string
  /**
   * Optional helper for the column header: info icon + tooltip beside `headerName`.
   * Uses a custom header renderer and disables sorting for this column.
   */
  columnHeaderHelperText?: string
  /**
   * Compute a derived cell value from the row instead of reading row[field].
   * When present, MUI valueGetter delegates to this function and the result
   * flows into params.value for renderCell / valueFormatter.
   */
  accessor?: (row: T) => unknown
  /** If true, this column's cell renders as a router Link using getDetailLink */
  linkColumn?: boolean
  /** Fixed width in pixels */
  width?: number
  /** Flex grow factor (use instead of width for fluid columns) */
  flex?: number
  /** Minimum width when using flex */
  minWidth?: number
  /** Column data type (e.g. 'number' for right-aligned numeric columns) */
  type?: string
  /** Custom value formatter — receives the cell value and the source row */
  valueFormatter?: (value: unknown, row: T) => string
  /**
   * Custom cell renderer for rich cell content (e.g. Chips).
   * Receives standard MUI GridRenderCellParams. When an accessor is defined
   * on the column, params.value reflects the accessor result.
   */
  renderCell?: (params: GridRenderCellParams) => ReactNode
  /**
   * If true, renders a thumbnail Avatar in the cell.
   * The image key is read from `imageKeyField` (or `field` if not set) and
   * resolved via `resolveContentImageUrl` (requires {@link imageContentType}).
   *
   * Can be combined with `linkColumn` — the Avatar is wrapped in a Link.
   * `switchColumn` takes priority over `imageColumn` if both are set.
   *
   * @example
   * ```ts
   * columns: [
   *   { field: 'imageKey', headerName: '', width: 56, imageColumn: true },
   *   { field: 'name', headerName: 'Name', flex: 1, linkColumn: true },
   * ]
   * ```
   */
  imageColumn?: boolean
  /**
   * Content category for empty-key fallback artwork. Required when `imageColumn` is true.
   */
  imageContentType?: ImageContentType
  /** Row field that holds the image storage key. Defaults to `field`. */
  imageKeyField?: string
  /** Row field used as alt text for the image. Defaults to 'name' if present. */
  imageAltField?: string
  /** Avatar size in px (default 32). */
  imageSize?: number
  /** Avatar shape (default 'rounded'). */
  imageShape?: 'rounded' | 'circle'
  /**
   * Custom Avatar children (e.g. initials). Ignored for `imageColumn` cells: thumbnails use
   * `resolveContentImageUrl` (always a URL) and omit children to avoid initials flashing while loading.
   */
  imageFallback?: ReactNode

  /** If true, renders a MUI Switch. The field value is read as a boolean. */
  switchColumn?: boolean
  /** Called when the switch is toggled (requires switchColumn) */
  onSwitchChange?: (row: T, checked: boolean) => void
  /** Disable the switch for specific rows (requires switchColumn) */
  isSwitchDisabled?: (row: T) => boolean
  /** When false, disables sorting for this column (default true). */
  sortable?: boolean
  /**
   * Optional visibility: when `platformAdminOnly` is true, hide this column for non–platform admins.
   * Filter columns with `filterAppDataGridColumnsByVisibility` before passing them to the grid.
   */
  visibility?: AppDataGridVisibility
}

export type AppDataGridToolbarSearchConfig<T> = {
  /** Show a search field above the grid */
  enabled?: boolean
  /** Placeholder for the search field */
  placeholder?: string
  /**
   * When set, used instead of {@link AppDataGridToolbarSearchConfig.columns} for toolbar search (forgiving
   * matching should be implemented by the parent).
   */
  rowMatch?: (row: T, query: string) => boolean
  /** Columns to search across (defaults to all columns). Ignored when `rowMatch` is set. */
  columns?: string[]
}

export type AppDataGridToolbarFiltersConfig<T> = {
  /** Toolbar filter definitions (select / multiSelect / boolean / range). */
  definitions: AppDataGridFilter<T>[]
  /**
   * Initial session filter state (e.g. seed `allowedInCampaign` from persisted user preferences).
   * Applied once on mount; parent should memoize and wait until values are stable (e.g. auth loaded).
   */
  initialValues?: Record<string, unknown>
  /**
   * Called after any filter value changes (including the Hide disallowed utility).
   * Use to persist UI preferences; **not** invoked for Reset (session-only clear).
   */
  onValueChange?: (filterId: string, value: unknown) => void
}

export type AppDataGridToolbarConfig<T> = {
  /**
   * MUI `size` per toolbar row. Primary defaults to `medium`, secondary to `small`.
   * Secondary row does not support `large`.
   */
  fieldSizes?: AppDataGridToolbarFieldSizes
  /** Optional actions above the grid (e.g. Add buttons) */
  actions?: ReactNode
  /**
   * When set, toolbar renders in row order by filter id (not array order) and shows an active-filter badge row.
   * When omitted, single-row toolbar in filter `definitions` declaration order.
   */
  layout?: AppDataGridToolbarLayout
  search?: AppDataGridToolbarSearchConfig<T>
  filters?: AppDataGridToolbarFiltersConfig<T>
}

export type AppDataGridSelectionConfig = {
  /**
   * Enable row multi-select (checkbox column). Uses MUI Data Grid row selection (`GridRowSelectionModel`).
   */
  enabled?: boolean
  /**
   * Controlled selection: row ids that appear selected (must match {@link AppDataGridProps.getRowId}).
   * When set, pair with {@link onSelectionChange} so the parent can update in response to user interaction.
   */
  selectedRowIds?: string[]
  /**
   * Called when selection changes. Receives ids of selected rows **within the current filtered row set**
   * (same order as visible rows for `exclude`-style “select all” semantics).
   */
  onSelectionChange?: (selectedRowIds: string[]) => void
}

export type AppDataGridPresentationConfig = {
  /** Show a loading overlay */
  loading?: boolean
  /** Message displayed when there are no rows */
  emptyMessage?: string
  /** Pagination page-size options */
  pageSizeOptions?: number[]
  /** Row density */
  density?: 'compact' | 'standard' | 'comfortable'
  /** Height of the grid container (default 400) */
  height?: number | string
  /** Optional function to add CSS class names to rows (e.g. for muted styling) */
  getRowClassName?: (params: GridRowClassNameParams) => string
}

export interface AppDataGridProps<T> {
  /** Data rows */
  rows: T[]
  /** Column definitions */
  columns: AppDataGridColumn<T>[]
  /** Extract a unique ID from each row */
  getRowId: (row: T) => string
  /** Build the detail route link for a row (used by linkColumn) */
  getDetailLink?: (row: T) => string

  /** Toolbar: search, filters, layout, and actions */
  toolbarConfig?: AppDataGridToolbarConfig<T>
  /** Row selection (checkbox column) */
  selection?: AppDataGridSelectionConfig
  /** Loading, empty state, density, sizing, row styling */
  presentation?: AppDataGridPresentationConfig
}
