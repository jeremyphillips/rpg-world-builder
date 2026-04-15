import { useState, useMemo, useCallback, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowClassNameParams,
} from '@mui/x-data-grid'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import GlobalStyles from '@mui/material/GlobalStyles'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import { AppBadge, AppMultiSelectField, AppSelect, AppTextField, AppTooltip } from '@/ui/primitives'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import MuiLink from '@mui/material/Link'
import Avatar from '@mui/material/Avatar'

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SearchIcon from '@mui/icons-material/Search'

import type { AppDataGridFilter, FilterOption } from './appDataGridFilter.types'
import {
  getFilterDefault,
  formatDefaultActiveChipValue,
} from './appDataGridFilter.utils'
import { indexAppDataGridFiltersById } from './indexAppDataGridFiltersById'
import {
  APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID,
  type AppDataGridToolbarLayout,
} from './appDataGridToolbar.types'

import { resolveImageUrl } from '@/shared/lib/media'


// ---------------------------------------------------------------------------
// MIGRATION NOTES
// ---------------------------------------------------------------------------
// Legacy props:
// - filterColumn
// - filterOptions
// - filterLabel
//
// These are deprecated and will be removed in a future refactor.
//
// New API:
// - filters: AppDataGridFilter<T>[]
// - columns[].accessor for computed values
//
// Migration strategy:
// 1. Replace filterColumn/filterOptions with filters[]
// 2. Replace direct row[field] usage with accessor where needed
// 3. Update renderCell to (row, value) signature
//
// ContentTypeListPage: pass `filters` + optional `toolbarLayout` for row-based toolbars.
//
// ---------------------------------------------------------------------------
// COLUMN SPECIAL BEHAVIORS (applied in order, later wins):
// ---------------------------------------------------------------------------
// 1. renderCell    — custom cell renderer (baseline)
// 2. imageColumn   — renders an Avatar thumbnail via resolveImageUrl
// 3. linkColumn    — wraps whatever is rendered above in a router Link
// 4. switchColumn  — renders a toggle Switch; overrides everything above
//
// imageColumn + linkColumn can be combined (Avatar wrapped in a Link).
// switchColumn always takes final priority.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
   * resolved via `resolveImageUrl`.
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
  /** Row field that holds the image storage key. Defaults to `field`. */
  imageKeyField?: string
  /** Row field used as alt text for the image. Defaults to 'name' if present. */
  imageAltField?: string
  /** Avatar size in px (default 32). */
  imageSize?: number
  /** Avatar shape (default 'rounded'). */
  imageShape?: 'rounded' | 'circle'
  /** Fallback content rendered inside the Avatar when no image is available. */
  imageFallback?: ReactNode

  /** If true, renders a MUI Switch. The field value is read as a boolean. */
  switchColumn?: boolean
  /** Called when the switch is toggled (requires switchColumn) */
  onSwitchChange?: (row: T, checked: boolean) => void
  /** Disable the switch for specific rows (requires switchColumn) */
  isSwitchDisabled?: (row: T) => boolean
  /** When false, disables sorting for this column (default true). */
  sortable?: boolean
}

export type {
  AppDataGridActiveChipFormatContext,
  AppDataGridFilter,
  AppDataGridFilterVisibility,
  FilterOption,
} from './appDataGridFilter.types'

export type { AppDataGridToolbarLayout, AppDataGridToolbarUtility } from './appDataGridToolbar.types'
export { APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID } from './appDataGridToolbar.types'

export interface AppDataGridProps<T> {
  /** Data rows */
  rows: T[]
  /** Column definitions */
  columns: AppDataGridColumn<T>[]
  /** Extract a unique ID from each row */
  getRowId: (row: T) => string
  /** Build the detail route link for a row (used by linkColumn) */
  getDetailLink?: (row: T) => string

  /**
   * @deprecated Use `filters` instead.
   * Column field to use for dropdown filtering.
   */
  filterColumn?: string
  /**
   * @deprecated Use `filters` instead.
   * Options for the filter dropdown.
   */
  filterOptions?: FilterOption[]
  /**
   * @deprecated Use `filters` instead.
   * Label shown on the filter dropdown.
   */
  filterLabel?: string

