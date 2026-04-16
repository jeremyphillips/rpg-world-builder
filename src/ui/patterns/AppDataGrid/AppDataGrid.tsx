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
import { AppBadge, AppMultiSelectCheckbox, AppSelect, AppTextField, AppTooltip } from '@/ui/primitives'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import MuiLink from '@mui/material/Link'
import Avatar from '@mui/material/Avatar'

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SearchIcon from '@mui/icons-material/Search'

import { ContentToolbarDiscreteRangeField } from '@/features/content/shared/components'

import type { AppDataGridFilter, FilterOption } from './appDataGridFilter.types'
import {
  getFilterDefault,
  getActiveFilterBadgeSegments,
  getClampedRangeFilterValue,
} from './appDataGridFilter.utils'
import { indexAppDataGridFiltersById } from './indexAppDataGridFiltersById'
import {
  APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID,
  type AppDataGridToolbarLayout,
} from './appDataGridToolbar.types'

import { resolveImageUrl } from '@/shared/lib/media'


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
  /** MUI `size` for toolbar search + filter controls (default `small` for dense toolbars). */
  fieldSize?: 'small' | 'medium'
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
   * Enable row multi-select (checkbox column).
   * TODO: expose onSelectionChange callback and selectedIds controlled prop
   * for bulk actions (delete, export, etc.).
   */
  enabled?: boolean
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
  if (f.type === 'range') {
    const cur = getClampedRangeFilterValue(f, value)
    return cur.min !== f.defaultValue.min || cur.max !== f.defaultValue.max
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
  toolbarConfig,
  selection,
  presentation,
}: AppDataGridProps<T>) {
  const tc = toolbarConfig
  const filterBundle = tc?.filters
  const onFilterValueChange = filterBundle?.onValueChange
  const initialFilterValues = filterBundle?.initialValues

  const searchCfg = tc?.search
  const searchable = searchCfg?.enabled ?? false
  const searchPlaceholder = searchCfg?.placeholder ?? 'Search…'
  const searchRowMatch = searchCfg?.rowMatch
  const searchColumns = searchCfg?.columns

  const toolbarFieldSize = tc?.fieldSize ?? 'small'
  const toolbar = tc?.actions
  const toolbarLayout = tc?.layout

  const pres = presentation
  const loading = pres?.loading ?? false
  const emptyMessage = pres?.emptyMessage ?? 'No data.'
  const pageSizeOptions = pres?.pageSizeOptions ?? [10, 25, 50]
  const density = pres?.density ?? 'standard'
  const height = pres?.height ?? 400
  const getRowClassName = pres?.getRowClassName

  const multiSelect = selection?.enabled ?? false

  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>(
    () => ({ ...initialFilterValues }),
  )

  const setFilterValue = useCallback(
    (id: string, value: unknown) => {
      setFilterValues((prev) => ({ ...prev, [id]: value }))
      onFilterValueChange?.(id, value)
    },
    [onFilterValueChange],
  )

  const resolvedFilters = useMemo<AppDataGridFilter<T>[]>(
    () => filterBundle?.definitions ?? [],
    [filterBundle?.definitions],
  )

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
          case 'range': {
            const span = getClampedRangeFilterValue(f, current)
            const v = f.accessor(row)
            return v >= span.min && v <= span.max
          }
        }
      })

      if (!passesFilters) return false

      if (searchable && search) {
        if (searchRowMatch) return searchRowMatch(row, search)
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
  }, [rows, resolvedFilters, filterValues, searchable, search, searchRowMatch, searchColumns, columns])

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

  /** Clears search and runtime filters only; does not PATCH persisted user preferences. */
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
            <AppMultiSelectCheckbox
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
        case 'range': {
          const clamped = getClampedRangeFilterValue(f, getFilterValue(f))
          return (
            <ContentToolbarDiscreteRangeField
              label={f.label}
              steps={f.steps}
              value={clamped}
              onChange={(next) => setFilterValue(f.id, next)}
              formatValue={f.formatStepValue}
              size={toolbarFieldSize}
            />
          )
        }
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
      const segments = getActiveFilterBadgeSegments(f, cur).filter((s) => s.label.trim() !== '')
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]!
        const showPrefix = Boolean(f.badgePrefixFilterLabel)
        const badgeLabel = showPrefix ? `${f.label}: ${seg.label}` : seg.label
        out.push(
          <AppBadge
            key={`filter-${f.id}-${seg.removeValue ?? i}`}
            size="small"
            variant="outlined"
            label={badgeLabel}
            onDelete={() => {
              if (seg.removeValue !== undefined && f.type === 'multiSelect') {
                const arr = ((cur as string[]) ?? []).filter((v) => v !== seg.removeValue)
                setFilterValue(f.id, arr)
              } else {
                setFilterValue(f.id, getFilterDefault(f))
              }
            }}
          />,
        )
      }
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
