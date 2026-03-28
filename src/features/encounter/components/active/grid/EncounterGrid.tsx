/**
 * Grid presentation only. Tactical overlays come from the grid view model; viewer visibility comes from
 * `cell.perception` (domain projection) plus `viewerPerceivesOccupantToken` /
 * `viewerOccupantPresentationKind` on the view model (`deriveViewerCombatantPresentationKind`).
 * Do not infer perception rules here.
 */
import { Fragment, type ReactNode, useCallback, useMemo, useRef, useState } from 'react'

import Box from '@mui/material/Box'
import Popover from '@mui/material/Popover'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha, keyframes, useTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import { AppAvatar } from '@/ui/primitives'
import { resolveImageUrl } from '@/shared/lib/media'
import type { GridViewModel, GridCellViewModel } from '../../../space/selectors/space.selectors'
import { DEFEATED_PARTICIPATION_OPACITY } from '../../../domain/presentation-defeated'
import { getCellVisualState, mergePerceptionIntoCellVisualState } from './cellVisualState'
import { getCellVisualSx } from './cellVisualStyles'

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
  hoveredCellId?: string | null
  movementHighlightActive?: boolean
  hasMovementRemaining?: boolean
  creatureTargetingActive?: boolean
  /** When selecting a single map cell (placement), not AoE. */
  singleCellPlacementPickActive?: boolean
  /** When selecting a grid obstacle for object-anchored attached emanations. */
  objectAnchorPickActive?: boolean
}

function tokenRingColor(cell: GridCellViewModel, palette: Theme['palette']) {
  if (cell.occupantSide === 'party') return palette.primary.main
  if (cell.occupantSide === 'enemies') return palette.error?.main ?? '#d32f2f'
  return palette.grey[500]
}

function resolveCellCursor(params: {
  cell: GridCellViewModel
  hoveredCellId: string | null | undefined
  movementHighlightActive: boolean
  hasMovementRemaining: boolean
  creatureTargetingActive: boolean
  singleCellPlacementPickActive: boolean
  objectAnchorPickActive: boolean
  clickable: boolean
}): string {
  const {
    cell,
    hoveredCellId,
    movementHighlightActive,
    hasMovementRemaining,
    creatureTargetingActive,
    singleCellPlacementPickActive,
    objectAnchorPickActive,
    clickable,
  } = params
  const isHover = Boolean(hoveredCellId && hoveredCellId === cell.cellId)
  const isWall = cell.kind === 'wall' || cell.kind === 'blocking'

  if (isHover) {
    if (singleCellPlacementPickActive) {
      if (cell.placementInvalidHover) return 'not-allowed'
      if (cell.placementCastRange && !isWall) return 'pointer'
    }

    if (objectAnchorPickActive) {
      return cell.obstacleKind ? 'pointer' : 'not-allowed'
    }

    const movementIllegal =
      movementHighlightActive &&
      hasMovementRemaining &&
      !cell.occupantId &&
      !isWall &&
      !cell.isReachable

    const targetingIllegalOccupant =
      creatureTargetingActive &&
      Boolean(cell.occupantId) &&
      !cell.isLegalTargetForSelectedAction

    const targetingIllegalEmpty =
      creatureTargetingActive && !cell.occupantId && !isWall

    if (movementIllegal || targetingIllegalOccupant || targetingIllegalEmpty) {
      return 'not-allowed'
    }
  }

  if (clickable) return 'pointer'
  return 'default'
}

function shouldRenderOccupantToken(
  cell: GridCellViewModel,
  viewerCombatantId: string | undefined,
): boolean {
  if (!cell.occupantRendersToken) return false
  if (cell.viewerPerceivesOccupantToken === false) return false
  if (!cell.perception) return true
  switch (cell.perception.occupantTokenVisibility) {
    case 'all':
      return true
    case 'none':
      return false
    case 'self-only':
      return cell.occupantId === viewerCombatantId
    default:
      return true
  }
}

