import { Fragment, type ReactNode, useCallback, useRef, useState } from 'react'

import Box from '@mui/material/Box'
import Popover from '@mui/material/Popover'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { AppAvatar } from '@/ui/primitives'
import { resolveImageUrl } from '@/shared/lib/media'
import type { Theme } from '@mui/material/styles'
import type { GridViewModel, GridCellViewModel } from '../../../space/space.selectors'

const BASE_CELL_SIZE = 48
const HOVER_DELAY_MS = 350

type EncounterGridProps = {
  grid: GridViewModel
  zoom: number
  pan: { x: number; y: number }
  onPanChange: (pan: { x: number; y: number }) => void
  onCellClick?: (cellId: string) => void
  onCellHover?: (cellId: string | null) => void
  renderTokenPopover?: (occupantId: string) => ReactNode
}

function cellColor(cell: GridCellViewModel, palette: Theme['palette']) {
  if (cell.kind === 'wall' || cell.kind === 'blocking') return palette.action.disabledBackground
  if (cell.aoeInvalidOriginHover) return alpha(palette.error.main, 0.42)
  if (cell.aoeOriginLocked) return alpha(palette.warning.main, 0.32)
  if (cell.aoeInTemplate) return alpha(palette.info.main, 0.26)
  if (cell.aoeCastRange) return alpha(palette.success.light, 0.12)
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

export function EncounterGrid({
  grid,
  zoom,
  pan,
  onPanChange,
  onCellClick,
  onCellHover,
  renderTokenPopover,
}: EncounterGridProps) {
  const theme = useTheme()
  const { palette } = theme
  const cellSizePx = BASE_CELL_SIZE

  const dragState = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragMoved = useRef(false)

  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null)
  const [hoveredOccupantId, setHoveredOccupantId] = useState<string | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTokenMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>, occupantId: string) => {
      if (!renderTokenPopover) return
      const anchor = e.currentTarget
      hoverTimer.current = setTimeout(() => {
        setPopoverAnchor(anchor)
        setHoveredOccupantId(occupantId)
      }, HOVER_DELAY_MS)
    },
    [renderTokenPopover],
  )

  const handleTokenMouseLeave = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
    setPopoverAnchor(null)
    setHoveredOccupantId(null)
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      handleTokenMouseLeave()
      dragState.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y }
      dragMoved.current = false
      setIsDragging(true)
    },
    [pan.x, pan.y, handleTokenMouseLeave],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved.current = true
      onPanChange({
        x: dragState.current.startPanX + dx,
        y: dragState.current.startPanY + dy,
      })
    },
    [onPanChange],
  )

  const handlePointerUp = useCallback(() => {
    dragState.current = null
    setIsDragging(false)
  }, [])

  const popoverOpen = Boolean(popoverAnchor) && Boolean(hoveredOccupantId)

  return (
    <Box
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => onCellHover?.(null)}
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
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
          }}
        >
          {grid.cells.map((cell) => {
            const bg = cellColor(cell, palette)
            const isWall = cell.kind === 'wall' || cell.kind === 'blocking'
            const clickable = !isWall && Boolean(onCellClick)
            const hasPopover = Boolean(cell.occupantId && renderTokenPopover)
            const tokenSrc = resolveImageUrl(cell.occupantPortraitImageKey)

            const cellBox = (
              <Box
                onPointerEnter={onCellHover ? () => onCellHover(cell.cellId) : undefined}
                onClick={
                  clickable
                    ? () => {
                        if (!dragMoved.current) onCellClick?.(cell.cellId)
                      }
                    : undefined
                }
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
                    onMouseEnter={
                      hasPopover
                        ? (e) => handleTokenMouseEnter(e, cell.occupantId!)
                        : undefined
                    }
                    onMouseLeave={hasPopover ? handleTokenMouseLeave : undefined}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      border: '2px solid',
                      borderColor: tokenColor(cell, palette),
                      bgcolor: tokenSrc ? 'transparent' : tokenColor(cell, palette),
                      outline: cell.isActive ? `2px solid ${palette.secondary.main}` : undefined,
                      outlineOffset: cell.isActive ? 0 : undefined,
                      boxShadow: cell.isSelectedTarget
                        ? `0 0 0 2px ${palette.primary.main}`
                        : undefined,
                    }}
                  >
                    <AppAvatar
                      src={tokenSrc}
                      name={cell.occupantLabel ?? undefined}
                      size="sm"
                    />
                  </Box>
                )}
                {cell.obstacleLabel && (
                  <Typography
                    variant="caption"
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 2,
                      right: 2,
                      fontWeight: 800,
                      fontSize: '0.6rem',
                      lineHeight: 1,
                      color: 'text.secondary',
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  >
                    {cell.obstacleKind === 'tree' ? 'T' : 'P'}
                  </Typography>
                )}
              </Box>
            )

            if (cell.obstacleLabel) {
              return (
                <Tooltip key={cell.cellId} title={cell.obstacleLabel} placement="top" arrow>
                  {cellBox}
                </Tooltip>
              )
            }

            if (!hasPopover && cell.occupantLabel) {
              return (
                <Tooltip key={cell.cellId} title={cell.occupantLabel} placement="top" arrow>
                  {cellBox}
                </Tooltip>
              )
            }

            return <Fragment key={cell.cellId}>{cellBox}</Fragment>
          })}
        </Box>
      </Box>

      {renderTokenPopover && (
        <Popover
          open={popoverOpen}
          anchorEl={popoverAnchor}
          onClose={handleTokenMouseLeave}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          slotProps={{
            paper: { sx: { pointerEvents: 'none', maxWidth: 320 } },
          }}
          disableRestoreFocus
          sx={{ pointerEvents: 'none' }}
        >
          <Box sx={{ p: 1 }}>
            {hoveredOccupantId && renderTokenPopover(hoveredOccupantId)}
          </Box>
        </Popover>
      )}
    </Box>
  )
}
