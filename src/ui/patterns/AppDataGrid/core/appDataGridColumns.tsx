import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import MuiLink from '@mui/material/Link'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import { AppTooltip } from '@/ui/primitives'
import { resolveContentImageUrl } from '@/shared/lib/media'

import type { AppDataGridColumn } from '../types'

export function buildMuiColumns<T>(params: {
  columns: AppDataGridColumn<T>[]
  getDetailLink?: (row: T) => string
}): GridColDef[] {
  const { columns, getDetailLink } = params

  return columns.map((column) => {
    const definition: GridColDef = {
      field: column.field,
      headerName: column.headerName,
      width: column.width,
      flex: column.flex,
      minWidth: column.minWidth,
      type: column.type as GridColDef['type'],
      ...(column.sortable === false ? { sortable: false } : {}),
    }

    if (column.accessor) {
      definition.valueGetter = (_value: unknown, row: unknown) =>
        column.accessor!(row as T)
    }

    if (column.valueFormatter) {
      definition.valueFormatter = (value: unknown, row: unknown) =>
        column.valueFormatter!(value, row as T)
    }

    if (column.renderCell) {
      definition.renderCell = column.renderCell
    }

    if (column.imageColumn) {
      if (!column.imageContentType) {
        throw new Error('AppDataGridColumn: imageContentType is required when imageColumn is true')
      }
      const imageContentType = column.imageContentType
      definition.sortable = false
      definition.renderCell = (params: GridRenderCellParams) => {
        const row = params.row as T
        const record = row as Record<string, unknown>
        const keyField = column.imageKeyField ?? column.field
        const imageKey = record[keyField] as string | null | undefined
        const src = resolveContentImageUrl(imageContentType, imageKey)

        const altField =
          column.imageAltField ?? ('name' in record ? 'name' : undefined)
        const alt = altField ? String(record[altField] ?? '') : ''

        const size = column.imageSize ?? 32
        const variant =
          column.imageShape === 'circle' ? 'circular' : 'rounded'

        // Always use resolveContentImageUrl → non-empty src (asset fallback). Do not pass letter
        // children: MUI Avatar shows them while loading and on img error, which flashes initials.
        return (
          <Avatar
            src={src}
            alt={alt}
            variant={variant}
            sx={{ width: size, height: size, fontSize: size * 0.45 }}
          />
        )
      }
    }

    if (column.linkColumn && getDetailLink) {
      const innerRender = definition.renderCell
      definition.renderCell = (params: GridRenderCellParams) => {
        const row = params.row as T
        const content = innerRender
          ? innerRender(params)
          : (params.value as ReactNode)

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

    if (column.switchColumn) {
      definition.renderCell = (params: GridRenderCellParams) => {
        const row = params.row as T
        return renderSwitchColumnCell({
          checked: Boolean(params.value),
          disabled: column.isSwitchDisabled?.(row),
          onChange: (checked) => column.onSwitchChange?.(row, checked),
        })
      }
    }

    if (column.columnHeaderHelperText) {
      const helperText = column.columnHeaderHelperText
      definition.renderHeader = () =>
        renderColumnHeaderWithTooltip({
          headerLabel: column.headerName,
          helperText,
        })
      definition.sortable = false
    }

    return definition
  })
}

function renderSwitchColumnCell(params: {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  const { checked, disabled, onChange } = params
  return (
    <Switch
      checked={checked}
      disabled={disabled}
      onChange={(_event, nextChecked) => onChange(nextChecked)}
      size="small"
    />
  )
}

function renderColumnHeaderWithTooltip(params: {
  headerLabel: string
  helperText: string
}) {
  const { headerLabel, helperText } = params
  return (
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
}