export function EncounterGrid({
  grid,
  zoom,
  pan,
  onPanChange,
  onCellClick,
  onCellHover,
  renderTokenPopover,
  hoveredCellId = null,
  movementHighlightActive = false,
  hasMovementRemaining = false,
  creatureTargetingActive = false,
  singleCellPlacementPickActive = false,
  objectAnchorPickActive = false,
}: EncounterGridProps) {
  const theme = useTheme()
  const { palette } = theme
  const cellSizePx = BASE_CELL_SIZE

  const activeTurnPulse = useMemo(
    () =>
      keyframes`
        0%, 100% {
          box-shadow: 0 0 0 3px ${alpha(palette.secondary.main, 0.98)},
            0 0 16px ${alpha(palette.secondary.main, 0.55)},
            0 0 28px ${alpha(palette.secondary.main, 0.28)};
        }
        50% {
          box-shadow: 0 0 0 4px ${alpha(palette.secondary.main, 0.9)},
            0 0 22px ${alpha(palette.secondary.main, 0.65)},
            0 0 36px ${alpha(palette.secondary.main, 0.35)};
        }
      `,
    [palette.secondary.main],
  )

  const legalTargetRedPulse = useMemo(
    () =>
      keyframes`
        0%, 100% {
          box-shadow: 0 0 0 3px ${alpha(palette.error.main, 0.98)},
            0 0 16px ${alpha(palette.error.main, 0.55)},
            0 0 28px ${alpha(palette.error.main, 0.28)};
        }
        50% {
          box-shadow: 0 0 0 4px ${alpha(palette.error.main, 0.9)},
            0 0 22px ${alpha(palette.error.main, 0.65)},
            0 0 36px ${alpha(palette.error.main, 0.35)};
        }
      `,
    [palette.error.main],
  )

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

  const battlefieldRender = grid.perception?.battlefieldRender
  const viewerCellId = grid.perception?.viewerCellId
  const viewerCombatantId = grid.perception?.viewerCombatantId

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
            position: 'relative',
            display: 'inline-grid',
            gridTemplateColumns: `repeat(${grid.columns}, ${cellSizePx}px)`,
            gridTemplateRows: `repeat(${grid.rows}, ${cellSizePx}px)`,
            gap: '1px',
            bgcolor: 'grey.500',
            border: 1,
            borderColor: 'grey.500',
            borderRadius: 1,
          }}
        >
          {grid.cells.map((cell) => {
            const isWall = cell.kind === 'wall' || cell.kind === 'blocking'
            const clickable = !isWall && Boolean(onCellClick)
            const showOccupantToken = shouldRenderOccupantToken(cell, viewerCombatantId)
            const hasPopover = Boolean(showOccupantToken && renderTokenPopover)
            const tokenSrc = resolveImageUrl(cell.occupantPortraitImageKey)
            const isHoverCell = hoveredCellId === cell.cellId
            const ring = tokenRingColor(cell, palette)

            const cellCursor = resolveCellCursor({
              cell,
              hoveredCellId,
              movementHighlightActive,
              hasMovementRemaining,
              creatureTargetingActive,
              singleCellPlacementPickActive,
              objectAnchorPickActive,
              clickable,
            })

            const tacticalVisual = getCellVisualState(cell, {
              hoveredCellId,
              movementHighlightActive,
              hasMovementRemaining,
            })
            const visual = mergePerceptionIntoCellVisualState(tacticalVisual, cell.perception)
            const liftAboveBlindVeil =
              Boolean(battlefieldRender?.useBlindVeil) && viewerCellId != null && cell.cellId === viewerCellId
            const cellVisualSx = getCellVisualSx(theme, visual)

            const legalTarget = cell.isLegalTargetForSelectedAction
            const showLegalTargetRedPulse =
              legalTarget &&
              !cell.isActive &&
              (isHoverCell || cell.isSelectedTarget)

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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: cellCursor,
                  position: 'relative',
                  zIndex: liftAboveBlindVeil ? 4 : 1,
                  ...cellVisualSx,
                }}
              >
                {showOccupantToken && (
                  <Box
                    onPointerEnter={() => onCellHover?.(cell.cellId)}
                    onMouseEnter={
                      hasPopover
                        ? (e) => handleTokenMouseEnter(e, cell.occupantId!)
                        : undefined
                    }
                    onMouseLeave={hasPopover ? handleTokenMouseLeave : undefined}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      border: '3px solid',
                      borderColor: ring,
                      bgcolor: tokenSrc ? 'transparent' : ring,
                      zIndex: 1,
                      ...(cell.occupantIsDefeated ? { opacity: DEFEATED_PARTICIPATION_OPACITY } : {}),
                      animation: cell.isActive
                        ? `${activeTurnPulse} 2.4s ease-in-out infinite`
                        : showLegalTargetRedPulse
                          ? `${legalTargetRedPulse} 2.4s ease-in-out infinite`
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
                {cell.obstacleLabel && cell.perception?.showObstacleGlyph !== false && (
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

            if (!hasPopover && cell.occupantRendersToken && cell.occupantLabel) {
              return (
                <Tooltip key={cell.cellId} title={cell.occupantLabel} placement="top" arrow>
                  {cellBox}
                </Tooltip>
              )
            }

            return <Fragment key={cell.cellId}>{cellBox}</Fragment>
          })}
          {battlefieldRender?.useBlindVeil ? (
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                pointerEvents: 'none',
                bgcolor: alpha('#000000', battlefieldRender.blindVeilOpacity),
                borderRadius: 1,
              }}
            />
          ) : null}
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
