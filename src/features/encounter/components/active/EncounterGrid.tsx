import { Fragment } from 'react'

import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import type { GridViewModel, GridCellViewModel } from '../../space/space.selectors'

type EncounterGridProps = {
  grid: GridViewModel
  onCellClick?: (cellId: string) => void
}

function cellColor(cell: GridCellViewModel, palette: Theme['palette']) {
  if (cell.kind === 'wall' || cell.kind === 'blocking') return palette.action.disabledBackground
  if (cell.isActive) return alpha(palette.secondary.main, 0.35)
  if (cell.isSelectedTarget) return alpha(palette.primary.main, 0.30)
  if (cell.isReachable) return alpha(palette.success.light, 0.18)
  if (cell.isInRange) return alpha(palette.secondary.light, 0.12)
  return palette.background.paper
}

function tokenColor(cell: GridCellViewModel, palette: Theme['palette']) {
  if (cell.occupantSide === 'party') return palette.primary.main
  if (cell.occupantSide === 'enemies') return palette.error?.main ?? '#d32f2f'
  return palette.grey[500]
}

function tokenInitials(label: string | null): string {
  if (!label) return '?'
  const words = label.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function EncounterGrid({ grid, onCellClick }: EncounterGridProps) {
  const theme = useTheme()
  const { palette } = theme
  const cellSizePx = 48

  return (
    <Box
      sx={{
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${grid.columns}, ${cellSizePx}px)`,
        gridTemplateRows: `repeat(${grid.rows}, ${cellSizePx}px)`,
        gap: '1px',
        bgcolor: 'divider',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'auto',
        maxWidth: '100%',
      }}
    >
      {grid.cells.map((cell) => {
        const bg = cellColor(cell, palette)
        const isWall = cell.kind === 'wall' || cell.kind === 'blocking'
        const clickable = !isWall && Boolean(onCellClick)

        const cellBox = (
          <Box
            onClick={clickable ? () => onCellClick?.(cell.cellId) : undefined}
            sx={{
              width: cellSizePx,
              height: cellSizePx,
              bgcolor: bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: clickable ? 'pointer' : 'default',
              position: 'relative',
              transition: 'background-color 0.15s',
              '&:hover': clickable
                ? { bgcolor: alpha(palette.action.hover, 0.08) }
                : undefined,
            }}
          >
            {cell.occupantId && (
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: tokenColor(cell, palette),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: cell.isActive ? 2 : 1,
                  borderColor: cell.isActive
                    ? palette.secondary.main
                    : alpha(palette.common.white, 0.4),
                  boxShadow: cell.isSelectedTarget
                    ? `0 0 0 2px ${palette.primary.main}`
                    : undefined,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: palette.common.white,
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  {tokenInitials(cell.occupantLabel)}
                </Typography>
              </Box>
            )}
          </Box>
        )

        if (cell.occupantLabel) {
          return (
            <Tooltip key={cell.cellId} title={cell.occupantLabel} placement="top" arrow>
              {cellBox}
            </Tooltip>
          )
        }

        return <Fragment key={cell.cellId}>{cellBox}</Fragment>
      })}
    </Box>
  )
}
