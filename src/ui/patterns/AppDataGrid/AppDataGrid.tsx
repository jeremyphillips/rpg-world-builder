import { useState, useMemo, useCallback, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowClassNameParams,
} from '@mui/x-data-grid'
import Box from '@mui/material/Box'
import GlobalStyles from '@mui/material/GlobalStyles'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import MuiLink from '@mui/material/Link'
import Switch from '@mui/material/Switch'
import Avatar from '@mui/material/Avatar'

import SearchIcon from '@mui/icons-material/Search'

import { resolveImageUrl } from '@/utils/image'


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
// ContentTypeListPage still uses legacy API and should NOT be updated yet.
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

export interface FilterOption {
  value: string
  label: string
}

export interface AppDataGridColumn<T> {
  /**
   * Field key used as the MUI DataGrid column identifier.
   * When `accessor` is provided this does not need to be a key of T.
   */
  field: string
  /** Column header label */
  headerName: string
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
}

// ── Filter types ──────────────────────────────────────────────────────────

export type AppDataGridFilter<T> =
  | {
      id: string
      label: string
      type: 'select'
      options: FilterOption[]
      accessor: (row: T) => string | null | undefined
      defaultValue?: string
    }
  | {
      id: string
      label: string
      type: 'multiSelect'
      options: FilterOption[]
      accessor: (row: T) => string[]
      defaultValue?: string[]
    }
  | {
      id: string
      label: string
      type: 'boolean'
      trueLabel?: string
      falseLabel?: string
      accessor: (row: T) => boolean
      defaultValue?: 'all' | 'true' | 'false'
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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFilterDefault<T>(f: AppDataGridFilter<T>): unknown {
  if (f.defaultValue !== undefined) return f.defaultValue
  switch (f.type) {
    case 'select':
      return f.options[0]?.value ?? ''
    case 'multiSelect':
      return []
    case 'boolean':
      return 'all'
  }
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
  loading = false,
  emptyMessage = 'No data.',
  pageSizeOptions = [10, 25, 50],
  density = 'standard',
  toolbar,
  height = 400,
  getRowClassName,
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

      return def
    })
  }, [columns, getDetailLink])

  // ── Render ────────────────────────────────────────────────────────
  const showToolbar = toolbar || searchable || resolvedFilters.length > 0

  return (
    <Box>
      {showToolbar && (
        <Stack
          direction="row"
          spacing={2}
          sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap' }}
        >
          {searchable && (
            <TextField
              size="small"
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

          {resolvedFilters.map((f) => {
            switch (f.type) {
              case 'select':
                return (
                  <TextField
                    key={f.id}
                    select
                    size="small"
                    value={getFilterValue(f) as string}
                    onChange={(e) => setFilterValue(f.id, e.target.value)}
                    label={f.label}
                    sx={{ minWidth: 160 }}
                  >
                    {f.options.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )
              case 'multiSelect':
                return (
                  <TextField
                    key={f.id}
                    select
                    size="small"
                    value={(getFilterValue(f) as string[]) ?? []}
                    onChange={(e) => {
                      const val = e.target.value
                      setFilterValue(
                        f.id,
                        typeof val === 'string' ? val.split(',') : val,
                      )
                    }}
                    label={f.label}
                    sx={{ minWidth: 160 }}
                    slotProps={{ select: { multiple: true } }}
                  >
                    {f.options.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )
              case 'boolean':
                return (
                  <TextField
                    key={f.id}
                    select
                    size="small"
                    value={getFilterValue(f) as string}
                    onChange={(e) => setFilterValue(f.id, e.target.value)}
                    label={f.label}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="true">{f.trueLabel ?? 'Yes'}</MenuItem>
                    <MenuItem value="false">{f.falseLabel ?? 'No'}</MenuItem>
                  </TextField>
                )
            }
          })}

          {toolbar && <Box sx={{ ml: 'auto' }}>{toolbar}</Box>}
        </Stack>
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