  /** Typed filter definitions. Supersedes filterColumn / filterOptions / filterLabel. */
  filters?: AppDataGridFilter<T>[]

  /**
   * Enable row multi-select.
   * TODO: expose onSelectionChange callback and selectedIds controlled prop
   * to support bulk actions (delete, export, etc.).
   */
  multiSelect?: boolean
  /** Show a search field above the grid */
  searchable?: boolean
  /** Placeholder for the search field */
  searchPlaceholder?: string
  /** Columns to search across (defaults to all columns) */
  searchColumns?: string[]
  /** MUI `size` for toolbar search + filter controls (default `small` for dense toolbars). */
  toolbarFieldSize?: 'small' | 'medium'
  /** Show a loading overlay */
  loading?: boolean
  /** Message displayed when there are no rows */
  emptyMessage?: string
  /** Pagination page-size options */
  pageSizeOptions?: number[]
  /** Row density */
  density?: 'compact' | 'standard' | 'comfortable'
  /** Optional toolbar rendered above the grid (e.g. action buttons) */
  toolbar?: ReactNode
  /** Height of the grid container (default 400) */
  height?: number | string
  /** Optional function to add CSS class names to rows (e.g. for muted styling) */
  getRowClassName?: (params: GridRowClassNameParams) => string
  /**
   * When set, toolbar renders in row order by filter id (not array order) and shows an active-filter badge row.
   * When omitted, legacy single-row toolbar in `filters` declaration order.
   */
  toolbarLayout?: AppDataGridToolbarLayout
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Inline toolbar filters: primitives default `fullWidth`; keep shrink-to-min in horizontal `Stack`. */
const APP_DATA_GRID_FILTER_FIELD_SX = { minWidth: 160, width: 'auto', flex: '0 1 auto' }

/** When options include `value: ''` (e.g. "All"), pass label as placeholder for AppSelect empty state. */
function selectPlaceholderForFilterOptions(options: FilterOption[]): string | undefined {
  const empty = options.find((o) => o.value === '')
  return empty?.label
}

function isFilterValueActive<T>(f: AppDataGridFilter<T>, value: unknown): boolean {
  const def = getFilterDefault(f)
  if (f.type === 'multiSelect') {
    const selected = (value as string[]) ?? []
    return selected.length > 0
  }
  if (f.type === 'boolean') {
    return value !== 'all'
  }
  return value !== def
}

function truncateSearchChip(text: string, max = 40): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AppDataGrid<T>({
  rows,
  columns,
  getRowId,
  getDetailLink,
  filterColumn,
  filterOptions,
  filterLabel,
  filters,
  multiSelect = false,
  searchable = false,
  searchPlaceholder = 'Search…',
  searchColumns,
  toolbarFieldSize = 'small',
  loading = false,
  emptyMessage = 'No data.',
  pageSizeOptions = [10, 25, 50],
  density = 'standard',
  toolbar,
  height = 400,
  getRowClassName,
  toolbarLayout,
}: AppDataGridProps<T>) {
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({})

  const setFilterValue = useCallback((id: string, value: unknown) => {
    setFilterValues((prev) => ({ ...prev, [id]: value }))
  }, [])

  // ── Normalise filters (new API or legacy shim) ────────────────────
  const resolvedFilters = useMemo<AppDataGridFilter<T>[]>(() => {
    if (filters) return filters
    if (filterColumn && filterOptions && filterOptions.length > 0) {
      const col = filterColumn
      return [
        {
          id: '__legacy__',
          label: filterLabel ?? '',
          type: 'select' as const,
          options: filterOptions,
          accessor: (row: T) =>
            String((row as Record<string, unknown>)[col] ?? ''),
          defaultValue: filterOptions[0]?.value,
        },
      ]
    }
    return []
  }, [filters, filterColumn, filterOptions, filterLabel])

  const getFilterValue = useCallback(
    (f: AppDataGridFilter<T>): unknown =>
      filterValues[f.id] ?? getFilterDefault(f),
    [filterValues],
  )

  // ── Filtering & searching ─────────────────────────────────────────
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const passesFilters = resolvedFilters.every((f) => {
        const current = filterValues[f.id] ?? getFilterDefault(f)

        switch (f.type) {
          case 'select': {
            const defaultVal = f.defaultValue ?? f.options[0]?.value
            if (current === defaultVal) return true
            return String(f.accessor(row) ?? '') === current
          }
          case 'multiSelect': {
            const selected = current as string[]
            if (!selected || selected.length === 0) return true
            const rowValues = f.accessor(row)
            return selected.some((v) => rowValues.includes(v))
          }
          case 'boolean': {
            if (current === 'all') return true
            const rowValue = f.accessor(row)
            return current === 'true' ? rowValue === true : rowValue === false
          }
        }
      })

      if (!passesFilters) return false

      if (searchable && search) {
        const lowerSearch = search.toLowerCase()
        const colsToSearch = searchColumns ?? columns.map((c) => c.field)
        return colsToSearch.some((fieldKey) => {
          const col = columns.find((c) => c.field === fieldKey)
          const val = col?.accessor
            ? col.accessor(row)
            : (row as Record<string, unknown>)[fieldKey]
          return val != null && String(val).toLowerCase().includes(lowerSearch)
        })
      }

      return true
    })
  }, [rows, resolvedFilters, filterValues, searchable, search, searchColumns, columns])

  // ── Map AppDataGridColumn → MUI GridColDef ────────────────────────
  const muiColumns: GridColDef[] = useMemo(() => {
    return columns.map((col) => {
      const def: GridColDef = {
        field: col.field,
        headerName: col.headerName,
        width: col.width,
        flex: col.flex,
        minWidth: col.minWidth,
        type: col.type as GridColDef['type'],
        ...(col.sortable === false ? { sortable: false } : {}),
      }

      if (col.accessor) {
        def.valueGetter = (_value: unknown, row: unknown) =>
          col.accessor!(row as T)
      }

      if (col.valueFormatter) {
        def.valueFormatter = (value: unknown, row: unknown) =>
          col.valueFormatter!(value, row as T)
      }

      if (col.renderCell) {
        def.renderCell = col.renderCell
      }

      if (col.imageColumn) {
        def.sortable = false
        def.renderCell = (params: GridRenderCellParams) => {
          const row = params.row as T
          const rec = row as Record<string, unknown>
          const keyField = col.imageKeyField ?? col.field
          const imageKey = rec[keyField] as string | null | undefined
          const src = resolveImageUrl(imageKey)

          const altField =
            col.imageAltField ?? ('name' in rec ? 'name' : undefined)
          const alt = altField ? String(rec[altField] ?? '') : ''

          const size = col.imageSize ?? 32
          const variant =
            col.imageShape === 'circle' ? 'circular' : 'rounded'

          const fallback =
            col.imageFallback ??
            (alt ? alt.charAt(0).toUpperCase() : '?')

          return (
            <Avatar
              src={src}
              alt={alt}
              variant={variant}
              sx={{ width: size, height: size, fontSize: size * 0.45 }}
            >
              {src ? undefined : fallback}
            </Avatar>
          )
        }
      }

      if (col.linkColumn && getDetailLink) {
        const innerRender = def.renderCell
        def.renderCell = (params: GridRenderCellParams) => {
          const row = params.row as T
          const content = innerRender
            ? innerRender(params)
            : (params.value as string)

          return (
            <MuiLink
              component={Link}
              to={getDetailLink(row)}
              underline="hover"
              color="inherit"
              fontWeight={600}
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {content}
            </MuiLink>
          )
        }
      }

      if (col.switchColumn) {
        def.renderCell = (params: GridRenderCellParams) => {
          const row = params.row as T
          return (
            <Switch
              checked={Boolean(params.value)}
              disabled={col.isSwitchDisabled?.(row)}
              onChange={(_e, checked) => col.onSwitchChange?.(row, checked)}
              size="small"
            />
          )
        }
      }

      if (col.columnHeaderHelperText) {
        const helperText = col.columnHeaderHelperText
        const headerLabel = col.headerName
        def.renderHeader = () => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              width: '100%',
              minWidth: 0,
              px: 0.5,
            }}
          >
            <Typography
              component="span"
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ flex: 1, minWidth: 0 }}
            >
              {headerLabel}
            </Typography>
            <AppTooltip title={helperText}>
              <IconButton size="small" aria-label="Column info" sx={{ p: 0.25, flexShrink: 0 }}>
                <InfoOutlinedIcon fontSize="inherit" />
              </IconButton>
            </AppTooltip>
          </Box>
        )
        def.sortable = false
      }

      return def
    })
  }, [columns, getDetailLink])

  const filterById = useMemo(
    () => indexAppDataGridFiltersById(resolvedFilters),
    [resolvedFilters],
  )

  const hasActiveToolbarState = useMemo(() => {
    if (search.trim()) return true
    return resolvedFilters.some((f) => {
      const cur = filterValues[f.id] ?? getFilterDefault(f)
      return isFilterValueActive(f, cur)
    })
  }, [filterValues, resolvedFilters, search])

  const resetToolbar = useCallback(() => {
    setSearch('')
    setFilterValues({})
  }, [])

  const renderFilterControl = useCallback(
    (f: AppDataGridFilter<T>) => {
      const labelEndAdornment = f.description ? (
        <AppTooltip title={f.description}>
          <IconButton size="small" aria-label="Filter info" sx={{ p: 0.25 }}>
            <InfoOutlinedIcon fontSize="inherit" />
          </IconButton>
        </AppTooltip>
      ) : undefined
      switch (f.type) {
        case 'select': {
          const placeholder = selectPlaceholderForFilterOptions(f.options)
          return (
            <AppSelect
              label={f.label}
              labelEndAdornment={labelEndAdornment}
              options={f.options}
              value={getFilterValue(f) as string}
              onChange={(v) => setFilterValue(f.id, v)}
              size={toolbarFieldSize}
              fullWidth={false}
              sx={APP_DATA_GRID_FILTER_FIELD_SX}
              placeholder={placeholder}
            />
          )
        }
        case 'multiSelect':
          return (
            <AppMultiSelectField
              label={f.label}
              labelEndAdornment={labelEndAdornment}
              options={f.options}
              value={(getFilterValue(f) as string[]) ?? []}
              onChange={(v) => setFilterValue(f.id, v)}
              size={toolbarFieldSize}
              fullWidth={false}
              displayMode="summary"
              sx={APP_DATA_GRID_FILTER_FIELD_SX}
            />
          )
        case 'boolean':
          return (
            <AppSelect
              label={f.label}
              labelEndAdornment={labelEndAdornment}
              options={[
                { value: 'all', label: 'All' },
                { value: 'true', label: f.trueLabel ?? 'Yes' },
                { value: 'false', label: f.falseLabel ?? 'No' },
              ]}
              value={getFilterValue(f) as string}
              onChange={(v) => setFilterValue(f.id, v)}
              size={toolbarFieldSize}
              fullWidth={false}
              sx={APP_DATA_GRID_FILTER_FIELD_SX}
            />
          )
      }
    },
    [getFilterValue, setFilterValue, toolbarFieldSize],
  )

  const renderFilterById = useCallback(
    (id: string) => {
      const f = filterById.get(id)
      if (!f) return null
      return renderFilterControl(f)
    },
    [filterById, renderFilterControl],
  )

  const badgeElements = useMemo(() => {
    if (!toolbarLayout) return []
    const out: ReactNode[] = []
    if (search.trim()) {
      out.push(
        <AppBadge
          key="search"
          size="small"
          variant="outlined"
          label={`Search: ${truncateSearchChip(search)}`}
          onDelete={() => setSearch('')}
        />,
      )
    }
    for (const f of resolvedFilters) {
      const cur = filterValues[f.id] ?? getFilterDefault(f)
      if (!isFilterValueActive(f, cur)) continue
      const chipText = f.formatActiveChipValue
        ? f.formatActiveChipValue({ value: cur, filter: f })
        : formatDefaultActiveChipValue(f, cur)
      out.push(
        <AppBadge
          key={`filter-${f.id}`}
          size="small"
          variant="outlined"
          label={`${f.label}: ${chipText}`}
          onDelete={() => setFilterValue(f.id, getFilterDefault(f))}
        />,
      )
    }
    return out
  }, [toolbarLayout, search, filterValues, resolvedFilters, setFilterValue])

  const gap = toolbarFieldSize === 'small' ? 1.5 : 3
  const row1Ids = toolbarLayout?.rows[0] ?? []
  const row2Ids = toolbarLayout?.rows[1] ?? []

  const allowedFilter = filterById.get(APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID)
  const allowedValue = allowedFilter
    ? (getFilterValue(allowedFilter) as string)
    : 'all'
  const showHideDisallowedUtility =
    Boolean(toolbarLayout?.utilities?.includes('hideDisallowed')) &&
    allowedFilter?.type === 'boolean' &&
    allowedValue !== 'false'

  const hideDisallowedChecked = allowedValue === 'true'

  // ── Render ────────────────────────────────────────────────────────
  const showToolbar =
    toolbar || searchable || resolvedFilters.length > 0 || Boolean(toolbarLayout)

  return (
    <Box>
      {showToolbar && (
        <>
          {toolbarLayout ? (
            <Stack spacing={2} sx={{ mb: 1.5 }}>
              <Stack
                direction="row"
                flexWrap="wrap"
                alignItems="center"
                gap={gap}
                sx={{ width: '100%' }}
              >
                {searchable && (
                  <AppTextField
                    size={toolbarFieldSize}
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ minWidth: 260 }}
                  />
                )}
                {row1Ids.map((id) => {
                  const el = renderFilterById(id)
                  return el ? <Box key={id}>{el}</Box> : null
                })}
                {toolbar && <Box sx={{ ml: 'auto' }}>{toolbar}</Box>}
              </Stack>

              {(row2Ids.length > 0 || showHideDisallowedUtility) && (
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  alignItems="center"
                  justifyContent={showHideDisallowedUtility ? 'space-between' : 'flex-start'}
                  gap={gap}
                  sx={{ width: '100%' }}
                >
                  <Stack direction="row" flexWrap="wrap" alignItems="center" gap={gap}>
                    {row2Ids.map((id) => {
                      const el = renderFilterById(id)
                      return el ? <Box key={id}>{el}</Box> : null
                    })}
                  </Stack>
                  {showHideDisallowedUtility && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={hideDisallowedChecked}
                          onChange={(_e, checked) =>
                            setFilterValue(
                              APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID,
                              checked ? 'true' : 'all',
                            )
                          }
                          size="small"
                        />
                      }
                      label="Hide disallowed"
                      sx={(theme) => ({
                        flexShrink: 0,
                        '& .MuiFormControlLabel-label': {
                          ...theme.typography.body2,
                        },
                      })}
                    />
                  )}
                </Stack>
              )}

              <Box
                sx={{
                  minHeight: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                  rowGap: 1,
                  mt: 0,
                }}
              >
                {hasActiveToolbarState && (
                  <>
                    {badgeElements}
                    <Button size="small" variant="text" onClick={resetToolbar}>
                      Reset
                    </Button>
                  </>
                )}
              </Box>
            </Stack>
          ) : (
            <Stack
              direction="row"
              sx={{
                mb: 3,
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: toolbarFieldSize === 'small' ? 1.5 : 3,
              }}
            >
              {searchable && (
                <AppTextField
                  size={toolbarFieldSize}
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ minWidth: 260 }}
                />
              )}

              {resolvedFilters.map((f) => (
                <Box key={f.id}>{renderFilterControl(f)}</Box>
              ))}

              {toolbar && <Box sx={{ ml: 'auto' }}>{toolbar}</Box>}
            </Stack>
          )}
        </>
      )}

      <GlobalStyles
        styles={{
          '.AppDataGrid-row--disabled': {
            opacity: '0.6 !important',
          },
        }}
      />
      <Box sx={{ height, width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          columns={muiColumns}
          getRowId={(row) => getRowId(row as T)}
          getRowClassName={getRowClassName}
          sx={{
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
          loading={loading}
          pageSizeOptions={pageSizeOptions}
          density={density}
          checkboxSelection={multiSelect}
          disableRowSelectionOnClick={!multiSelect}
          disableColumnFilter
          disableColumnMenu
          slots={{
            noRowsOverlay: () => (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </Box>
            ),
          }}
        />
      </Box>
    </Box>
  )
}
